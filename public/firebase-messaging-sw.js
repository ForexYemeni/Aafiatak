/* ========================================================
   عافيتك — Unified Service Worker v2.0
   FCM push notifications + caching + VOICE notification support
   
   KEY CHANGES v2.0:
   - Plays notification sound when background message arrives
   - Adds "استمع" (Listen) action button on notifications
   - When user clicks notification → opens app and triggers TTS
   - Communicates with the app via postMessage to auto-speak
   ======================================================== */

// ─── Firebase Cloud Messaging ───
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
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
const CACHE_NAME = 'afiyatak-v3';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/sounds/emergency.wav',
  '/sounds/assignment.wav',
  '/sounds/chat.wav',
  '/sounds/payment.wav',
  '/sounds/reminder.wav',
  '/sounds/status_change.wav',
  '/sounds/system.wav',
  '/sounds/rating.wav',
  '/sounds/appointment.wav',
];

// ═══════════════════════════════════════════════════════
//  PRE-CACHE SOUNDS DURING INSTALL
// ═══════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache static assets - don't block on sound files if they fail
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn('SW: Failed to cache', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

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
//  NOTIFICATION SOUND IN SERVICE WORKER
// ═══════════════════════════════════════════════════════

// Map notification types to sound files
const SOUND_MAP = {
  assignment: '/sounds/assignment.wav',
  chat: '/sounds/chat.wav',
  emergency: '/sounds/emergency.wav',
  payment: '/sounds/payment.wav',
  rating: '/sounds/rating.wav',
  status_change: '/sounds/status_change.wav',
  system: '/sounds/system.wav',
  reminder: '/sounds/reminder.wav',
  appointment: '/sounds/appointment.wav',
};

/**
 * Play a notification sound in the Service Worker context.
 * Uses the AudioContext API available in Service Workers (Chrome/Edge).
 * Falls back to the browser's default notification sound.
 */
async function playServiceWorkerSound(type) {
  try {
    // Try to use the Service Worker's AudioContext (available in some browsers)
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AC = AudioContext || webkitAudioContext;
      const ctx = new AC();
      
      // Different tones for different notification types
      const tones = {
        emergency:    { freq: 1200, dur: 250, repeat: 3, gap: 150, wave: 'sawtooth' },
        assignment:   { freq: 880,  dur: 180, repeat: 2, gap: 120, wave: 'sine' },
        chat:         { freq: 660,  dur: 120, repeat: 3, gap: 60,  wave: 'triangle' },
        payment:      { freq: 523,  dur: 200, repeat: 2, gap: 100, wave: 'sine' },
        rating:       { freq: 784,  dur: 120, repeat: 2, gap: 80,  wave: 'sine' },
        status_change:{ freq: 440,  dur: 250, repeat: 1, gap: 0,   wave: 'sine' },
        system:       { freq: 600,  dur: 150, repeat: 2, gap: 100, wave: 'triangle' },
        reminder:     { freq: 700,  dur: 180, repeat: 2, gap: 120, wave: 'sine' },
        appointment:  { freq: 932,  dur: 150, repeat: 2, gap: 80,  wave: 'sine' },
      };

      const t = tones[type] || tones.system;

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      for (let i = 0; i < t.repeat; i++) {
        const start = ctx.currentTime + (i * (t.dur + t.gap)) / 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = t.freq;
        osc.type = t.wave;

        // Smooth envelope
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.6, start + 0.01);
        gain.gain.setValueAtTime(0.6, start + t.dur / 1000 - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000);

        osc.start(start);
        osc.stop(start + t.dur / 1000 + 0.01);
      }

      console.log('🔊 [SW] Played tone for:', type);
      return;
    }
  } catch (e) {
    console.warn('🔊 [SW] AudioContext tone failed:', e.message);
  }

  // Fallback: Try to play the actual WAV file via a client window
  try {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientList.length > 0) {
      // There's an open window - ask it to play the sound
      clientList[0].postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        notifType: type,
      });
    }
  } catch (e) {
    console.warn('🔊 [SW] Sound fallback failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  PUSH NOTIFICATIONS (FCM Background Messages)
// ═══════════════════════════════════════════════════════

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const { type, url, sound, titleAr, bodyAr, titleEn, bodyEn } = payload.data || {};

  const notifType = type || 'system';

  // Notification type configuration
  const typeConfig = {
    assignment:    { icon: '/logo.png', badge: '/logo.png', tag: 'assignment', vibrate: [200, 50, 200], requireInteraction: true },
    chat:          { icon: '/logo.png', badge: '/logo.png', tag: 'chat', vibrate: [100], requireInteraction: false },
    payment:       { icon: '/logo.png', badge: '/logo.png', tag: 'payment', vibrate: [150, 50, 150], requireInteraction: false },
    emergency:     { icon: '/logo.png', badge: '/logo.png', tag: 'emergency', vibrate: [200, 100, 200, 100, 200, 100, 200], requireInteraction: true },
    status_change: { icon: '/logo.png', badge: '/logo.png', tag: 'status', vibrate: [100], requireInteraction: false },
    rating:        { icon: '/logo.png', badge: '/logo.png', tag: 'rating', vibrate: [150, 50, 150], requireInteraction: false },
    system:        { icon: '/logo.png', badge: '/logo.png', tag: 'system', vibrate: [100], requireInteraction: false },
    reminder:      { icon: '/logo.png', badge: '/logo.png', tag: 'reminder', vibrate: [150, 80, 150], requireInteraction: false },
    appointment:   { icon: '/logo.png', badge: '/logo.png', tag: 'appointment', vibrate: [200, 50, 200], requireInteraction: false },
  };

  const config = typeConfig[notifType] || typeConfig.system;

  // Play the notification sound
  playServiceWorkerSound(notifType);

  // Build notification data for TTS
  const ttsData = {
    titleAr: titleAr || title || 'إشعار جديد',
    bodyAr: bodyAr || body || '',
    titleEn: titleEn || title || 'New Notification',
    bodyEn: bodyEn || body || '',
    notifType: notifType,
  };

  const notificationOptions = {
    body: body || '',
    icon: config.icon,
    badge: config.badge,
    tag: `aafiatak-${config.tag}-${Date.now()}`,
    data: {
      url: url || '/',
      type: notifType,
      // Store TTS data so we can speak when the user clicks
      ttsTitle: title || '',
      ttsBody: body || '',
      ttsTitleAr: ttsData.titleAr,
      ttsBodyAr: ttsData.bodyAr,
      ttsType: notifType,
      shouldSpeak: 'true', // Flag to trigger TTS on click
      ...payload.data,
    },
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: config.requireInteraction,
    silent: false, // Important: let the browser play its notification sound too
    vibrate: config.vibrate,
    renotify: true,
    actions: [
      { action: 'speak', title: '🔊 استمع' },
      { action: 'open', title: '📂 فتح التطبيق' },
      { action: 'dismiss', title: '✕ إغلاق' },
    ],
  };

  return self.registration.showNotification(title || 'عافيتك', notificationOptions);
});

// ─── Notification click handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Dismiss action - just close
  if (action === 'dismiss') return;

  // Both 'speak' and 'open' and default click should open the app
  // The app will receive a message to play TTS
  const shouldSpeak = action === 'speak' || data.shouldSpeak === 'true' || !action;
  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          // Send message to the client to trigger TTS
          if (shouldSpeak) {
            setTimeout(() => {
              client.postMessage({
                type: 'NOTIFICATION_CLICKED_SPEAK',
                title: data.ttsTitle || data.title || '',
                body: data.ttsBody || data.body || data.message || '',
                titleAr: data.ttsTitleAr || data.titleAr || data.title || '',
                bodyAr: data.ttsBodyAr || data.bodyAr || data.body || data.message || '',
                notifType: data.ttsType || data.type || 'system',
                url: targetUrl,
              });
            }, 500); // Small delay to let the page load
          }
          return client.focus();
        }
      }
      
      // No existing window - open a new one
      // Pass TTS data as URL params so the app can auto-speak on load
      const ttsParams = shouldSpeak ? 
        `&speak=1&st=${encodeURIComponent(data.ttsTitleAr || data.ttsTitle || '')}&sb=${encodeURIComponent(data.ttsBodyAr || data.ttsBody || '')}&stt=${data.ttsType || 'system'}` : '';
      const fullUrl = targetUrl + (targetUrl.includes('?') ? ttsParams : '?' + ttsParams.replace(/^&/, ''));
      
      return clients.openWindow(fullUrl);
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
//  MESSAGE HANDLER (from the web app)
// ═══════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ═══════════════════════════════════════════════════════
//  CACHING STRATEGIES
// ═══════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
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

  // Cache sound files aggressively
  if (url.pathname.startsWith('/sounds/')) {
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

  // Network-first for HTML pages
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

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
