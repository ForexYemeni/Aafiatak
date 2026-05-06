/**
 * عافيتك — Notification Bell Component
 * Works on Web + Android APK via Capacitor PushNotifications plugin
 *
 * Permission flow:
 * 1. Capacitor Android → Capacitor.Plugins.PushNotifications (native dialog via bridge)
 * 2. Fallback AndroidApp → window.AndroidApp.requestNotificationPermission()
 * 3. Web browser → Notification.requestPermission()
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, BellRing, CheckCheck, Volume2, VolumeX, Shield, Sparkles, Settings } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { playNotificationSound, isSoundEnabled, setSoundEnabled, testNotificationSound } from '@/lib/sound-manager'

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

// ─── Detect Capacitor native environment (Android APK) ───
function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as any).Capacitor
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform())
}

// ─── Get Capacitor PushNotifications plugin via global ───
// This works without importing the npm package - Capacitor injects the runtime
// into the WebView when loading remote URLs
function getCapacitorPushPlugin(): any {
  if (typeof window === 'undefined') return null
  try {
    const cap = (window as any).Capacitor
    if (cap && cap.Plugins && cap.Plugins.PushNotifications) {
      return cap.Plugins.PushNotifications
    }
    // Also try the registered plugin pattern
    if (cap && cap.registerPlugin) {
      return cap.registerPlugin('PushNotifications')
    }
  } catch {}
  return null
}

// ─── Detect custom AndroidApp JavaScript interface (fallback) ───
function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).AndroidApp
}

export default function NotificationBell({ gradientFrom, gradientTo, userType }: NotificationBellProps) {
  const { user } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const prevUnreadRef = useRef(0)
  const capacitorListenersSetup = useRef(false)

  // ─── Send FCM token to server ───
  const sendTokenToServer = useCallback(async (token: string) => {
    if (!user || !token) return
    try {
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (user as any).id, userType, token }),
      })
      console.log('📱 FCM token sent to server')
    } catch (err) {
      console.error('Failed to send FCM token:', err)
    }
  }, [user, userType])

  // ─── Setup Capacitor PushNotifications listeners (once) ───
  useEffect(() => {
    if (!isCapacitorNative()) return
    if (capacitorListenersSetup.current) return
    capacitorListenersSetup.current = true

    const pushPlugin = getCapacitorPushPlugin()
    if (!pushPlugin) {
      console.warn('📱 PushNotifications plugin not available via Capacitor global')
      return
    }

    try {
      // Listen for FCM token registration
      pushPlugin.addListener('registration', (token: any) => {
        console.log('📱 FCM token received:', token.value)
        sendTokenToServer(token.value)
      })

      // Listen for registration error
      pushPlugin.addListener('registrationError', (error: any) => {
        console.error('📱 FCM registration error:', error)
      })

      // Listen for push notification received while app is in foreground
      pushPlugin.addListener('pushNotificationReceived', (notification: any) => {
        console.log('📱 Push received in foreground:', notification)
        if (soundEnabled) {
          playNotificationSound('system')
        }
        fetchNotifications()
      })

      // Listen for notification tap
      pushPlugin.addListener('pushNotificationActionPerformed', (action: any) => {
        console.log('📱 Push notification tapped:', action)
      })

      console.log('📱 Capacitor PushNotifications listeners set up successfully')
    } catch (err) {
      console.error('📱 Failed to setup PushNotifications listeners:', err)
    }

    return () => {
      try {
        if (pushPlugin.removeAllListeners) {
          pushPlugin.removeAllListeners()
        }
      } catch {}
    }
  }, [sendTokenToServer, soundEnabled])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/notifications/list?userId=${(user as any).id}&userType=${userType}`)
      if (res.ok) {
        const data = await res.json()
        const notifs = (data.notifications || []).map((n: any) => ({
          id: n.id, title: n.title || '', message: n.message || '',
          type: n.type || 'system', isRead: n.isRead || false,
          createdAt: n.createdAt, data: n.data,
        }))
        setNotifications(notifs)
        const unread = notifs.filter((n: NotifItem) => !n.isRead).length
        setUnreadCount(unread)
        if (unread > prevUnreadRef.current && prevUnreadRef.current >= 0 && soundEnabled) {
          playNotificationSound('system')
        }
        prevUnreadRef.current = unread
      }
    } catch {}
  }, [user, userType, soundEnabled])

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 15000); return () => clearInterval(i) }, [fetchNotifications])

  // ─── Check permission status ───
  const checkPermissionStatus = useCallback(async () => {
    // ── CAPACITOR ANDROID PATH ──
    if (isCapacitorNative()) {
      try {
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin && pushPlugin.checkPermissions) {
          const result = await pushPlugin.checkPermissions()
          console.log('📱 Capacitor permission check:', result)
          if (result.receive === 'granted') {
            setPermissionStatus('granted')
          } else if (result.receive === 'denied') {
            setPermissionStatus('denied')
          } else {
            setPermissionStatus('default')
          }
          return
        }
      } catch (err) {
        console.warn('Capacitor permission check failed:', err)
      }
    }

    // ── ANDROID APP BRIDGE PATH (fallback) ──
    if (isAndroidApp()) {
      try {
        const android = (window as any).AndroidApp
        const notifGranted = android.isNotificationPermissionGranted()
        setPermissionStatus(notifGranted ? 'granted' : 'denied')
        return
      } catch {}
    }

    // ── WEB BROWSER PATH ──
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  useEffect(() => { checkPermissionStatus() }, [checkPermissionStatus])

  // ─── Listen for AndroidApp bridge permission results (fallback) ───
  useEffect(() => {
    if (!isAndroidApp() || isCapacitorNative()) return
    ;(window as any).onAndroidPermissionResult = (result: any) => {
      console.log('📱 AndroidApp bridge permission result:', result)
      setIsRequestingPermission(false)
      setShowPermissionDialog(false)
      checkPermissionStatus()
      if (result.granted || result['android.permission.POST_NOTIFICATIONS']) {
        setPermissionStatus('granted')
        setTimeout(() => playNotificationSound('system'), 500)
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

  // ─── Request notification permission ───
  const requestPermission = useCallback(async () => {
    if (isRequestingPermission) return
    setIsRequestingPermission(true)

    try {
      // ══════════════════════════════════════════
      // CAPACITOR ANDROID PATH (Primary for APK)
      // ══════════════════════════════════════════
      if (isCapacitorNative()) {
        console.log('📱 Requesting permission via Capacitor PushNotifications plugin')
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin && pushPlugin.requestPermissions) {
          try {
            // This triggers the native Android permission dialog!
            const permResult = await pushPlugin.requestPermissions()
            console.log('📱 Capacitor permission result:', permResult)

            if (permResult.receive === 'granted') {
              setPermissionStatus('granted')
              setShowPermissionDialog(false)

              // Register for push notifications to get FCM token
              try {
                await pushPlugin.register()
                console.log('📱 PushNotifications.register() called successfully')
              } catch (regErr) {
                console.error('📱 PushNotifications.register() failed:', regErr)
              }

              // Play confirmation sound
              setTimeout(() => playNotificationSound('system'), 500)
            } else if (permResult.receive === 'denied') {
              setPermissionStatus('denied')
              setShowPermissionDialog(false)
            } else {
              // User dismissed the dialog without choosing
              setPermissionStatus('default')
            }
          } catch (err) {
            console.error('📱 Capacitor permission request failed:', err)
          }

          setIsRequestingPermission(false)
          return
        }
        // If Capacitor plugin not available, fall through to AndroidApp bridge
        console.warn('📱 Capacitor PushNotifications plugin not found, falling back to AndroidApp bridge')
      }

      // ══════════════════════════════════════════
      // ANDROID APP BRIDGE PATH (Fallback for APK)
      // ══════════════════════════════════════════
      if (isAndroidApp()) {
        console.log('📱 Requesting permission via AndroidApp bridge')
        try {
          const android = (window as any).AndroidApp
          android.requestNotificationPermission()
          // Result will come via onAndroidPermissionResult callback
          setTimeout(() => {
            setIsRequestingPermission(false)
            checkPermissionStatus()
          }, 10000)
          return
        } catch (err) {
          console.error('AndroidApp bridge permission error:', err)
        }
      }

      // ══════════════════════════════════════════
      // WEB BROWSER PATH
      // ══════════════════════════════════════════
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)

        if (permission === 'granted') {
          try {
            const { requestNotificationPermission } = await import('@/lib/firebase-client')
            const token = await requestNotificationPermission()
            if (token && user) {
              await sendTokenToServer(token)
            }
            setTimeout(() => playNotificationSound('system'), 500)
          } catch {}
        }
      }
    } catch (error) {
      console.error('Permission request error:', error)
    } finally {
      setIsRequestingPermission(false)
      setShowPermissionDialog(false)
    }
  }, [user, userType, isRequestingPermission, checkPermissionStatus, sendTokenToServer])

  // ─── Open Android app settings ───
  const openSettings = useCallback(async () => {
    if (isCapacitorNative()) {
      try {
        const pushPlugin = getCapacitorPushPlugin()
        if (pushPlugin && pushPlugin.openSettings) {
          await pushPlugin.openSettings()
          setShowPermissionDialog(false)
          return
        }
      } catch {}
    }
    if (isAndroidApp()) {
      try {
        ;(window as any).AndroidApp.openAppSettings()
      } catch {}
    }
    setShowPermissionDialog(false)
  }, [])

  const markAsRead = useCallback(async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try { await fetch('/api/notifications/list', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: notifId, isRead: true }) }) } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    for (const id of notifications.filter(n => !n.isRead).map(n => n.id)) {
      fetch('/api/notifications/list', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: id, isRead: true }) }).catch(() => {})
    }
  }, [notifications])

  const toggleSound = useCallback(() => {
    const v = !soundEnabled; setSoundEnabled(v); setSoundEnabled(v)
    if (v) testNotificationSound('system')
    // Also test native sound on Android
    if (v && isCapacitorNative()) {
      try { playNotificationSound('system') } catch {}
    }
    if (v && isAndroidApp()) { try { (window as any).AndroidApp.playNotificationSound() } catch {} }
  }, [soundEnabled])

  useEffect(() => { setSoundEnabled(isSoundEnabled()) }, [])

  const isGranted = permissionStatus === 'granted'
  const isDenied = permissionStatus === 'denied'
  const isNativeAndroid = isCapacitorNative() || isAndroidApp()

  return (
    <>
      <div className="relative">
        <motion.button
          ref={bellRef}
          onClick={() => setIsOpen(!isOpen)}
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
                  <button onClick={toggleSound} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}>
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-white/60" />}
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
                          <span className="text-[10px] text-gray-400 mt-1 block">{formatNotifTime(notif.createdAt)}</span>
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
