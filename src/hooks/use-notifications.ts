/**
 * عافيتك — Push Notification Hook
 * Manages FCM token and permission ONLY.
 * Does NOT listen for foreground messages — NotificationBell singleton handles that
 * to prevent duplicate sounds from multiple listeners.
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { requestNotificationPermission } from '@/lib/firebase-client'
import { useAppStore } from '@/lib/store'

function isCapacitorAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

export function usePushNotifications() {
  const { user, userType } = useAppStore()
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const initialized = useRef(false)

  const saveTokenToServer = useCallback(async (token: string) => {
    if (!user || !userType) return
    try {
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (user as any).id, userType, token }),
      })
    } catch (error) {
      console.warn('Failed to save FCM token:', error)
    }
  }, [user, userType])

  const requestPermissionWithSound = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return null
    }

    const currentPermission = Notification.permission
    setPermissionStatus(currentPermission)

    if (currentPermission === 'granted') {
      try {
        const token = await requestNotificationPermission()
        if (token) {
          setFcmToken(token)
          await saveTokenToServer(token)
        }
        return token
      } catch { return null }
    }

    if (currentPermission === 'denied') {
      return null
    }

    try {
      if (isCapacitorAndroid()) {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications')
          const result = await PushNotifications.requestPermissions()

          if (result.receive === 'granted') {
            await PushNotifications.register()
            setPermissionStatus('granted')

            PushNotifications.addListener('registration', async (token: any) => {
              setFcmToken(token.value)
              await saveTokenToServer(token.value)
            })

            PushNotifications.addListener('registrationError', (error: any) => {
              console.error('FCM registration error:', error)
            })

            // NOTE: Do NOT add pushNotificationReceived listener here.
            // NotificationBell.tsx handles that to avoid duplicate sounds.
            return 'android-granted'
          } else {
            setPermissionStatus('denied')
            return null
          }
        } catch (capError) {
          console.warn('Capacitor PushNotifications fallback:', capError)
        }
      }

      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)

      if (permission === 'granted') {
        const token = await requestNotificationPermission()
        if (token) {
          setFcmToken(token)
          await saveTokenToServer(token)
        }
        return token
      } else {
        return null
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      return null
    }
  }, [user, userType, saveTokenToServer])

  // REMOVED: Foreground FCM listener was here — now handled by NotificationBell singleton
  // to prevent duplicate sounds (3 FCM listeners were firing: 2x Bell instances + 1x here)

  // Auto-request permission on login
  useEffect(() => {
    if (!user) { initialized.current = false; return }
    if (initialized.current) return
    const timer = setTimeout(() => {
      requestPermissionWithSound()
      initialized.current = true
    }, 3000)
    return () => clearTimeout(timer)
  }, [user, requestPermissionWithSound])

  useEffect(() => { return () => { initialized.current = false } }, [])

  return { permissionStatus, fcmToken, requestPermission: requestPermissionWithSound }
}
