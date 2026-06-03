const CACHE_NAME = 'hosthaven-v1';

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
    icon: data.notification?.icon || '/logo.png',
    image: data.notification?.image || data.notification?.data?.imageUrl,
    badge: data.notification?.badge || '/logo.png',
    tag: data.notification?.tag || 'hosthaven-notification',
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
  
  const title = data.notification?.title || data.title || 'HostHaven';
  
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
  
  if (data.bookingId) {
    urlToOpen = `/bookings/${data.bookingId}`;
  } else if (data.propertyId) {
    urlToOpen = `/hotels/${data.propertyId}`;
  } else if (data.ticketId) {
    urlToOpen = `/support/${data.ticketId}`;
  } else if (data.type === 'booking') {
    urlToOpen = '/profile';
  } else if (data.type === 'support') {
    urlToOpen = '/support';
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
