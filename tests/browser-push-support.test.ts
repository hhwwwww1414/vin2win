import assert from 'node:assert/strict';
import test from 'node:test';
import {
  browserPushSubscriptionMatchesVapidKey,
  getBrowserPushSupportState,
  getPushSubscriptionErrorMessage,
  getVapidPublicKeyValidationError,
} from '@/lib/push/browser';

function decodeBase64Url(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

test('browser push requires standalone install on iPhone web apps', () => {
  const support = getBrowserPushSupportState({
    notificationsAvailable: true,
    serviceWorkerAvailable: true,
    pushManagerAvailable: true,
    vapidPublicKeyConfigured: true,
    permission: 'default',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    isStandalone: false,
  });

  assert.equal(support.state, 'ios-install-required');
  assert.match(support.message, /экран/i);
});

test('browser push is available on desktop when APIs and VAPID are configured', () => {
  const support = getBrowserPushSupportState({
    notificationsAvailable: true,
    serviceWorkerAvailable: true,
    pushManagerAvailable: true,
    vapidPublicKeyConfigured: true,
    permission: 'default',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    isStandalone: false,
  });

  assert.equal(support.state, 'supported');
});

test('invalid VAPID public key is rejected before subscribe', () => {
  assert.equal(
    getVapidPublicKeyValidationError('not-a-real-vapid-key'),
    'Push-канал настроен некорректно: публичный VAPID-ключ не похож на браузерный P-256 ключ.',
  );
});

test('push service abort is mapped to actionable VAPID guidance', () => {
  const error = new DOMException('Registration failed - push service error', 'AbortError');

  assert.match(
    getPushSubscriptionErrorMessage(error),
    /неверный публичный VAPID-ключ/i,
  );
});

test('browser push detects subscriptions created with another VAPID key', () => {
  const currentKey =
    'BL-Ee4nIV3PODAdXCjnaPVOBE13poOYc7QQESSxeMEPZlQ7wXMhGgHklGX3KKLWrW9L3IB8mmapOYVjB0o73qyM';
  const oldKey =
    'BEOq7xk_zBweuMdfB678Da37rJItsffyTD0HmfPjKcXNAqTRDmIqXUxDaqPAKFN8j_SRFETx7eHJyqJjoqGM63A';

  assert.equal(
    browserPushSubscriptionMatchesVapidKey(
      {
        options: {
          applicationServerKey: decodeBase64Url(currentKey).buffer,
        },
      } as Pick<PushSubscription, 'options'>,
      currentKey,
    ),
    true,
  );

  assert.equal(
    browserPushSubscriptionMatchesVapidKey(
      {
        options: {
          applicationServerKey: decodeBase64Url(oldKey).buffer,
        },
      } as Pick<PushSubscription, 'options'>,
      currentKey,
    ),
    false,
  );
});
