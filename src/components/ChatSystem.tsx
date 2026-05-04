'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

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

export default function ChatSystem({ requestId, userId, userName, userType, otherPartyName }: ChatSystemProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastFetchRef = useRef<string>('')

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!requestId) return
    try {
      const res = await fetch(`/api/chat?requestId=${requestId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        const prevLength = messages.length
        setMessages(data)

        // Count unread (messages not from current user and newer than last seen)
        const unread = data.filter((m: ChatMessage) => {
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
        }
        lastFetchRef.current = new Date().toISOString()
      }
    } catch {
      // silently fail
    }
  }, [requestId, userId, isOpen, messages.length])

  // Initial fetch and polling
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchMessages().finally(() => setLoading(false))
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    } else {
      // Still poll for unread count when closed
      const interval = setInterval(fetchMessages, 10000)
      fetchMessages()
      return () => clearInterval(interval)
    }
  }, [isOpen, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Reset unread when opening
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          senderId: userId,
          senderName,
          senderType: userType,
          message: newMessage.trim(),
        }),
      })
      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل إرسال الرسالة', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp?: string | { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return ''
    const date = typeof timestamp === 'object' && 'seconds' in timestamp
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp)
    return date.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
  }

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'nurse': return 'الممرض/ة'
      case 'beneficiary': return 'المستفيد'
      case 'admin': return 'الإدارة'
      default: return senderType
    }
  }

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'nurse': return 'text-violet-600'
      case 'beneficiary': return 'text-rose-600'
      case 'admin': return 'text-emerald-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      {/* Chat Bubble Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="فتح المحادثة"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] sm:w-[400px]"
            dir="rtl"
          >
            <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="bg-gradient-to-l from-rose-500 to-pink-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">المحادثة</h3>
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

              {/* Messages Area */}
              <div
                ref={scrollRef}
                className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-8 h-8 text-rose-300" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">لا توجد رسائل بعد</p>
                    <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === userId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-1'}`}>
                          {!isMe && (
                            <p className={`text-xs font-medium mb-1 text-right ${getSenderColor(msg.senderType)}`}>
                              {msg.senderName} • {getSenderLabel(msg.senderType)}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-l from-rose-500 to-pink-600 text-white rounded-bl-md'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-br-md shadow-sm'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-left' : 'text-right'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 rounded-full text-sm"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
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
    </>
  )
}
