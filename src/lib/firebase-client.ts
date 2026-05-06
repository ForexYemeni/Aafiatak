/**
 * عافيتك — Firebase Client SDK Configuration (v2.0)
 * FCM push notifications on the client side
 *
 * v2.0 CHANGES:
 * - Hardcoded Firebase config matching the Service Worker (no env var dependency)
 * - Added VAPID key for web push
 * - Better error handling and fallback
 */

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// Firebase client config — matching firebase-messaging-sw.js
// These are PUBLIC keys (not sensitive)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA_WgNDBnSt3fvPDz3IfGeb5GCwjlgp5fA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aafiatak-26439.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aafiatak-26439",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aafiatak-26439.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "880926880101",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:880926880101:web:efe1be2de1aed6fbeb318c",
}

// VAPID key for web push — generated for this project
// This is a PUBLIC key (safe to include in client-side code)
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BBrNTcKGd-z8AdufvxWm3hQASuYhtR8_kfKghe2F0DMfz-WxC48nc4SUGnXANQZ47vdHQxKiAmBHixtJ1NNv7H8'

// Initialize Firebase client
let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Messaging instance (lazy)
let messagingInstance: ReturnType<typeof getMessaging> | null = null

export async function getMessagingInstance() {
  const supported = await isSupported()
  if (!supported) {
    console.warn('FCM: Browser does not support messaging')
    return null
  }
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app)
    } catch (e) {
      console.warn('FCM: Failed to get messaging instance', e)
      return null
    }
  }
  return messagingInstance
}

// ─── Request notification permission and get FCM token ───
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    if (!VAPID_KEY) {
      console.warn('FCM: VAPID key not configured.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('FCM: Notification permission denied')
      return null
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    console.log('FCM: Token obtained:', token ? token.substring(0, 20) + '...' : 'null')
    return token
  } catch (error: any) {
    console.error('FCM: Error getting token:', error.message)
    return null
  }
}

// ─── Listen for foreground messages ───
export async function onForegroundMessage(callback: (payload: any) => void) {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return () => {}

    return onMessage(messaging, callback)
  } catch {
    return () => {}
  }
}

export { app }
