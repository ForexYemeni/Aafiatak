/* ========================================================
   عافيتك — Unified Service Worker v4.0 (DATA-ONLY FIX)
   FCM push notifications + caching + VOICE notification support
   PWA Install support + Enhanced offline experience

   ★★★ CRITICAL FIX v4.0 ★★★
   Previous versions used `notification` + `data` FCM messages.
   When BOTH fields are present, the browser auto-handles the
   notification and onBackgroundMessage is NEVER called.
   
   FIX: Now sending DATA-ONLY messages from the server.
   The SW reads title/body from `payload.data` instead of
   `payload.notification`, and ALWAYS creates the notification
   manually with full control over sound, TTS, actions, etc.
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
const CACHE_NAME = 'afiyatak-v5';
const RUNTIME_CACHE = 'afiyatak-runtime-v5';

const PRECACHE_URLS = [
  '/',
  '/logo.png',
  '/logo-192.png',
  '/logo-512.png',
  '/manifest.json',
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
//  PRE-CACHE ASSETS DURING INSTALL
// ═══════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[SW v4] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache', url, err);
          })
        )
      );
    })
  );
  // Force activation immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v4] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// ═══════════════════════════════════════════════════════
//  NOTIFICATION SOUND IN SERVICE WORKER
// ═══════════════════════════════════════════════════════

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
 * Uses Web Audio API (oscillator) which works in Chrome/Edge SW.
 */
async function playServiceWorkerSound(type) {
  try {
    // Try Web Audio API in Service Worker
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AC = AudioContext || webkitAudioContext;
      const ctx = new AC();

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

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.7, start + 0.01);
        gain.gain.setValueAtTime(0.7, start + t.dur / 1000 - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur / 1000);

        osc.start(start);
        osc.stop(start + t.dur / 1000 + 0.01);
      }

      console.log('[SW] Played tone for:', type);
      return;
    }
  } catch (e) {
    console.warn('[SW] AudioContext tone failed:', e.message);
  }

  // Fallback: Ask any open window to play the sound
  try {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientList.length > 0) {
      clientList[0].postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        notifType: type,
      });
    }
  } catch (e) {
    console.warn('[SW] Sound fallback failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  PUSH NOTIFICATIONS (FCM Background Messages)
//  ★★★ DATA-ONLY: Always reads from payload.data ★★★
// ═══════════════════════════════════════════════════════

messaging.onBackgroundMessage((payload) => {
  console.log('[SW v4] Background message received:', JSON.stringify(payload));

  // ★★★ DATA-ONLY FIX: Read title/body from payload.data, NOT payload.notification ★★★
  const d = payload.data || {};
  const title = d.title || d.titleAr || 'عافيتك';
  const body = d.body || d.bodyAr || '';
  const notifType = d.type || 'system';
  const url = d.url || d.clickAction || '/';
  const voiceText = d.voiceText || '';
  const voicePriority = d.voicePriority || (notifType === 'emergency' ? 'urgent' : 'normal');
  const titleAr = d.titleAr || d.title || 'إشعار جديد';
  const bodyAr = d.bodyAr || d.body || voiceText || '';
  const notifId = d.id || d.requestId || '';

  // Notification type configuration
  const typeConfig = {
    assignment:    { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'assignment', vibrate: [200, 50, 200], requireInteraction: true },
    chat:          { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'chat', vibrate: [100], requireInteraction: false },
    payment:       { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'payment', vibrate: [150, 50, 150], requireInteraction: false },
    emergency:     { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'emergency', vibrate: [200, 100, 200, 100, 200, 100, 200], requireInteraction: true },
    status_change: { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'status', vibrate: [100], requireInteraction: false },
    rating:        { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'rating', vibrate: [150, 50, 150], requireInteraction: false },
    system:        { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'system', vibrate: [100], requireInteraction: false },
    reminder:      { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'reminder', vibrate: [150, 80, 150], requireInteraction: false },
    appointment:   { icon: '/logo-192.png', badge: '/logo-192.png', tag: 'appointment', vibrate: [200, 50, 200], requireInteraction: false },
  };

  const config = typeConfig[notifType] || typeConfig.system;

  // ★ Play the notification sound in background (oscillator)
  playServiceWorkerSound(notifType);

  // ★ Also try to vibrate
  try {
    if (navigator.vibrate) {
      navigator.vibrate(config.vibrate);
    }
  } catch (e) {}

  // ★ Notify any open client windows so they can show in-app popup + TTS
  try {
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'SHOW_INAPP_NOTIFICATION',
          title: title,
          message: body,
          notifType: notifType,
          voiceText: voiceText,
          voicePriority: voicePriority,
          url: url,
          notifId: notifId,
        });
      }
    }).catch(e => console.warn('[SW] Failed to notify clients:', e.message));
  } catch (e) {
    console.warn('[SW] Failed to notify clients:', e.message);
  }

  // ★ Build TTS data - voiceText from MongoDB database
  const ttsText = voiceText || `${title}. ${body}`;

  const notificationOptions = {
    body: body,
    icon: config.icon,
    badge: config.badge,
    tag: `aafiatak-${config.tag}-${Date.now()}`,
    data: {
      url: url,
      type: notifType,
      // ★ TTS data with voiceText from MongoDB database
      ttsTitle: title,
      ttsBody: body,
      ttsTitleAr: titleAr,
      ttsBodyAr: voiceText || bodyAr,  // ★ voiceText من قاعدة البيانات
      ttsType: notifType,
      ttsVoiceText: ttsText,            // ★ النص الصوتي الكامل من MongoDB
      ttsVoicePriority: voicePriority,
      shouldSpeak: 'true',
      timestamp: Date.now(),
      notifId: notifId,
    },
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: config.requireInteraction,
    silent: false,  // Let browser play notification sound too
    vibrate: config.vibrate,
    renotify: true,
    actions: [
      { action: 'speak', title: '🔊 استمع' },
      { action: 'open', title: '📂 فتح التطبيق' },
      { action: 'dismiss', title: '✕ إغلاق' },
    ],
  };

  console.log('[SW v4] Showing notification:', title, body, notifType);

  return self.registration.showNotification(title, notificationOptions);
});

// ─── Notification click handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Dismiss action - just close
  if (action === 'dismiss') return;

  // Both 'speak' and 'open' and default click should open the app
  const shouldSpeak = action === 'speak' || data.shouldSpeak === 'true' || !action;
  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          // Send message to trigger TTS
          if (shouldSpeak) {
            setTimeout(() => {
              client.postMessage({
                type: 'NOTIFICATION_CLICKED_SPEAK',
                title: data.ttsTitle || data.title || '',
                body: data.ttsBody || data.body || data.message || '',
                titleAr: data.ttsTitleAr || data.titleAr || data.title || '',
                bodyAr: data.ttsBodyAr || data.bodyAr || data.body || data.message || '',
                notifType: data.ttsType || data.type || 'system',
                ttsVoiceText: data.ttsVoiceText || '',
                ttsVoicePriority: data.ttsVoicePriority || 'normal',
                url: targetUrl,
              });
            }, 500);
          }
          return client.focus();
        }
      }

      // No existing window — open new one with TTS params in URL
      const ttsParams = shouldSpeak ?
        `&speak=1&st=${encodeURIComponent(data.ttsTitleAr || data.ttsTitle || '')}&sb=${encodeURIComponent(data.ttsBodyAr || data.ttsVoiceText || data.ttsBody || '')}&stt=${data.ttsType || 'system'}` : '';
      const separator = targetUrl.includes('?') ? '&' : '?';
      const fullUrl = targetUrl + (ttsParams ? separator + ttsParams.replace(/^&/, '') : '');

      return clients.openWindow(fullUrl);
    })
  );
});

// ─── Push event handler (fallback for non-FCM pushes) ───
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      // If this is an FCM message, let onBackgroundMessage handle it
      if (data.from === 'fcm') return;
    } catch {}
  }

  // Handle non-FCM push events
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'عافيتك';
      const body = data.body || data.message || '';
      const type = data.type || 'system';
      
      playServiceWorkerSound(type);
      
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          icon: '/logo-192.png',
          badge: '/logo-192.png',
          tag: `aafiatak-${type}-${Date.now()}`,
          dir: 'rtl',
          lang: 'ar',
          vibrate: type === 'emergency' ? [200, 100, 200, 100, 200, 100, 200] : [100],
          data: data,
          silent: false,
          renotify: true,
        })
      );
    } catch (e) {
      console.warn('[SW] Push event parse error:', e);
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
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '4.0' });
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

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

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

  // Network-first for HTML pages with offline fallback
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
      const cache = await caches.open(RUNTIME_CACHE);
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
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page
    return caches.match('/').then((cachedIndex) => {
      if (cachedIndex) return cachedIndex;
      return new Response(getOfflinePage(), {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 404, statusText: 'Not Found' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

function getOfflinePage() {
  return `<!DOCTYPE html>
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
      background: linear-gradient(135deg, #f5f5f5, #fce4ec);
      color: #333;
      direction: rtl;
      text-align: center;
      padding: 2rem;
    }
    .container {
      max-width: 400px;
      padding: 2.5rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #e11d48; margin-bottom: 0.5rem; font-size: 1.5rem; }
    p { color: #666; line-height: 1.8; font-size: 0.95rem; }
    .hint { color: #999; font-size: 0.8rem; margin-top: 1rem; }
    button {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: #e11d48;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    button:hover { background: #be123c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>غير متصل بالإنترنت</h1>
    <p>يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
    <p class="hint">الإشعارات الصوتية ستستمر بالعمل عند عودة الاتصال</p>
    <button onclick="window.location.reload()">إعادة المحاولة</button>
  </div>
</body>
</html>`;
}
