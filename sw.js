// Canopy service worker.
//
// Two separate jobs live here:
// 1. Local notification display (showNotification) — required for
//    Android Chrome to show notifications at all, no server involved.
// 2. Real Web Push ('push' event below) — only does anything once a
//    push subscription has been created (Settings → Developer → Push
//    Notifications) pointing at a deployed push-server. Without that,
//    this worker never receives a 'push' event at all; nothing here
//    "phones home" on its own.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Tapping a reminder focuses an existing Canopy tab if one's open,
// otherwise opens a new one — same behavior people expect from any
// other app's notifications.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// A real push message arrived from the push-server (this fires even if
// no Canopy tab is open at all — that's the entire point of it existing).
self.addEventListener('push', (event) => {
  let data = { title: 'Canopy', body: '' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Canopy', { body: data.body || '' })
  );
});
