/* ========================================================
   عافيتك — Unified Service Worker
   Combines FCM push notifications + caching strategies
   Handles notifications when app is in background/closed
   ======================================================== */

// ─── Firebase Cloud Messaging ───
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in the service worker with REAL config
firebase.initializeApp({
  apiKey: "AIzaSyA_WgNDBnSt3fvPDz3IfGeb5GCwjlgp5fA",
  authDomain: "aafiatak-26439.firebaseapp.com",
  projectId: "aafiatak-26439",
  storageBucket: "aafiatak-26439.firebasestorage.app",
  messagingSenderId: "880926880101",
  appId: "1:880926880101:web:efe1be2de1aed6fbeb318c",
  measurementId: "G-SQY8MFPWN4"
});

const messaging = firebase.messaging();

// ─── Cache Configuration ───
const CACHE_NAME = 'afiyatak-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
];

// ═══════════════════════════════════════════════════════
//  SERVICE WORKER LIFECYCLE
// ═══════════════════════════════════════════════════════

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
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

// ═══════════════════════════════════════════════════════
//  PUSH NOTIFICATIONS (FCM Background Messages)
// ═══════════════════════════════════════════════════════

// Background message handler (app closed/minimized)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const { type, url, sound } = payload.data || {};

  // Notification type configuration
  const typeConfig = {
    assignment: { icon: '/logo.png', badge: '/logo.png', tag: 'assignment', vibrate: [200, 50, 200] },
    chat: { icon: '/logo.png', badge: '/logo.png', tag: 'chat', vibrate: [100] },
    payment: { icon: '/logo.png', badge: '/logo.png', tag: 'payment', vibrate: [150, 50, 150] },
    emergency: { icon: '/logo.png', badge: '/logo.png', tag: 'emergency', vibrate: [200, 100, 200, 100, 200, 100, 200] },
    status_change: { icon: '/logo.png', badge: '/logo.png', tag: 'status', vibrate: [100] },
    rating: { icon: '/logo.png', badge: '/logo.png', tag: 'rating', vibrate: [150, 50, 150] },
    system: { icon: '/logo.png', badge: '/logo.png', tag: 'system', vibrate: [100] },
    reminder: { icon: '/logo.png', badge: '/logo.png', tag: 'reminder', vibrate: [150, 80, 150] },
    appointment: { icon: '/logo.png', badge: '/logo.png', tag: 'appointment', vibrate: [200, 50, 200] },
  };

  const config = typeConfig[type] || typeConfig.system;

  const notificationOptions = {
    body: body || '',
    icon: config.icon,
    badge: config.badge,
    tag: `aafiatak-${config.tag}`,
    data: { url: url || '/', type: type || 'system', ...payload.data },
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: type === 'emergency' || type === 'assignment',
    silent: false,
    vibrate: config.vibrate,
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

// ═══════════════════════════════════════════════════════
//  CACHING STRATEGIES
// ═══════════════════════════════════════════════════════

// Fetch: strategy based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first strategy for images and fonts
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname.match(/\.(woff2?|ttf|eot|otf)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for static assets (JS, CSS)
  if (
    url.pathname.match(/\.(js|css)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Network-first for HTML pages (navigation)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first with offline fallback page
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عافيتك - غير متصل</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
            direction: rtl;
            text-align: center;
            padding: 2rem;
          }
          .container {
            max-width: 400px;
            padding: 2rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #e11d48; margin-bottom: 0.5rem; font-size: 1.5rem; }
          p { color: #666; line-height: 1.6; }
          button {
            margin-top: 1.5rem;
            padding: 0.75rem 2rem;
            background: #e11d48;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-family: inherit;
          }
          button:hover { background: #be123c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>غير متصل بالإنترنت</h1>
          <p>يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
          <button onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

// Cache-first: try cache, fall back to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 404, statusText: 'Not Found' });
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}
