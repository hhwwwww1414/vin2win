'use client';

export type BrowserPushSupportState =
  | 'supported'
  | 'unsupported'
  | 'missing-config'
  | 'invalid-config'
  | 'ios-install-required';

export interface BrowserPushSupportSnapshot {
  notificationsAvailable: boolean;
  serviceWorkerAvailable: boolean;
  pushManagerAvailable: boolean;
  vapidPublicKeyConfigured: boolean;
  permission: NotificationPermission | 'unsupported';
  userAgent: string;
  isStandalone: boolean;
}

export interface BrowserPushSupportResult {
  state: BrowserPushSupportState;
  canRequestPermission: boolean;
  message: string;
  permission: NotificationPermission | 'unsupported';
  requiresStandaloneInstall: boolean;
}

const INVALID_VAPID_PUBLIC_KEY_MESSAGE =
  'Push-канал настроен некорректно: публичный VAPID-ключ не похож на браузерный P-256 ключ.';

export const PUSH_PUBLIC_KEY_CACHE_TTL_MS = 10 * 60_000;

let browserPushPublicKeyCache: { value: string | undefined; timestamp: number } | null = null;
let browserPushPublicKeyRequest: Promise<string | undefined> | null = null;

function isBrowserPushPublicKeyCacheFresh() {
  return Boolean(
    browserPushPublicKeyCache &&
      Date.now() - browserPushPublicKeyCache.timestamp < PUSH_PUBLIC_KEY_CACHE_TTL_MS,
  );
}

function isAppleMobileUserAgent(userAgent: string) {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function getBrowserPushSupportState(
  snapshot: BrowserPushSupportSnapshot,
): BrowserPushSupportResult {
  if (
    !snapshot.notificationsAvailable ||
    !snapshot.serviceWorkerAvailable ||
    !snapshot.pushManagerAvailable
  ) {
    return {
      state: 'unsupported',
      canRequestPermission: false,
      permission: snapshot.permission,
      requiresStandaloneInstall: false,
      message:
        'Этот браузер не поддерживает web push для vin2win. Используйте актуальный Safari, Chrome, Edge или установленное web app.',
    };
  }

  if (!snapshot.vapidPublicKeyConfigured) {
    return {
      state: 'missing-config',
      canRequestPermission: false,
      permission: snapshot.permission,
      requiresStandaloneInstall: false,
      message:
        'Push-канал ещё не настроен на сервере: отсутствует публичный VAPID-ключ. Разрешение браузера пока запрашивать бесполезно.',
    };
  }

  if (isAppleMobileUserAgent(snapshot.userAgent) && !snapshot.isStandalone) {
    return {
      state: 'ios-install-required',
      canRequestPermission: false,
      permission: snapshot.permission,
      requiresStandaloneInstall: true,
      message:
        'На iPhone и iPad web push работает только из установленного приложения на экране Домой. Откройте Share -> Add to Home Screen, затем включите уведомления уже из установленного web app.',
    };
  }

  return {
    state: 'supported',
    canRequestPermission: snapshot.permission !== 'denied',
    permission: snapshot.permission,
    requiresStandaloneInstall: false,
    message: 'Браузер готов к подписке на push-уведомления.',
  };
}

export function detectBrowserPushSupport(
  vapidPublicKey?: string,
): BrowserPushSupportResult {
  if (typeof window === 'undefined') {
    return {
      state: 'unsupported',
      canRequestPermission: false,
      permission: 'unsupported',
      requiresStandaloneInstall: false,
      message: 'Browser APIs недоступны во время SSR.',
    };
  }

  const standaloneMatch =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const legacyStandalone =
    'standalone' in window.navigator &&
    Boolean(
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone,
    );

  const vapidPublicKeyError = getVapidPublicKeyValidationError(vapidPublicKey);

  if (vapidPublicKey && vapidPublicKeyError) {
    return {
      state: 'invalid-config',
      canRequestPermission: false,
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
      requiresStandaloneInstall: false,
      message: vapidPublicKeyError,
    };
  }

  return getBrowserPushSupportState({
    notificationsAvailable: 'Notification' in window,
    serviceWorkerAvailable: 'serviceWorker' in navigator,
    pushManagerAvailable: 'PushManager' in window,
    vapidPublicKeyConfigured: Boolean(vapidPublicKey),
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    userAgent: navigator.userAgent,
    isStandalone: standaloneMatch || legacyStandalone,
  });
}

function decodeUrlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const atobFn =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob.bind(window)
      : typeof globalThis.atob === 'function'
        ? globalThis.atob.bind(globalThis)
        : null;

  if (!atobFn) {
    throw new Error('Base64 decoder is not available in this runtime.');
  }

  const rawData = atobFn(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function urlBase64ToUint8Array(base64String: string) {
  return decodeUrlBase64ToUint8Array(base64String);
}

function toUint8Array(value: ArrayBuffer | ArrayBufferView | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  return null;
}

function uint8ArraysEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function browserPushSubscriptionMatchesVapidKey(
  subscription: Pick<PushSubscription, 'options'>,
  vapidPublicKey: string,
) {
  const configuredKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscriptionKey = toUint8Array(subscription.options.applicationServerKey);

  if (!subscriptionKey) {
    return false;
  }

  return uint8ArraysEqual(subscriptionKey, configuredKey);
}

export function getVapidPublicKeyValidationError(
  vapidPublicKey?: string,
): string | null {
  if (!vapidPublicKey) {
    return null;
  }

  try {
    const bytes = decodeUrlBase64ToUint8Array(vapidPublicKey);

    if (bytes.length !== 65 || bytes[0] !== 0x04) {
      return INVALID_VAPID_PUBLIC_KEY_MESSAGE;
    }

    return null;
  } catch {
    return INVALID_VAPID_PUBLIC_KEY_MESSAGE;
  }
}

async function waitForActiveServiceWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) {
    return registration;
  }

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    return navigator.serviceWorker.ready;
  }

  await new Promise<void>((resolve, reject) => {
    const handleStateChange = () => {
      if (worker.state === 'activated') {
        cleanup();
        resolve();
        return;
      }

      if (worker.state === 'redundant') {
        cleanup();
        reject(new Error('Сервис уведомлений не был активирован.'));
      }
    };

    const cleanup = () => {
      worker.removeEventListener('statechange', handleStateChange);
    };

    worker.addEventListener('statechange', handleStateChange);
    handleStateChange();
  });

  return navigator.serviceWorker.ready;
}

async function unregisterPushServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      try {
        await registration.unregister();
      } catch (error) {
        console.warn('[push] failed to unregister service worker', error);
      }
    }),
  );
}

async function removePushSubscriptionByEndpoint(endpoint: string) {
  try {
    await fetch('/api/account/push-subscriptions', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
      }),
    });
  } catch (error) {
    console.warn('[push] failed to remove previous browser subscription', error);
  }
}

export async function subscribeBrowserPushWithRecovery(vapidPublicKey: string) {
  const vapidPublicKeyError = getVapidPublicKeyValidationError(vapidPublicKey);
  if (vapidPublicKeyError) {
    throw new Error(vapidPublicKeyError);
  }

  let lastError: unknown;

  for (const shouldReset of [false, true]) {
    try {
      if (shouldReset) {
        await unregisterPushServiceWorkers();
      }

      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      const activeRegistration = await waitForActiveServiceWorker(registration);
      const existingSubscription = await activeRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        if (browserPushSubscriptionMatchesVapidKey(existingSubscription, vapidPublicKey)) {
          return {
            subscription: existingSubscription,
          };
        }

        const replacedEndpoint =
          existingSubscription.endpoint !== '' ? existingSubscription.endpoint : undefined;

        await existingSubscription.unsubscribe();
        const subscription = await activeRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        return {
          subscription,
          replacedEndpoint,
        };
      }

      const subscription = await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      return {
        subscription,
      };
    } catch (error) {
      lastError = error;

      if (!(error instanceof Error)) {
        break;
      }

      if (!['AbortError', 'InvalidStateError'].includes(error.name) || shouldReset) {
        break;
      }
    }
  }

  throw lastError;
}

export function getPushSubscriptionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === INVALID_VAPID_PUBLIC_KEY_MESSAGE) {
      return error.message;
    }

    if (error.name === 'AbortError') {
      if (/push service error/i.test(error.message)) {
        return 'Не удалось подключить браузерные уведомления. Push-service отклонил регистрацию, обычно это означает неверный публичный VAPID-ключ на текущем окружении.';
      }

      return `Не удалось подключить браузерные уведомления. ${
        error.message || 'Попробуйте повторить попытку после обновления страницы и очистки сервисного кэша.'
      }`;
    }

    if (error.name === 'InvalidStateError') {
      return `Service worker не готов для push. ${
        error.message || 'Повторите попытку через несколько секунд.'
      }`;
    }

    if (error.name === 'NotAllowedError') {
      return 'Браузер заблокировал уведомления для этого сайта.';
    }

    return error.message;
  }

  return 'Не удалось подключить браузерные уведомления.';
}

async function requestBrowserPushVapidPublicKey() {
  const response = await fetch('/api/push/public-key', {
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        publicKey?: string | null;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РєРѕРЅС„РёРіСѓСЂР°С†РёСЋ browser push.',
    );
  }

  const value = typeof payload?.publicKey === 'string' ? payload.publicKey : undefined;
  browserPushPublicKeyCache = {
    value,
    timestamp: Date.now(),
  };

  return value;
}

export async function fetchBrowserPushVapidPublicKey() {
  if (isBrowserPushPublicKeyCacheFresh()) {
    return browserPushPublicKeyCache?.value;
  }

  browserPushPublicKeyRequest ??= requestBrowserPushVapidPublicKey().finally(() => {
    browserPushPublicKeyRequest = null;
  });

  return browserPushPublicKeyRequest;
}

export async function savePushSubscription(
  subscription: PushSubscription,
  options: {
    enableChatPush?: boolean;
    replacedEndpoint?: string;
  } = {},
) {
  if (options.replacedEndpoint && options.replacedEndpoint !== subscription.endpoint) {
    await removePushSubscriptionByEndpoint(options.replacedEndpoint);
  }

  const response = await fetch('/api/account/push-subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? 'Не удалось сохранить браузерную подписку.');
  }

  if (options.enableChatPush) {
    const settingsResponse = await fetch('/api/account/notification-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        browserPushEnabled: true,
        chatPushEnabled: true,
      }),
    });

    const settingsPayload = (await settingsResponse.json().catch(() => null)) as
      | { error?: string }
      | null;
    if (!settingsResponse.ok) {
      throw new Error(
        settingsPayload?.error ?? 'Не удалось включить push-уведомления для чатов.',
      );
    }
  }
}

export async function requestBrowserPushPermissionAndSubscribe(input: {
  vapidPublicKey: string;
  enableChatPush?: boolean;
}) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Браузер не выдал разрешение на уведомления.');
  }

  const result = await subscribeBrowserPushWithRecovery(input.vapidPublicKey);
  await savePushSubscription(result.subscription, {
    enableChatPush: input.enableChatPush,
    replacedEndpoint: result.replacedEndpoint,
  });

  return {
    permission,
    subscription: result.subscription,
  };
}
