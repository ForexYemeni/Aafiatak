/**
 * عافيتك — Push Notification Hook
 * Manages FCM token, permission, foreground messages, and sound alerts
 * Works even when the app is forcefully closed via Service Worker + FCM
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage, getMessagingInstance } from '@/lib/firebase-client'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Sound System using Web Audio API ───
// Each type has a unique pattern so users can distinguish notifications
const SOUND_TYPES: Record<string, { frequency: number; duration: number; repeat: number; gap: number; type: OscillatorType }> = {
  assignment:  { frequency: 880, duration: 180, repeat: 2, gap: 120, type: 'sine' },      // Double high beep - new task
  chat:        { frequency: 660, duration: 120, repeat: 3, gap: 60,  type: 'triangle' },   // Triple soft beep - message
  emergency:   { frequency: 1200, duration: 250, repeat: 3, gap: 150, type: 'sawtooth' },  // Triple urgent - emergency
  payment:     { frequency: 523, duration: 200, repeat: 2, gap: 100, type: 'sine' },       // Double low beep - payment
  rating:      { frequency: 784, duration: 120, repeat: 2, gap: 80,  type: 'sine' },       // Double medium-high - rating
  status_change: { frequency: 440, duration: 250, repeat: 1, gap: 0, type: 'sine' },       // Single low-long - status
  system:      { frequency: 600, duration: 150, repeat: 2, gap: 100, type: 'triangle' },   // Double medium - system
  reminder:    { frequency: 700, duration: 180, repeat: 2, gap: 120, type: 'sine' },       // Double medium - reminder
  appointment: { frequency: 932, duration: 150, repeat: 2, gap: 80,  type: 'sine' },       // Double high - appointment
}

function playNotificationSound(type: string = 'system') {
  try {
    // Check if sound is enabled
    if (typeof localStorage !== 'undefined') {
      const soundEnabled = localStorage.getItem('aafiatak-sound-enabled')
      if (soundEnabled === 'false') return
    }

    const config = SOUND_TYPES[type] || SOUND_TYPES.system
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    for (let i = 0; i < config.repeat; i++) {
      const startTime = audioCtx.currentTime + (i * (config.duration + config.gap)) / 1000

      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = config.frequency
      oscillator.type = config.type

      // Volume envelope: fade in, sustain, fade out
      gainNode.gain.setValueAtTime(0.001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.01)
      gainNode.gain.setValueAtTime(0.25, startTime + config.duration / 1000 - 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration / 1000)

      oscillator.start(startTime)
      oscillator.stop(startTime + config.duration / 1000 + 0.01)
    }

    // Auto-close context after sounds finish
    const totalDuration = config.repeat * (config.duration + config.gap) + 500
    setTimeout(() => {
      try { audioCtx.close() } catch {}
    }, totalDuration)
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
  }
}

export { playNotificationSound }
