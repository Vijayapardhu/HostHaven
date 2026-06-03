const CACHE_NAME = 'hosthaven-vendor-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.notification?.body || data.body || '',
    icon: data.notification?.icon || '/pwa-icon-192.png',
    badge: data.notification?.badge || '/pwa-icon-192.png',
    tag: data.notification?.tag || 'hosthaven-vendor-notification',
    data: data.notification?.data || data.data,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  const title = data.notification?.title || data.title || 'HostHaven Vendor';
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const data = event.notification.data || {};
  let urlToOpen = '/';
  
  // Vendor-specific routes
  if (data.bookingId) {
    urlToOpen = `/bookings/${data.bookingId}`;
  } else if (data.propertyId) {
    urlToOpen = `/properties/${data.propertyId}`;
  } else if (data.type === 'booking') {
    urlToOpen = '/bookings';
  } else if (data.type === 'payout') {
    urlToOpen = '/earnings';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
