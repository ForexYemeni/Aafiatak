// Firebase Configuration for Aafiatak
// This provides FCM (push notifications) + Firestore (data sync) + Realtime DB (presence)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'aafiatak-demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aafiatak-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'aafiatak-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://aafiatak-demo-default-rtdb.firebaseio.com',
};

// Initialize Firebase (prevent duplicate initialization)
let app;
let messaging: Messaging | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let rtdb: ReturnType<typeof getDatabase> | null = null;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Firestore
    db = getFirestore(app);
    
    // Realtime Database
    rtdb = getDatabase(app);
    
    // Messaging (FCM) - only in browser
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
}

export { app, messaging, db, rtdb };

// Request FCM token
export async function requestFCMToken(): Promise<string | null> {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'demo-vapid-key',
    });
    console.log('[FCM] Token received:', token?.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('[FCM] Token request failed:', error);
    return null;
  }
}

// Listen for foreground FCM messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    callback(payload);
  });
}

// Register service worker for background notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[SW] Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}
