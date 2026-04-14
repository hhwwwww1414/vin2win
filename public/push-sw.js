self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'vin2win',
      body: event.data.text() || 'Появилось новое уведомление по вашим объявлениям или запросам.',
      href: '/',
      tag: `vin2win:${Date.now()}`,
    };
  }

  const title = payload.title || 'vin2win';
  const options = {
    body: payload.body || '',
    data: {
      href: payload.href || '/',
      notificationId: payload.notificationId || null,
    },
    tag: payload.tag || `vin2win:${Date.now()}`,
    requireInteraction: Boolean(payload.requireInteraction),
    renotify: true,
    timestamp: payload.timestamp || Date.now(),
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
  };

  const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) =>
    Promise.all(
      clients.map((client) =>
        client.postMessage({
          type: 'vin2win-push-received',
          payload,
        })
      )
    )
  );

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), broadcastPromise]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = event.notification.data?.href || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => 'focus' in client);
      if (existingClient) {
        existingClient.navigate(href);
        return existingClient.focus();
      }

      return self.clients.openWindow(href);
    })
  );
});
