/**
 * عافيتك — Firebase Client SDK Configuration
 * Used for FCM push notifications on the client side
 */

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// Firebase client config — these are PUBLIC keys (not sensitive)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID || 'aafiatak-26439'}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'aafiatak-26439',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || 'aafiatak-26439'}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// VAPID key for web push
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

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
      console.warn('FCM: VAPID key not configured. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('FCM: Notification permission denied')
      return null
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
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
