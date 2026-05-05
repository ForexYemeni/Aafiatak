/**
 * عافيتك — Push Notification Hook
 * Manages FCM token, permission, foreground messages, and sound alerts
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage, getMessagingInstance } from '@/lib/firebase-client'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Sound System using Web Audio API ───
const SOUND_TYPES = {
  assignment: { frequency: 880, duration: 200, repeat: 2, gap: 100 },   // Double high beep
  chat: { frequency: 660, duration: 150, repeat: 1, gap: 0 },           // Single medium beep
  emergency: { frequency: 1200, duration: 300, repeat: 3, gap: 150 },    // Triple urgent beep
  payment: { frequency: 523, duration: 200, repeat: 1, gap: 0 },        // Single low beep
  rating: { frequency: 784, duration: 150, repeat: 2, gap: 80 },        // Double medium-high
  status_change: { frequency: 440, duration: 250, repeat: 1, gap: 0 },  // Single low-long
  system: { frequency: 600, duration: 180, repeat: 1, gap: 0 },         // Default beep
  reminder: { frequency: 700, duration: 200, repeat: 2, gap: 120 },     // Double medium
}

function playNotificationSound(type: string = 'system') {
  try {
    const config = SOUND_TYPES[type as keyof typeof SOUND_TYPES] || SOUND_TYPES.system
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

    for (let i = 0; i < config.repeat; i++) {
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = config.frequency
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      // Fade out at end
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + (i * (config.duration + gap)) / 1000)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (i * (config.duration + config.gap) + config.duration) / 1000)

      const gap = config.gap
      const startTime = audioCtx.currentTime + (i * (config.duration + gap)) / 1000
      oscillator.start(startTime)
      oscillator.stop(startTime + config.duration / 1000)
    }

    // Auto-close context after sounds finish
    setTimeout(() => audioCtx.close(), 2000)
  } catch {
    // Silently fail — sound is optional
  }
}

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
    } catch {
      // Silently fail — will retry next time
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

        // Play sound notification
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

  // ─── Auto-request permission after login ───
  useEffect(() => {
    if (!user) {
      initialized.current = false
      return
    }

    // Delay slightly to let the UI settle
    const timer = setTimeout(() => {
      initNotifications()
    }, 3000)

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
  }
}

export { playNotificationSound }
