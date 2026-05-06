/**
 * عافيتك — Push Notification Hook
 * Manages FCM token, permission, foreground messages, and sound alerts
 * Works even when the app is forcefully closed via Service Worker + FCM
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase-client'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { playNotificationSound, preloadSounds, isSoundEnabled } from '@/lib/sound-manager'

// ─── Role-based notification click URLs ───
function getNotificationUrl(data: Record<string, any>): string {
  const userType = data?.userType
  const type = data?.type
  const requestId = data?.requestId

  if (type === 'chat' && requestId) return `/?chat=${requestId}`
  if (type === 'assignment' && userType === 'nurse') return '/?tab=assignments'
  if (type === 'emergency') return '/?tab=emergency'

  return '/'
}

export function usePushNotifications() {
  const { user, userType } = useAppStore()
  const { toast } = useToast()
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const initialized = useRef(false)

  // ─── Save FCM token to server ───
  const saveTokenToServer = useCallback(async (token: string) => {
    if (!user || !userType) return
    try {
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any).id,
          userType,
          token,
        }),
      })
      console.log('✅ FCM token saved to server')
    } catch (error) {
      console.warn('Failed to save FCM token:', error)
    }
  }, [user, userType])

  // ─── Remove FCM token from server ───
  const removeTokenFromServer = useCallback(async () => {
    if (!user || !userType) return
    try {
      await fetch('/api/notifications/token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any).id,
          userType,
        }),
      })
    } catch {
      // Silently fail
    }
  }, [user, userType])

  // ─── Initialize push notifications ───
  const initNotifications = useCallback(async () => {
    if (!user || initialized.current) return
    initialized.current = true

    // Preload sound files on first user interaction
    preloadSounds()

    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    }

    try {
      const token = await requestNotificationPermission()
      if (token) {
        setFcmToken(token)
        await saveTokenToServer(token)
        console.log('✅ FCM token registered:', token.substring(0, 20) + '...')
      } else {
        console.warn('FCM: No token obtained. Permission may be denied or VAPID key missing.')
      }
    } catch (error) {
      console.warn('FCM init failed:', error)
    }
  }, [user, saveTokenToServer])

  // ─── Listen for foreground messages ───
  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined

    const setupForegroundListener = async () => {
      unsubscribe = await onForegroundMessage((payload) => {
        const { notification, data } = payload
        const title = notification?.title || 'عافيتك'
        const body = notification?.body || ''
        const type = data?.type || 'system'

        // Play sound notification (uses unified sound manager)
        playNotificationSound(type)

        // Show in-app toast
        toast({
          title,
          description: body,
          duration: type === 'emergency' ? 10000 : 5000,
        })

        // Also show browser notification for visibility
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/logo.png',
              tag: `foreground-${Date.now()}`,
              dir: 'rtl',
              lang: 'ar',
              silent: true, // We already played our custom sound
            })
          } catch {
            // Notification API might not be available
          }
        }
      })
    }

    setupForegroundListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, toast])

  // ─── Auto-request permission after login (delayed) ───
  useEffect(() => {
    if (!user) {
      initialized.current = false
      return
    }

    // Delay to let the UI settle and show the welcome animation
    const timer = setTimeout(() => {
      initNotifications()
    }, 5000) // 5 seconds delay (after welcome animation)

    return () => clearTimeout(timer)
  }, [user, initNotifications])

  // ─── Cleanup on unmount/logout ───
  useEffect(() => {
    return () => {
      initialized.current = false
    }
  }, [])

  return {
    permissionStatus,
    fcmToken,
    requestPermission: initNotifications,
    playSound: playNotificationSound,
    isSoundEnabled,
  }
}

export { playNotificationSound }
