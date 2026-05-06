// Aafiatak Service Worker for Background Notifications + PWA

const CACHE_NAME = 'aafiatak-v1';
const STATIC_ASSETS = [
  '/',
  '/logo-192.png',
  '/logo-512.png',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification event (FCM background messages)
self.addEventListener('push', (event) => {
  let data = {
    title: 'عافيتك',
    titleAr: 'عافيتك',
    body: 'لديك إشعار جديد',
    bodyAr: 'لديك إشعار جديد',
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    type: 'system',
    priority: 'normal',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload.data, ...payload.notification };
    } catch (e) {
      data.body = event.data.text();
      data.bodyAr = event.data.text();
    }
  }

  const isArabic = true; // Default to Arabic
  const title = isArabic ? (data.titleAr || data.title) : data.title;
  const body = isArabic ? (data.bodyAr || data.body) : data.body;

  const options: NotificationOptions = {
    body,
    icon: data.icon || '/logo-192.png',
    badge: '/badge-72.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: data.priority === 'urgent' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    tag: `aafiatak-${Date.now()}`,
    requireInteraction: data.priority === 'urgent',
    silent: false,
    data: {
      ...data,
      receivedAt: new Date().toISOString(),
    },
    actions: [
      { action: 'view', title: 'عرض' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'aafiatak-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Notify the main app to sync pending notifications
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_NOTIFICATIONS',
      timestamp: new Date().toISOString(),
    });
  });
}

// Message handler from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'VOICE_NOTIFICATION') {
    // Trigger voice notification even in background
    const { title, body, lang } = event.data;
    // Service workers can't use SpeechSynthesis directly,
    // but we can show a notification that triggers voice in the main thread
    self.registration.showNotification(title, {
      body,
      icon: '/logo-192.png',
      badge: '/badge-72.png',
      dir: 'rtl',
      lang: lang || 'ar',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { voiceNotification: true },
    });
  }
});
