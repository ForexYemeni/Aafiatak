'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Camera, ImageIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { playNotificationSound } from '@/lib/sound-manager'

/* ──────────────────────────── Types ──────────────────────────── */

interface ChatMessage {
  id: string
  requestId: string
  senderId: string
  senderName: string
  senderType: 'nurse' | 'beneficiary' | 'admin'
  message: string
  createdAt?: string | { seconds: number; nanoseconds: number }
}

interface ChatSystemProps {
  requestId: string
  userId: string
  userName: string
  userType: 'nurse' | 'beneficiary' | 'admin'
  otherPartyName?: string
}

/* ──────────────────────────── Helpers ──────────────────────────── */

/** Parse a date from various timestamp formats */
function parseDate(ts?: string | { seconds: number; nanoseconds: number }): Date {
  if (!ts) return new Date()
  if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000)
  return new Date(ts)
}

/** Format time as HH:MM in Arabic locale */
function formatTime(ts?: string | { seconds: number; nanoseconds: number }): string {
  if (!ts) return ''
  return parseDate(ts).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
}

/** Format a date for grouping headers */
function formatDateHeader(ts?: string | { seconds: number; nanoseconds: number }): string {
  const date = parseDate(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'اليوم'
  if (date.toDateString() === yesterday.toDateString()) return 'أمس'

  return date.toLocaleDateString('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Check if two timestamps are on the same calendar day */
function isSameDay(
  a?: string | { seconds: number; nanoseconds: number },
  b?: string | { seconds: number; nanoseconds: number },
): boolean {
  if (!a || !b) return false
  return parseDate(a).toDateString() === parseDate(b).toDateString()
}

/** Detect image messages stored as [image:data:image/...;base64,...] */
function isImageMessage(text: string): boolean {
  return text.startsWith('[image:') && text.endsWith(']')
}

/** Extract base64 data URI from image message */
function extractImageSrc(text: string): string {
  // [image:data:image/png;base64,abc...] → data:image/png;base64,abc...
  return text.slice(7, -1)
}



/* ──────────────────────────── Quick Replies ──────────────────────────── */

const NURSE_QUICK_REPLIES = ['أنا بالطريق', 'وصلت', 'تم الإنتهاء', 'أحتاج توضيح']
const BENEFICIARY_QUICK_REPLIES = ['كم تبقى؟', 'شكراً', 'أحتاج مساعدة إضافية', 'هل يمكنك القدوم مبكراً؟']

/* ──────────────────────────── Component ──────────────────────────── */

export default function ChatSystem({
  requestId,
  userId,
  userName,
  userType,
  otherPartyName,
}: ChatSystemProps) {
  const { toast } = useToast()

  // ── Core state ──
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Enhanced state ──
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageSending, setImageSending] = useState(false)

  // ── Refs ──
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFetchRef = useRef<string>('')
  const prevMessageCountRef = useRef<number>(0)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Quick replies for current user type ──
  const quickReplies = userType === 'nurse' ? NURSE_QUICK_REPLIES : BENEFICIARY_QUICK_REPLIES

  // ────────────────── Fetch Messages ──────────────────
  const fetchMessages = useCallback(async () => {
    if (!requestId) return
    try {
      const res = await fetch(`/api/chat?requestId=${requestId}&limit=50`)
      if (res.ok) {
        const data: ChatMessage[] = await res.json()
        const prevLength = prevMessageCountRef.current

        setMessages(data)
        prevMessageCountRef.current = data.length

        // Count unread
        const unread = data.filter((m) => {
          if (m.senderId === userId) return false
          const msgTime = m.createdAt
            ? typeof m.createdAt === 'object' && 'seconds' in m.createdAt
              ? new Date(m.createdAt.seconds * 1000).toISOString()
              : m.createdAt
            : ''
          return msgTime > lastFetchRef.current
        }).length

        if (!isOpen && data.length > prevLength) {
          setUnreadCount(unread)
          // Play notification sound for new messages from others
          if (unread > 0) playNotificationSound('chat')
        }

        // Simulate typing indicator when new messages arrive from other party
        if (isOpen && data.length > prevLength) {
          const latestMsg = data[data.length - 1]
          if (latestMsg && latestMsg.senderId !== userId) {
            // Another person sent a message – no need to show typing
            setIsTyping(false)
          }
        }

        lastFetchRef.current = new Date().toISOString()
      }
    } catch {
      // silently fail
    }
  }, [requestId, userId, isOpen])

  // ────────────────── Polling ──────────────────
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchMessages().finally(() => setLoading(false))
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    } else {
      const interval = setInterval(fetchMessages, 10000)
      fetchMessages()
      return () => clearInterval(interval)
    }
  }, [isOpen, fetchMessages])

  // ────────────────── Auto-scroll ──────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // ────────────────── Focus input on open ──────────────────
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // ────────────────── Reset unread on open ──────────────────
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  // ────────────────── Simulate typing from other party ──────────────────
  // When we send a message, briefly show "typing" from the other side
  const simulateTyping = useCallback(() => {
    setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
  }, [])

  // ────────────────── Send text message ──────────────────
  const handleSend = async (text?: string) => {
    const msgText = text || newMessage
    if (!msgText.trim() || sending) return

    // Validate required fields before sending
    if (!requestId || !userId || !userName || !userType) {
      toast({ title: 'خطأ', description: 'بيانات المحادثة غير مكتملة. يرجى إعادة فتح المحادثة.', variant: 'destructive' })
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          senderId: userId,
          senderName: userName,
          senderType: userType,
          message: msgText.trim(),
        }),
      })
      if (res.ok) {
        setNewMessage('')
        setShowQuickReplies(false)
        fetchMessages()
        // Simulate other party typing after a short delay
        setTimeout(simulateTyping, 1500)
      } else {
        // Try to parse error as JSON, fall back to status text
        let errorMsg = 'فشل إرسال الرسالة'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          errorMsg = `خطأ الخادم (${res.status})`
        }
        toast({ title: 'خطأ', description: errorMsg, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  // ────────────────── Send image message ──────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'خطأ', description: 'يرجى اختيار صورة فقط', variant: 'destructive' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الصورة يجب أن يكون أقل من 5MB', variant: 'destructive' })
      return
    }

    setImageSending(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Store as [image:data:image/...;base64,...]
      const imageMessage = `[image:${base64}]`
      await handleSend(imageMessage)
    } catch {
      toast({ title: 'خطأ', description: 'فشل معالجة الصورة', variant: 'destructive' })
    } finally {
      setImageSending(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ────────────────── Keyboard handler ──────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ────────────────── Sender helpers ──────────────────
  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'nurse':
        return 'الممرض/ة'
      case 'beneficiary':
        return 'المستفيد'
      case 'admin':
        return 'الإدارة'
      default:
        return senderType
    }
  }

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'nurse':
        return 'text-violet-600'
      case 'beneficiary':
        return 'text-rose-600'
      case 'admin':
        return 'text-emerald-600'
      default:
        return 'text-gray-600'
    }
  }

  // ────────────────── Group messages by date ──────────────────
  interface MessageGroup {
    dateLabel: string
    messages: ChatMessage[]
  }

  const groupedMessages: MessageGroup[] = messages.reduce<MessageGroup[]>((acc, msg) => {
    const label = formatDateHeader(msg.createdAt)
    if (acc.length === 0 || !isSameDay(acc[acc.length - 1].messages[0]?.createdAt, msg.createdAt)) {
      acc.push({ dateLabel: label, messages: [msg] })
    } else {
      acc[acc.length - 1].messages.push(msg)
    }
    return acc
  }, [])

  // ──────────────────────────── Render ────────────────────────────
  return (
    <>
      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* ──────── Chat Bubble Button ──────── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="فتح المحادثة"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* ──────── Chat Panel ──────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] sm:w-[400px]"
            style={{ maxHeight: 'calc(100vh - 3rem)' }}
            dir="rtl"
          >
            <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
              {/* ──── Header ──── */}
              <div className="bg-gradient-to-l from-rose-500 to-pink-600 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">المحادثة</h3>
                    <p className="text-rose-100 text-xs">
                      {otherPartyName || 'الخدمة'} • طلب #{requestId.slice(-6)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="إغلاق المحادثة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ──── Messages Area ──── */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#f0ebe5] min-h-0"
                style={{ maxHeight: '50vh' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-8 h-8 text-rose-300" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">لا توجد رسائل بعد</p>
                    <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                ) : (
                  groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      {/* ──── Date separator ──── */}
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-white/80 backdrop-blur-sm text-[11px] text-gray-500 px-3 py-1 rounded-lg shadow-sm font-medium">
                          {group.dateLabel}
                        </span>
                      </div>

                      {/* ──── Messages in this date group ──── */}
                      {group.messages.map((msg, mi) => {
                        const isMe = msg.senderId === userId
                        const isImage = isImageMessage(msg.message)
                        const imageSrc = isImage ? extractImageSrc(msg.message) : null
                        // Check if next message is from same sender for grouping
                        const nextMsg = group.messages[mi + 1]
                        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isMe ? 'justify-start' : 'justify-end'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}
                          >
                            <div className={`max-w-[80%] ${isMe ? 'order-1' : 'order-1'}`}>
                              {/* Sender name (only for first message in group from others) */}
                              {!isMe && isLastInGroup && (
                                <p className={`text-[11px] font-semibold mb-1 text-right ${getSenderColor(msg.senderType)}`}>
                                  {msg.senderName} • {getSenderLabel(msg.senderType)}
                                </p>
                              )}

                              {/* Message bubble */}
                              <div
                                className={`relative ${
                                  isMe
                                    ? 'bg-[#d9fdd3] text-gray-800 rounded-2xl rounded-bl-md'
                                    : 'bg-white text-gray-800 rounded-2xl rounded-br-md shadow-sm'
                                } ${isImage ? 'p-1.5 overflow-hidden' : 'px-4 py-2.5'}`}
                              >
                                {isImage && imageSrc ? (
                                  <div
                                    className="cursor-pointer rounded-xl overflow-hidden"
                                    onClick={() => setPreviewImage(imageSrc)}
                                  >
                                    <img
                                      src={imageSrc}
                                      alt="صورة مرسلة"
                                      className="max-w-full max-h-60 object-cover rounded-xl"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.message}
                                  </p>
                                )}

                                {/* Timestamp inside bubble (WhatsApp style) */}
                                <span
                                  className={`text-[10px] mt-1 inline-flex items-center gap-1 ${
                                    isImage ? 'px-2 pb-1' : ''
                                  } ${isMe ? 'text-gray-500' : 'text-gray-400'}`}
                                >
                                  {formatTime(msg.createdAt)}
                                  {isMe && (
                                    <svg viewBox="0 0 16 11" width="16" height="11" className="inline-block">
                                      <path
                                        d="M11.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.336.153.437.437 0 0 0 0 .636l2.357 2.458a.49.49 0 0 0 .685 0l6.516-8.04a.437.437 0 0 0 0-.636l-.304-.178z"
                                        fill="currentColor"
                                      />
                                      <path
                                        d="M14.071 0.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-0.8-.834"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  )}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ))
                )}

                {/* ──── Typing Indicator ──── */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex justify-end mb-2"
                    >
                      <div className="bg-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 ml-1">يكتب</span>
                          <span className="flex gap-1">
                            <motion.span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.span
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ──── Quick Replies ──── */}
              <AnimatePresence>
                {showQuickReplies && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-100 bg-white"
                  >
                    <div className="p-2 flex flex-wrap gap-1.5">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => {
                            handleSend(reply)
                            setShowQuickReplies(false)
                          }}
                          className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-full px-3 py-1.5 transition-colors font-medium"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ──── Input Area ──── */}
              <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  {/* Image / Camera button */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-10 h-10 text-gray-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageSending}
                      aria-label="إرسال صورة"
                    >
                      {imageSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Text input */}
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 rounded-full text-sm h-10"
                    disabled={sending}
                  />

                  {/* Quick replies toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`rounded-full w-10 h-10 shrink-0 transition-colors ${
                      showQuickReplies
                        ? 'text-rose-600 bg-rose-50'
                        : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    aria-label="ردود سريعة"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${showQuickReplies ? 'rotate-180' : ''}`} />
                  </Button>

                  {/* Send button */}
                  <Button
                    onClick={() => handleSend()}
                    disabled={(!newMessage.trim() && !imageSending) || sending}
                    size="icon"
                    className="rounded-full w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 hover:shadow-md shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 rotate-180" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────── Image Preview Modal ──────── */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-3xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                aria-label="إغلاق المعاينة"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image */}
              <img
                src={previewImage}
                alt="معاينة الصورة"
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
