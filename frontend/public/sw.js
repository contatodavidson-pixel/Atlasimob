// Atlas Service Worker — Push Notifications
const CACHE_NAME = 'atlas-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || '🏠 Atlas — Nova Oportunidade';
  const options = {
    body: data.body || 'Um novo STRONG_DEAL foi detectado.',
    icon: '/atlas-logo.png',
    badge: '/atlas-logo.png',
    tag: data.tag || 'atlas-deal',
    data: { url: data.url || '/dashboard/feed' },
    actions: [
      { action: 'view', title: 'Ver agora' },
      { action: 'dismiss', title: 'Ignorar' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard/feed';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else self.clients.openWindow(url);
    })
  );
});
