/**
 * عافيتك — In-App Notification Popup (v1.0)
 *
 * نظام الإشعارات المنبثقة داخل التطبيق
 * يعمل دائماً بغض النظر عن إذن المتصفح للإشعارات
 *
 * WHY THIS EXISTS:
 * ================
 * Browser Notification API requires explicit permission and doesn't work
 * on all browsers (especially iOS Safari). This component provides a
 * RELIABLE in-app notification popup that:
 *
 * 1. Always shows when the app is open (no permission needed)
 * 2. Appears as a floating card overlay at the top of the screen
 * 3. Auto-plays sound + TTS
 * 4. Auto-dismisses after 6 seconds or on click
 * 5. Stacks multiple notifications
 * 6. Works on ALL platforms including iOS Safari
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2 } from 'lucide-react'
import { playNotificationSound, resumeAudioContext } from '@/lib/sound-manager'
import { speakNotification, createVoiceNotification, isTTSEnabled, type VoiceNotification } from '@/lib/voice-manager'

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface PopupNotification {
  id: string
  title: string
  message: string
  type: string
  voiceText?: string
  voicePriority?: string
  url?: string
  timestamp: number
}

// ═══════════════════════════════════════════════════════════════
//  GLOBAL EVENT SYSTEM
//  This allows any part of the app to show a notification popup
// ═══════════════════════════════════════════════════════════════

const NOTIFICATION_EVENT = 'aafiatak-show-popup-notification'

export function showInAppNotification(params: {
  title: string
  message: string
  type: string
  voiceText?: string
  voicePriority?: string
  url?: string
  notifId?: string
}): void {
  if (typeof window === 'undefined') return

  const notification: PopupNotification = {
    id: params.notifId || `popup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: params.title,
    message: params.message,
    type: params.type,
    voiceText: params.voiceText,
    voicePriority: params.voicePriority,
    url: params.url,
    timestamp: Date.now(),
  }

  // Resume AudioContext on this event
  resumeAudioContext()

  // Dispatch global event
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: notification }))

  // Also try browser Notification API as a bonus (not required)
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotif = new Notification(params.title, {
        body: params.message,
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: `aafiatak-${params.type}-${Date.now()}`,
        dir: 'rtl',
        lang: 'ar',
        silent: true, // We handle sound ourselves
        data: {
          url: params.url || '/',
          type: params.type,
        },
      })
      browserNotif.onclick = () => {
        window.focus()
        if (params.url) window.location.href = params.url
        browserNotif.close()
      }
    }
  } catch (e) {
    // Browser notification failed, but in-app popup still works
  }
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATION TYPE STYLES
// ═══════════════════════════════════════════════════════════════

const typeConfig: Record<string, {
  icon: string
  gradient: string
  borderColor: string
  textColor: string
}> = {
  assignment: {
    icon: '📋',
    gradient: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-800',
  },
  chat: {
    icon: '💬',
    gradient: 'from-indigo-500 to-indigo-600',
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-800',
  },
  emergency: {
    icon: '🚨',
    gradient: 'from-red-500 to-red-600',
    borderColor: 'border-red-400',
    textColor: 'text-red-800',
  },
  payment: {
    icon: '💰',
    gradient: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-800',
  },
  rating: {
    icon: '⭐',
    gradient: 'from-yellow-500 to-amber-600',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-800',
  },
  status_change: {
    icon: '🔄',
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-800',
  },
  system: {
    icon: '🔔',
    gradient: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-800',
  },
  reminder: {
    icon: '⏰',
    gradient: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-800',
  },
  appointment: {
    icon: '📅',
    gradient: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-800',
  },
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function InAppNotificationPopup() {
  const [notifications, setNotifications] = useState<PopupNotification[]>([])
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Handle new notification events
  const handleNotification = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<PopupNotification>
    const notif = customEvent.detail
    if (!notif) return

    console.log('🔔 [InApp Popup] New notification:', notif.title, notif.type)

    // Add to stack (max 3 visible)
    setNotifications(prev => {
      const updated = [notif, ...prev].slice(0, 3)

      // Auto-dismiss after 6 seconds (or 10 seconds for emergency)
      const dismissTime = notif.type === 'emergency' ? 10000 : 6000
      const timer = setTimeout(() => {
        setNotifications(p => p.filter(n => n.id !== notif.id))
        timerRefs.current.delete(notif.id)
      }, dismissTime)
      timerRefs.current.set(notif.id, timer)

      return updated
    })

    // ★ Play notification sound — always try, even if AudioContext is suspended
    // The sound system will use Web Audio oscillator or vibration as fallback
    try {
      resumeAudioContext()
      playNotificationSound(notif.type, notif.title, notif.message)
    } catch (e) {
      console.warn('🔔 [InApp Popup] Sound play failed:', e)
    }

    // ★ Play TTS if enabled — with robust fallback
    try {
      if (isTTSEnabled()) {
        const voicePriority = (notif.voicePriority || 'normal') as 'low' | 'normal' | 'high' | 'urgent'
        if (notif.voiceText) {
          const voiceNotif: VoiceNotification = {
            titleAr: notif.title,
            titleEn: notif.title,
            bodyAr: notif.voiceText,
            bodyEn: notif.voiceText,
            type: notif.type,
            priority: voicePriority,
          }
          speakNotification(voiceNotif)
        } else {
          const voiceNotif = createVoiceNotification(
            notif.type,
            notif.title,
            notif.message,
            undefined,
            undefined,
            notif.type === 'emergency' ? 'urgent' : 'normal'
          )
          speakNotification(voiceNotif)
        }
      }
    } catch (e) {
      console.warn('🔔 [InApp Popup] TTS failed:', e)
    }
  }, [])

  // Listen for notification events
  useEffect(() => {
    window.addEventListener(NOTIFICATION_EVENT, handleNotification)
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification)
      // Clear all timers
      timerRefs.current.forEach(timer => clearTimeout(timer))
      timerRefs.current.clear()
    }
  }, [handleNotification])

  // Dismiss a notification
  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const timer = timerRefs.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRefs.current.delete(id)
    }
  }, [])

  // Handle click on notification
  const handleClick = useCallback((notif: PopupNotification) => {
    if (notif.url && notif.url !== '/') {
      window.location.href = notif.url
    }
    dismiss(notif.id)
  }, [dismiss])

  // Speak notification on demand
  const handleSpeak = useCallback((notif: PopupNotification, e: React.MouseEvent) => {
    e.stopPropagation()
    resumeAudioContext()

    if (notif.voiceText) {
      const voiceNotif: VoiceNotification = {
        titleAr: notif.title,
        titleEn: notif.title,
        bodyAr: notif.voiceText,
        bodyEn: notif.voiceText,
        type: notif.type,
        priority: (notif.voicePriority || 'normal') as 'low' | 'normal' | 'high' | 'urgent',
      }
      speakNotification(voiceNotif)
    } else {
      const voiceNotif = createVoiceNotification(
        notif.type,
        notif.title,
        notif.message
      )
      speakNotification(voiceNotif)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none" dir="rtl">
      <div className="flex flex-col items-center gap-2 pt-4 px-4">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.system
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -80, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto w-full max-w-md"
              >
                <div
                  className={`bg-white rounded-2xl shadow-2xl border ${config.borderColor} border-l-4 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
                  onClick={() => handleClick(notif)}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-l ${config.gradient} px-4 py-2.5 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-white font-bold text-sm truncate max-w-[250px]">
                        {notif.title || 'إشعار جديد'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleSpeak(notif, e)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        title="استمع"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        title="إغلاق"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <p className={`text-sm ${config.textColor} leading-relaxed line-clamp-3`}>
                      {notif.message || 'لديك إشعار جديد'}
                    </p>
                  </div>

                  {/* Progress bar for auto-dismiss */}
                  <div className="h-0.5 bg-gray-100">
                    <motion.div
                      className={`h-full bg-gradient-to-l ${config.gradient}`}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: notif.type === 'emergency' ? 10 : 6, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
