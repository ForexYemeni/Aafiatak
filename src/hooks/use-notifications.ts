/**
 * عافيتك — Push Notification Hook
 * Manages FCM token, permission, foreground messages, and sound alerts
 * Requests notification permission with sound explicitly on Android & Web
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase-client'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { playNotificationSound, preloadSounds, isSoundEnabled } from '@/lib/sound-manager'

function getNotificationUrl(data: Record<string, any>): string {
  const userType = data?.userType
  const type = data?.type
  const requestId = data?.requestId
  if (type === 'chat' && requestId) return `/?chat=${requestId}`
  if (type === 'assignment' && userType === 'nurse') return '/?tab=assignments'
  if (type === 'emergency') return '/?tab=emergency'
  return '/'
}

function isCapacitorAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.() ||
         !!(window as any).Capacitor?.Platforms?.isAndroid?.()
}

export function usePushNotifications() {
  const { user, userType } = useAppStore()
  const { toast } = useToast()
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
    preloadSounds()

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
      toast({
        title: 'الإشعارات معطلة',
        description: 'يرجى تفعيل الإشعارات من إعدادات الجهاز لتلقي التنبيهات الصوتية',
        duration: 7000,
      })
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

            PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
              const type = notification.data?.type || 'system'
              playNotificationSound(type as string)
              toast({
                title: notification.title || 'عافيتك',
                description: notification.body || '',
                duration: type === 'emergency' ? 10000 : 5000,
              })
            })

            PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
              const data = action.notification.data
              const url = getNotificationUrl(data || {})
              window.location.href = url
            })

            setTimeout(() => playNotificationSound('system'), 1000)
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
        setTimeout(() => playNotificationSound('system'), 1000)
        return token
      } else {
        toast({
          title: 'الإشعارات معطلة',
          description: 'لن تتمكن من تلقي الإشعارات الصوتية',
          duration: 5000,
        })
        return null
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      return null
    }
  }, [user, userType, saveTokenToServer, toast])

  useEffect(() => {
    if (!user || isCapacitorAndroid()) return
    let unsubscribe: (() => void) | undefined
    const setupForegroundListener = async () => {
      unsubscribe = await onForegroundMessage((payload) => {
        const { notification, data } = payload
        const title = notification?.title || 'عافيتك'
        const body = notification?.body || ''
        const type = data?.type || 'system'
        playNotificationSound(type)
        toast({ title, description: body, duration: type === 'emergency' ? 10000 : 5000 })
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, { body, icon: '/logo.png', tag: `fg-${Date.now()}`, dir: 'rtl', lang: 'ar', silent: true })
          } catch {}
        }
      })
    }
    setupForegroundListener()
    return () => { if (unsubscribe) unsubscribe() }
  }, [user, toast])

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

  return { permissionStatus, fcmToken, requestPermission: requestPermissionWithSound, playSound: playNotificationSound, isSoundEnabled }
}

export { playNotificationSound }
