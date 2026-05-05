/* ========================================================
   عافيتك — Firebase Cloud Messaging Service Worker
   Handles push notifications when app is in background/closed
   ======================================================== */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDummyReplaceMe",
  authDomain: "aafiatak-26439.firebaseapp.com",
  projectId: "aafiatak-26439",
  storageBucket: "aafiatak-26439.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
});

const messaging = firebase.messaging();

// ─── Background message handler (app closed/minimized) ───
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const { type, url, sound } = payload.data || {};

  // Notification type → icon & color mapping
  const typeConfig = {
    assignment: { icon: '/icons/nurse-96.png', badge: '/icons/badge-assignment.png', tag: 'assignment' },
    chat: { icon: '/icons/chat-96.png', badge: '/icons/badge-chat.png', tag: 'chat' },
    payment: { icon: '/icons/payment-96.png', badge: '/icons/badge-payment.png', tag: 'payment' },
    emergency: { icon: '/icons/emergency-96.png', badge: '/icons/badge-emergency.png', tag: 'emergency' },
    status_change: { icon: '/icons/status-96.png', badge: '/icons/badge-status.png', tag: 'status' },
    rating: { icon: '/icons/rating-96.png', badge: '/icons/badge-rating.png', tag: 'rating' },
    system: { icon: '/logo.png', badge: '/icons/badge-system.png', tag: 'system' },
    reminder: { icon: '/icons/reminder-96.png', badge: '/icons/badge-reminder.png', tag: 'reminder' },
  };

  const config = typeConfig[type] || typeConfig.system;

  const notificationOptions = {
    body: body || '',
    icon: config.icon,
    badge: config.badge,
    tag: `${config.tag}-${Date.now()}`,
    data: { url: url || '/', type: type || 'system', ...payload.data },
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: type === 'emergency' || type === 'assignment',
    silent: false,
    vibrate: type === 'emergency'
      ? [200, 100, 200, 100, 200, 100, 200]
      : type === 'assignment'
      ? [200, 50, 200]
      : [100],
    actions: type === 'assignment' || type === 'emergency'
      ? [
          { action: 'open', title: 'فتح التطبيق' },
          { action: 'dismiss', title: 'تجاهل' }
        ]
      : undefined,
  };

  return self.registration.showNotification(title || 'عافيتك', notificationOptions);
});

// ─── Notification click handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') return;

  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── Push event handler (fallback for non-FCM pushes) ───
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // If FCM already handled it via onBackgroundMessage, skip
      if (data.from === 'fcm') return;
    } catch {
      // Not JSON, handle raw push
    }
  }
});
