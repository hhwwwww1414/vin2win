import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrowserPushSupportState } from '@/lib/push/browser';

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
