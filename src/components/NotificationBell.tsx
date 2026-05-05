/**
 * عافيتك — Notification Bell Component
 * Shared notification bell with dropdown panel for all dashboards
 * Shows unread count, notification history, and permission status
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, BellRing, Check, CheckCheck, Trash2, X, Volume2, VolumeX, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { playNotificationSound } from '@/hooks/use-push-notifications'

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
  /** Role-specific gradient colors */
  gradientFrom: string
  gradientTo: string
  /** Role for API calls */
  userType: 'admin' | 'nurse' | 'beneficiary'
}

// ─── Type → Icon/Color mapping ───
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
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
      date = new Date(ts.seconds * 1000)
    } else if (typeof ts === 'string') {
      date = new Date(ts)
    } else if (typeof ts === 'number') {
      date = new Date(ts)
    } else {
      return ''
    }
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
  } catch {
    return ''
  }
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const prevUnreadRef = useRef(0)

  // ─── Fetch notifications from server ───
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/notifications/list?userId=${(user as any).id}&userType=${userType}`)
      if (res.ok) {
        const data = await res.json()
        const notifs = (data.notifications || []).map((n: any) => ({
          id: n.id,
          title: n.title || '',
          message: n.message || '',
          type: n.type || 'system',
          isRead: n.isRead || false,
          createdAt: n.createdAt,
          data: n.data,
        }))
        setNotifications(notifs)
        const unread = notifs.filter((n: NotifItem) => !n.isRead).length
        setUnreadCount(unread)

        // Play sound for new notifications
        if (unread > prevUnreadRef.current && prevUnreadRef.current >= 0) {
          if (soundEnabled) {
            playNotificationSound('system')
          }
        }
        prevUnreadRef.current = unread
      }
    } catch {
      // Silently fail
    }
  }, [user, userType, soundEnabled])

  // ─── Poll for notifications every 15 seconds ───
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // ─── Check notification permission ───
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  // ─── Close dropdown on outside click ───
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Request notification permission ───
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return

    const permission = await Notification.requestPermission()
    setPermissionStatus(permission)

    if (permission === 'granted') {
      // Register FCM token
      try {
        const { requestNotificationPermission } = await import('@/lib/firebase-client')
        const token = await requestNotificationPermission()
        if (token && user) {
          await fetch('/api/notifications/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: (user as any).id,
              userType,
              token,
            }),
          })
        }
      } catch {
        // Silently fail
      }
    }

    setShowPermissionDialog(false)
  }, [user, userType])

  // ─── Mark notification as read ───
  const markAsRead = useCallback(async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Update on server (fire-and-forget)
    try {
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId, isRead: true }),
      })
    } catch {
      // Silently fail
    }
  }, [])

  // ─── Mark all as read ───
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    // Batch update on server
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    for (const id of unreadIds) {
      fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, isRead: true }),
      }).catch(() => {})
    }
  }, [notifications])

  // ─── Toggle sound ───
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newVal = !prev
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aafiatak-sound-enabled', String(newVal))
      }
      return newVal
    })
  }, [])

  // Load sound preference
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('aafiatak-sound-enabled')
      if (saved !== null) setSoundEnabled(saved === 'true')
    }
  }, [])

  const isGranted = permissionStatus === 'granted'

  return (
    <>
      {/* ─── Bell Button ─── */}
      <div className="relative">
        <motion.button
          ref={bellRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
        >
          {isGranted ? (
            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-500' : 'text-gray-500'}`} />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}

          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -left-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-lg`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}

          {/* Pulse animation for urgent notifications */}
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -left-1 w-[18px] h-[18px] rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-ping opacity-30`} />
          )}
        </motion.button>

        {/* ─── Dropdown Panel ─── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className={`px-4 py-3 bg-gradient-to-l ${gradientFrom} ${gradientTo} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Sound toggle */}
                  <button
                    onClick={toggleSound}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </button>
                  {/* Mark all read */}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      title="قراءة الكل"
                    >
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
                    فعّل الإشعارات لتلقي تنبيهات فورية حتى عند إغلاق التطبيق
                  </p>
                  <button
                    onClick={() => setShowPermissionDialog(true)}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    تفعيل الإشعارات الآن
                  </button>
                </div>
              )}

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = typeStyles[notif.type] || typeStyles.system
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                          !notif.isRead ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 text-sm`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {formatNotifTime(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                  <button className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">
                    عرض جميع الإشعارات
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Permission Request Dialog ─── */}
      <AnimatePresence>
        {showPermissionDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowPermissionDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className={`px-6 py-5 bg-gradient-to-l ${gradientFrom} ${gradientTo} text-center`}>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="inline-block"
                >
                  <BellRing className="w-12 h-12 text-white mx-auto mb-3" />
                </motion.div>
                <h3 className="text-lg font-bold text-white">تفعيل الإشعارات</h3>
                <p className="text-white/80 text-sm mt-1">ابقَ على اطلاع بكل ما يهمك</p>
              </div>

              {/* Benefits */}
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

              {/* Actions */}
              <div className="px-6 pb-6 space-y-2">
                <button
                  onClick={requestPermission}
                  className={`w-full py-3 bg-gradient-to-l ${gradientFrom} ${gradientTo} text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg`}
                >
                  <Sparkles className="w-4 h-4" />
                  تفعيل الإشعارات الآن
                </button>
                <button
                  onClick={() => setShowPermissionDialog(false)}
                  className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
