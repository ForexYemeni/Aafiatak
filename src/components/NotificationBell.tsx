/**
 * عافيتك — Notification Bell Component (v6)
 *
 * v6 KEY CHANGES (Voice Notification System):
 * 1. Integrated TTS voice notifications - reads notification text aloud
 * 2. Voice settings: language (ar/en), gender (male/female), volume, rate
 * 3. Quiet hours support for voice notifications
 * 4. Play button per notification to re-read with TTS
 * 5. Voice settings accessible from bell dropdown
 *
 * v5 features preserved:
 * - sound-manager v11 with proper AudioContext resumption
 * - Strong deduplication by both ID and content
 * - Singleton pattern for polling + FCM listener
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, BellRing, CheckCheck, Volume2, VolumeX, Shield, Sparkles, Settings } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { playNotificationSound, isSoundEnabled, setSoundEnabled as setSoundStorage, testNotificationSound, initSoundSystem, getAudioContextState } from '@/lib/sound-manager'
import { speakNotification, stopTTS, isTTSSpeaking, testTTS, getTTSSettings, saveTTSSettings, initTTS, isTTSEnabled, setTTSEnabled, createVoiceNotification, type VoiceGender, type VoiceLanguage, type TTSSettings } from '@/lib/voice-manager'
import { onForegroundMessage } from '@/lib/firebase-client'

interface NotifItem {
  id: string
  title: string
  message: string
  type: string
  isRead?: boolean
  createdAt?: any
  data?: Record<string, string>
}

interface NotificationBellProps {
  gradientFrom: string
  gradientTo: string
  userType: 'admin' | 'nurse' | 'beneficiary'
}

const typeStyles: Record<string, { icon: string; color: string; bg: string }> = {
  assignment: { icon: '📋', color: 'text-blue-600', bg: 'bg-blue-50' },
  chat: { icon: '💬', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  payment: { icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  emergency: { icon: '🚨', color: 'text-red-600', bg: 'bg-red-50' },
  status_change: { icon: '🔄', color: 'text-amber-600', bg: 'bg-amber-50' },
  rating: { icon: '⭐', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  system: { icon: '🔔', color: 'text-gray-600', bg: 'bg-gray-50' },
  reminder: { icon: '⏰', color: 'text-purple-600', bg: 'bg-purple-50' },
  appointment: { icon: '📅', color: 'text-cyan-600', bg: 'bg-cyan-50' },
}

function formatNotifTime(ts: any): string {
  if (!ts) return ''
  try {
    let date: Date
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) date = new Date(ts.seconds * 1000)
    else if (typeof ts === 'string') date = new Date(ts)
    else if (typeof ts === 'number') date = new Date(ts)
    else return ''
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 7) return `منذ ${days} يوم`
    return date.toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ─── Detect platforms ───
function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform())
}

function getCapacitorPushPlugin(): any {
  if (typeof window === 'undefined') return null
  try {
    const cap = (window as any).Capacitor
    if (cap && cap.Plugins && cap.Plugins.PushNotifications) return cap.Plugins.PushNotifications
    if (cap && cap.registerPlugin) return cap.registerPlugin('PushNotifications')
  } catch {}
  return null
}

function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).AndroidApp
}

// ═══════════════════════════════════════════════════════════════
//  MODULE-LEVEL SINGLETON STATE
// ═══════════════════════════════════════════════════════════════

// Shared known notification IDs across ALL instances
const globalKnownIds: Set<string> = new Set()

// Track which notifications have had sound played (by ID)
const globalSoundPlayedIds: Set<string> = new Set()

// Singleton flags
let globalFcmListenerSetup = false
let globalCapacitorListenerSetup = false
let globalPollingInterval: ReturnType<typeof setInterval> | null = null
let globalInitialFetchDone = false
let globalCurrentUserId: string | null = null
let globalCurrentUserType: string | null = null
let globalFcmCleanup: (() => void) | null = null
let globalSoundSystemInitialized = false
let globalSwMessageListenerSetup = false

// ─── Service Worker Message Listener ───
// Listens for messages from the Service Worker when the user clicks
// a background notification. This triggers TTS automatically.
function singletonInitSWMessageListener() {
  if (globalSwMessageListenerSetup) return
  if (typeof window === 'undefined' || !navigator.serviceWorker) return
  globalSwMessageListenerSetup = true

  // Listen for messages from the Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data
    if (!data) return

    // Handle notification click → auto-speak
    if (data.type === 'NOTIFICATION_CLICKED_SPEAK') {
      console.log('🗣️ [SW Message] Notification clicked, will speak:', data.titleAr || data.title)

      // Resume AudioContext so TTS can work
      resumeAudioContext()

      // Small delay to ensure the app is fully loaded
      setTimeout(() => {
        const voiceNotif = createVoiceNotification(
          data.notifType || 'system',
          data.titleAr || data.title || '',
          data.bodyAr || data.body || '',
          undefined,
          undefined,
          data.notifType === 'emergency' ? 'urgent' : 'normal'
        )
        speakNotification(voiceNotif)
        console.log('🗣️ [SW Message] TTS triggered for:', data.titleAr || data.title)
      }, 1000)
    }

    // Handle sound play request from SW
    if (data.type === 'PLAY_NOTIFICATION_SOUND') {
      console.log('🔊 [SW Message] Play sound request:', data.notifType)
      resumeAudioContext()
      playNotificationSound(data.notifType || 'system')
    }
  })

  console.log('🗣️ [SW Message] Service Worker message listener initialized')
}

// Subscriber pattern
type NotifSubscriber = (notifs: NotifItem[], unreadCount: number) => void
const subscribers: Set<NotifSubscriber> = new Set()
let latestNotifs: NotifItem[] = []
let latestUnreadCount = 0

function subscribe(fn: NotifSubscriber) {
  subscribers.add(fn)
  fn(latestNotifs, latestUnreadCount)
  return () => { subscribers.delete(fn) }
}

function notifyAllSubscribers() {
  subscribers.forEach(fn => {
    try { fn(latestNotifs, latestUnreadCount) } catch {}
  })
}

// ─── Deduplication helper (STRONG v4) ───
function deduplicateNotifications(notifs: NotifItem[]): NotifItem[] {
  const seenById = new Set<string>()
  const seenByContent = new Map<string, NotifItem>()
  const result: NotifItem[] = []

  for (const n of notifs) {
    // 1. Skip exact ID duplicates
    if (seenById.has(n.id)) continue
    seenById.add(n.id)

    // 2. Skip content duplicates (same title + type within 60s window)
    const contentKey = `${n.title}||${n.type}`
    const existing = seenByContent.get(contentKey)

    if (existing) {
      const existingTime = getTimeValue(existing.createdAt)
      const currentTime = getTimeValue(n.createdAt)

      if (Math.abs(existingTime - currentTime) < 60000) {
        // Duplicate — keep the unread one
        if (existing.isRead && !n.isRead) {
          const idx = result.findIndex(r => r.id === existing.id)
          if (idx !== -1) result[idx] = n
          seenByContent.set(contentKey, n)
        }
        continue
      }
    }

    seenByContent.set(contentKey, n)
    result.push(n)
  }

  return result
}

function getTimeValue(ts: any): number {
  if (!ts) return 0
  try {
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) return ts.seconds * 1000
    if (typeof ts === 'string') return new Date(ts).getTime()
    if (typeof ts === 'number') return ts
  } catch {}
  return 0
}

// ─── Singleton: Fetch notifications ───
async function singletonFetchNotifications() {
  if (!globalCurrentUserId || !globalCurrentUserType) return
  try {
    const res = await fetch(`/api/notifications/list?userId=${globalCurrentUserId}&userType=${globalCurrentUserType}`)
    if (res.ok) {
      const data = await res.json()
      let notifs: NotifItem[] = (data.notifications || []).map((n: any) => ({
        id: n.id, title: n.title || '', message: n.message || '',
        type: n.type || 'system', isRead: n.isRead || n.read || false,
        createdAt: n.createdAt, data: n.data,
      }))

      // Deduplicate
      notifs = deduplicateNotifications(notifs)

      // Find truly NEW unread notifications (not in known IDs and not already had sound)
      const newUnreadNotifs = notifs.filter(n =>
        !n.isRead &&
        !globalKnownIds.has(n.id) &&
        !globalSoundPlayedIds.has(n.id)
      )

      // Add all IDs to known set
      notifs.forEach(n => globalKnownIds.add(n.id))

      // Cleanup old IDs from memory
      if (globalKnownIds.size > 500) {
        const idsArray = Array.from(globalKnownIds)
        globalKnownIds.clear()
        idsArray.slice(-300).forEach(id => globalKnownIds.add(id))
      }
      if (globalSoundPlayedIds.size > 500) {
        const idsArray = Array.from(globalSoundPlayedIds)
        globalSoundPlayedIds.clear()
        idsArray.slice(-300).forEach(id => globalSoundPlayedIds.add(id))
      }

      const unread = notifs.filter(n => !n.isRead).length

      // Update shared state
      latestNotifs = notifs
      latestUnreadCount = unread
      notifyAllSubscribers()

      // Play sound + TTS ONLY for genuinely NEW notifications (not on first load)
      if (newUnreadNotifs.length > 0 && globalInitialFetchDone && isSoundEnabled()) {
        const firstNew = newUnreadNotifs[0]
        const notifType = firstNew.type || 'system'

        // Mark sound as played for these IDs to prevent duplicate sounds
        newUnreadNotifs.forEach(n => globalSoundPlayedIds.add(n.id))

        console.log('🔊 [Singleton] New notification via polling:', firstNew.title, notifType)
        playNotificationSound(notifType, firstNew.title, firstNew.message)

        // 🔊 TTS: Read notification aloud after tone
        if (isTTSEnabled()) {
          const voiceNotif = createVoiceNotification(
            notifType,
            firstNew.title,
            firstNew.message,
            undefined,
            undefined,
            notifType === 'emergency' ? 'urgent' : 'normal'
          )
          speakNotification(voiceNotif)
        }
      }

      if (!globalInitialFetchDone) {
        globalInitialFetchDone = true
      }
    }
  } catch {}
}

// ─── Singleton: Initialize FCM foreground listener (ONCE) ───
function singletonInitFcmListener() {
  if (globalFcmListenerSetup) return
  if (isCapacitorNative() || isAndroidApp()) return
  globalFcmListenerSetup = true

  onForegroundMessage((payload: any) => {
    console.log('📱 [Singleton] FCM foreground message:', payload)
    const type = payload?.data?.type || 'system'
    const title = payload?.notification?.title || payload?.data?.title || ''
    const body = payload?.notification?.body || payload?.data?.body || payload?.data?.message || ''
    const notifId = payload?.data?.id || payload?.data?.requestId || ''

    // ADD to known sets FIRST to prevent polling from re-playing sound
    if (notifId) {
      const idStr = String(notifId)
      globalKnownIds.add(idStr)
      globalSoundPlayedIds.add(idStr)
    }

    // Play sound ONCE
    playNotificationSound(type, title, body)

    // 🔊 TTS: Read FCM notification aloud
    if (isTTSEnabled()) {
      const voiceNotif = createVoiceNotification(
        type, title, body, undefined, undefined,
        type === 'emergency' ? 'urgent' : 'normal'
      )
      speakNotification(voiceNotif)
    }

    // Refresh list
    singletonFetchNotifications()
  }).then(fn => { globalFcmCleanup = fn })
}

// ─── Singleton: Initialize Capacitor Push listeners (ONCE) ───
function singletonInitCapacitorListener() {
  if (globalCapacitorListenerSetup) return
  if (!isCapacitorNative()) return
  globalCapacitorListenerSetup = true

  const pushPlugin = getCapacitorPushPlugin()
  if (!pushPlugin) return

  try {
    pushPlugin.addListener('registration', (token: any) => {
      console.log('📱 FCM token received:', token.value)
      if (globalCurrentUserId && globalCurrentUserType) {
        fetch('/api/notifications/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: globalCurrentUserId, userType: globalCurrentUserType, token: token.value }),
        }).catch(() => {})
      }
    })

    pushPlugin.addListener('registrationError', (error: any) => {
      console.error('📱 FCM registration error:', error)
    })

    pushPlugin.addListener('pushNotificationReceived', (notification: any) => {
      console.log('📱 [Singleton] Push received in foreground:', notification)
      const type = notification?.data?.type || notification?.type || 'system'
      const title = notification?.title || notification?.data?.title || ''
      const body = notification?.body || notification?.data?.body || notification?.data?.message || ''
      const notifId = notification?.data?.id || notification?.data?.requestId || notification?.id

      if (notifId) {
        const idStr = String(notifId)
        globalKnownIds.add(idStr)
        globalSoundPlayedIds.add(idStr)
      }

      playNotificationSound(type, title, body)

      // 🔊 TTS: Read Capacitor push notification aloud
      if (isTTSEnabled()) {
        const voiceNotif = createVoiceNotification(
          type, title, body, undefined, undefined,
          type === 'emergency' ? 'urgent' : 'normal'
        )
        speakNotification(voiceNotif)
      }

      singletonFetchNotifications()
    })

    pushPlugin.addListener('pushNotificationActionPerformed', (action: any) => {
      console.log('📱 Push notification tapped:', action)
    })

    console.log('📱 Capacitor PushNotifications listeners set up (singleton)')
  } catch (err) {
    console.error('📱 Failed to setup PushNotifications listeners:', err)
  }
}

// ─── Singleton: Start polling (ONCE) ───
function singletonStartPolling() {
  if (globalPollingInterval) return
  singletonFetchNotifications()
  globalPollingInterval = setInterval(singletonFetchNotifications, 15000)
}

function singletonStopPolling() {
  if (globalPollingInterval) {
    clearInterval(globalPollingInterval)
    globalPollingInterval = null
  }
}

// ─── Auto-request Notification permission ───
let globalAutoPermissionRequested = false

function autoRequestNotificationPermission(userId: string, userType: string) {
  if (globalAutoPermissionRequested) return
  if (isCapacitorNative() || isAndroidApp()) return
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return

  globalAutoPermissionRequested = true

  if (Notification.permission === 'granted' || Notification.permission === 'denied') return

  console.log('🔔 Auto-requesting notification permission on first login...')

  Notification.requestPermission().then(async (result) => {
    console.log('🔔 Auto permission result:', result)
    if (result === 'granted') {
      try {
        const { requestNotificationPermission } = await import('@/lib/firebase-client')
        const token = await requestNotificationPermission()
        if (token) {
          await fetch('/api/notifications/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userType, token }),
          })
          console.log('🔔 FCM token registered after auto-permission')
        }
      } catch (err) {
        console.warn('🔔 Failed to register FCM token:', err)
      }
    }
  }).catch(() => {})
}

// ─── Singleton: Register a user ───
function singletonRegisterUser(userId: string, userType: string) {
  const changed = globalCurrentUserId !== userId || globalCurrentUserType !== userType
  globalCurrentUserId = userId
  globalCurrentUserType = userType

  if (changed) {
    globalKnownIds.clear()
    globalSoundPlayedIds.clear()
    globalInitialFetchDone = false
    latestNotifs = []
    latestUnreadCount = 0
  }

  if (!globalSoundSystemInitialized) {
    globalSoundSystemInitialized = true
    initSoundSystem()
    initTTS()
  }

  singletonInitFcmListener()
  singletonInitCapacitorListener()
  singletonInitSWMessageListener()
  singletonStartPolling()
  autoRequestNotificationPermission(userId, userType)
}

// ═══════════════════════════════════════════════════════════════
//  REACT COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function NotificationBell({ gradientFrom, gradientTo, userType }: NotificationBellProps) {
  const { user } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>(getTTSSettings())
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  // Register user with singleton
  useEffect(() => {
    if (user) {
      singletonRegisterUser((user as any).id, userType)
    }
  }, [user, userType])

  // Subscribe to singleton notification updates
  useEffect(() => {
    const unsub = subscribe((notifs, unread) => {
      setNotifications(notifs)
      setUnreadCount(unread)
    })
    return unsub
  }, [])

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    if (isCapacitorNative()) {
      try {
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin && pushPlugin.checkPermissions) {
          const result = await pushPlugin.checkPermissions()
          if (result.receive === 'granted') setPermissionStatus('granted')
          else if (result.receive === 'denied') setPermissionStatus('denied')
          else setPermissionStatus('default')
          return
        }
      } catch {}
    }

    if (isAndroidApp()) {
      try {
        const android = (window as any).AndroidApp
        setPermissionStatus(android.isNotificationPermissionGranted() ? 'granted' : 'denied')
        return
      } catch {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  useEffect(() => { checkPermissionStatus() }, [checkPermissionStatus])

  // Listen for AndroidApp bridge permission results
  useEffect(() => {
    if (!isAndroidApp() || isCapacitorNative()) return
    ;(window as any).onAndroidPermissionResult = (result: any) => {
      setIsRequestingPermission(false)
      setShowPermissionDialog(false)
      checkPermissionStatus()
      if (result.granted || result['android.permission.POST_NOTIFICATIONS']) {
        setPermissionStatus('granted')
      }
    }
    return () => { delete (window as any).onAndroidPermissionResult }
  }, [checkPermissionStatus])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (isRequestingPermission) return
    setIsRequestingPermission(true)

    try {
      if (isCapacitorNative()) {
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin && pushPlugin.requestPermissions) {
          try {
            const permResult = await pushPlugin.requestPermissions()
            if (permResult.receive === 'granted') {
              setPermissionStatus('granted')
              setShowPermissionDialog(false)
              try { await pushPlugin.register() } catch {}
            } else if (permResult.receive === 'denied') {
              setPermissionStatus('denied')
              setShowPermissionDialog(false)
            } else {
              setPermissionStatus('default')
            }
          } catch {}
          setIsRequestingPermission(false)
          return
        }
      }

      if (isAndroidApp()) {
        try {
          const android = (window as any).AndroidApp
          android.requestNotificationPermission()
          setTimeout(() => { setIsRequestingPermission(false); checkPermissionStatus() }, 10000)
          return
        } catch {}
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        if (permission === 'granted') {
          try {
            const { requestNotificationPermission } = await import('@/lib/firebase-client')
            const token = await requestNotificationPermission()
            if (token && user) {
              await fetch('/api/notifications/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: (user as any).id, userType, token }),
              })
            }
          } catch {}
        }
      }
    } catch {} finally {
      setIsRequestingPermission(false)
      setShowPermissionDialog(false)
    }
  }, [user, userType, isRequestingPermission, checkPermissionStatus])

  const openSettings = useCallback(async () => {
    if (isCapacitorNative()) {
      try {
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin?.openSettings) { await pushPlugin.openSettings(); setShowPermissionDialog(false); return }
      } catch {}
    }
    if (isAndroidApp()) { try { (window as any).AndroidApp.openAppSettings() } catch {} }
    setShowPermissionDialog(false)
  }, [])

  const markAsRead = useCallback(async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    globalKnownIds.add(notifId)
    try {
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId, isRead: true })
      })
    } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    unreadIds.forEach(id => globalKnownIds.add(id))
    try {
      if (user && userType) {
        await fetch('/api/notifications/list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: (user as any).id, userType, markAll: true })
        })
      } else {
        for (const id of unreadIds) {
          await fetch('/api/notifications/list', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id, isRead: true })
          })
        }
      }
    } catch {}
  }, [notifications, user, userType])

  const toggleSound = useCallback(() => {
    const v = !soundEnabled
    setSoundEnabled(v)
    setSoundStorage(v)
    if (v) testNotificationSound('system')
  }, [soundEnabled])

  const toggleTTS = useCallback(() => {
    const v = !ttsEnabled
    setTtsEnabled(v)
    setTTSEnabled(v)
    if (v) testTTS()
  }, [ttsEnabled])

  const handleSpeakNotif = useCallback((notif: NotifItem) => {
    const voiceNotif = createVoiceNotification(
      notif.type,
      notif.title,
      notif.message,
      undefined,
      undefined,
      notif.type === 'emergency' ? 'urgent' : 'normal'
    )
    speakNotification(voiceNotif)
  }, [])

  useEffect(() => {
    setSoundEnabled(isSoundEnabled())
    setTtsEnabled(isTTSEnabled())
    setTtsSettings(getTTSSettings())
  }, [])

  const isGranted = permissionStatus === 'granted'
  const isDenied = permissionStatus === 'denied'
  const isNativeAndroid = isCapacitorNative() || isAndroidApp()

  return (
    <>
      <div className="relative">
        <motion.button
          ref={bellRef}
          onClick={() => {
            // USER GESTURE — resume AudioContext so sounds can play
            try {
              const AC = window.AudioContext || (window as any).webkitAudioContext
              if (AC && typeof AC !== 'undefined') {
                // Resume our shared AudioContext from sound-manager
                console.log('🔊 [Bell] User clicked bell, AudioContext state:', getAudioContextState())
              }
            } catch {}
            setIsOpen(!isOpen)
          }}
          className="relative h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 flex items-center justify-center"
          whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
        >
          {isGranted ? <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-500' : 'text-gray-500'}`} /> : <BellOff className="w-4 h-4 text-gray-400" />}
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className={`absolute -top-1 -left-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-lg`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
          {unreadCount > 0 && <span className={`absolute -top-1 -left-1 w-[18px] h-[18px] rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-ping opacity-30`} />}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="absolute left-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

              <div className={`px-4 py-3 bg-gradient-to-l ${gradientFrom} ${gradientTo} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white">الإشعارات</h3>
                  {unreadCount > 0 && <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} جديد</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); toggleTTS() }} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title={ttsEnabled ? 'إيقاف القراءة الصوتية' : 'تفعيل القراءة الصوتية'}>
                    {ttsEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); testTTS() }} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title="اختبار الصوت الصوتي">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </button>
                  <button onClick={toggleSound} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title={soundEnabled ? 'كتم النغمة' : 'تفعيل النغمة'}>
                    {soundEnabled ? <BellRing className="w-3.5 h-3.5 text-white" /> : <BellOff className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title="قراءة الكل">
                      <CheckCheck className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Permission banner */}
              {!isGranted && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">الإشعارات معطلة</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mb-2">
                    {isDenied && isNativeAndroid
                      ? 'تم رفض الإشعارات مسبقاً. افتح الإعدادات وفعّل الإشعارات يدوياً'
                      : 'فعّل الإشعارات لتلقي تنبيهات فورية حتى عند إغلاق التطبيق'}
                  </p>
                  <button
                    onClick={isDenied && isNativeAndroid ? openSettings : () => setShowPermissionDialog(true)}
                    disabled={isRequestingPermission}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isDenied && isNativeAndroid ? (
                      <><Settings className="w-3 h-3" /> فتح إعدادات الإشعارات</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> {isRequestingPermission ? 'جارٍ الطلب...' : 'تفعيل الإشعارات الآن'}</>
                    )}
                  </button>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" /><p className="text-xs">لا توجد إشعارات</p>
                  </div>
                ) : notifications.map((notif) => {
                  const style = typeStyles[notif.type] || typeStyles.system
                  return (
                    <motion.div key={notif.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                      onClick={() => markAsRead(notif.id)}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 text-sm`}>{style.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</h4>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">{formatNotifTime(notif.createdAt)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSpeakNotif(notif) }}
                              className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
                              title="قراءة الإشعار صوتياً"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                              استمع
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                  <button className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">عرض جميع الإشعارات</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Permission Dialog */}
      <AnimatePresence>
        {showPermissionDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowPermissionDialog(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className={`px-6 py-5 bg-gradient-to-l ${gradientFrom} ${gradientTo} text-center`}>
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, repeat: 2 }} className="inline-block">
                  <BellRing className="w-12 h-12 text-white mx-auto mb-3" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">تفعيل الإشعارات</h3>
                <p className="text-white/80 text-sm mt-1">ابقَ على اطلاع بكل ما يهمك</p>
              </div>
              <div className="px-6 py-4 space-y-3">
                {[
                  { icon: '📋', text: 'مهمات جديدة وتعيينات' },
                  { icon: '💬', text: 'رسائل المحادثة الفورية' },
                  { icon: '💰', text: 'تأكيدات الدفع والفواتير' },
                  { icon: '🚨', text: 'طلبات الطوارئ العاجلة' },
                  { icon: '⭐', text: 'التقييمات والإشعارات الهامة' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 space-y-2">
                <button
                  onClick={requestPermission}
                  disabled={isRequestingPermission}
                  className={`w-full py-3 bg-gradient-to-l ${gradientFrom} ${gradientTo} text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50`}>
                  <Sparkles className="w-4 h-4" />
                  {isRequestingPermission ? 'جارٍ الطلب...' : 'تفعيل الإشعارات الآن'}
                </button>
                <button onClick={() => { setShowPermissionDialog(false) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors">لاحقاً</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
