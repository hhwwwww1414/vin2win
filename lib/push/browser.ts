'use client';

export type BrowserPushSupportState =
  | 'supported'
  | 'unsupported'
  | 'missing-config'
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
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

export async function subscribeBrowserPushWithRecovery(vapidPublicKey: string) {
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
        return existingSubscription;
      }

      return await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
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
    if (error.name === 'AbortError') {
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

export async function savePushSubscription(
  subscription: PushSubscription,
  options: {
    enableChatPush?: boolean;
  } = {},
) {
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

  const subscription = await subscribeBrowserPushWithRecovery(input.vapidPublicKey);
  await savePushSubscription(subscription, {
    enableChatPush: input.enableChatPush,
  });

  return {
    permission,
    subscription,
  };
}
