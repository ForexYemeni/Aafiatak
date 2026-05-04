'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, ClipboardList, User, LogOut, Loader2, Play, CheckCircle,
  Menu, X, Phone, MapPin, Clock, HelpCircle, Bell, Activity,
  Calendar, Star, Filter, MessageSquare, ChevronDown, ChevronUp,
  Mail, Shield, Award, Navigation, Info, Sparkles
} from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import ChatSystem from '@/components/ChatSystem'
import Image from 'next/image'

// ==================== Date Helpers ====================

function formatDate(timestamp: any): string {
  if (!timestamp) return 'غير محدد'
  try {
    let date: Date
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000)
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else {
      return 'غير محدد'
    }
    if (isNaN(date.getTime())) return 'غير محدد'
    return date.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return 'غير محدد'
  }
}

function formatDateTime(timestamp: any): string {
  if (!timestamp) return 'غير محدد'
  try {
    let date: Date
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000)
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else {
      return 'غير محدد'
    }
    if (isNaN(date.getTime())) return 'غير محدد'
    return date.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'غير محدد'
  }
}

function getDateKey(timestamp: any): string {
  if (!timestamp) return ''
  try {
    let date: Date
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000)
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else {
      return ''
    }
    if (isNaN(date.getTime())) return ''
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  } catch {
    return ''
  }
}

// ==================== Types ====================

type Tab = 'assignments' | 'schedule' | 'ratings' | 'profile' | 'notifications' | 'help'

interface Assignment {
  id: string
  nurseId: string
  requestId: string
  status: string
  notes?: string
  createdAt?: any
  updatedAt?: any
  request?: {
    id: string
    beneficiaryId: string
    serviceId: string
    status: string
    notes?: string
    address?: string
    beneficiary?: {
      id: string
      name: string
      phone: string
      location: string
    }
    service?: {
      id: string
      name: string
      price: number
      description?: string
    }
  }
}

interface NurseProfile {
  id: string
  firstName: string
  secondName: string
  thirdName: string
  lastName: string
  phone: string
  location: string
  nationalId: string
  licenseNumber: string
  licenseExpiryDate: string
  status: string
  createdAt?: any
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'admin' | 'system'
  read: boolean
  createdAt: any
}

interface Rating {
  id: string
  nurseId?: string
  beneficiaryId?: string
  beneficiaryName: string
  nurseName?: string
  rating: number
  comment?: string
  serviceName?: string
  requestId?: string
  createdAt?: any
}

interface AdminSettings {
  phone?: string
  email?: string
  emergencyPhone?: string
  referralBonusPoints?: number
  referralBonusPointsReceiver?: number
  referralEnabled?: boolean
}

// ==================== Tab Configuration ====================

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'assignments', label: 'المهام', icon: ClipboardList },
  { key: 'schedule', label: 'الجدول', icon: Calendar },
  { key: 'ratings', label: 'التقييمات', icon: Star },
  { key: 'profile', label: 'الملف الشخصي', icon: User },
  { key: 'notifications', label: 'الإشعارات', icon: Bell },
  { key: 'help', label: 'المساعدة', icon: HelpCircle },
]

// ==================== FAQ Data ====================

const faqItems = [
  {
    question: 'كيف أبدأ تنفيذ مهمة؟',
    answer: 'عند تعيين مهمة لك، ستظهر في قسم المهام بحالة "معيّن". اضغط على زر "بدء التنفيذ" للبدء في العمل على المهمة. سيتم تغيير حالتها تلقائياً إلى "قيد التنفيذ".'
  },
  {
    question: 'كيف أنهي مهمة؟',
    answer: 'بعد بدء التنفيذ، ستظهر حالة المهمة "قيد التنفيذ". عند الانتهاء من تنفيذ الخدمة، اضغط على زر "إكمال المهمة". يمكنك إضافة ملاحظات عند الإكمال لتوثيق ما تم تنفيذه.'
  },
  {
    question: 'لماذا لا أرى أي مهام؟',
    answer: 'يتم تعيين المهام من قبل الإدارة بناءً على التخصص والموقع. عند توفر مهمة مناسبة لك، سيتم إشعارك فوراً وستظهر في قسم المهام.'
  },
  {
    question: 'كيف أتحقق من حالة ترخيصي؟',
    answer: 'يمكنك الاطلاع على معلومات ترخيصك في قسم "الملف الشخصي" بما في ذلك رقم المزاولة وتاريخ انتهاء المزاولة. تأكد من تجديد رخصتك قبل انتهاء الصلاحية.'
  },
  {
    question: 'كيف أتواصل مع الدعم الفني؟',
    answer: 'يمكنك التواصل مع فريق الدعم الفني عبر أرقام الطوارئ أو البريد الإلكتروني الموضحة في قسم "المساعدة". فريقنا متاح على مدار الساعة لمساعدتك.'
  },
  {
    question: 'هل يمكنني تعديل معلوماتي الشخصية؟',
    answer: 'يمكنك تعديل موقعك فقط من خلال قسم "الملف الشخصي". أما المعلومات الأخرى مثل الاسم ورقم الهاتف والرقم الوطني ورقم المزاولة فلا يمكن تعديلها إلا من خلال الإدارة.'
  },
]

// ==================== Arabic Day Names ====================

const arabicDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const arabicDayShort = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

// ==================== Floating Orbs Component ====================

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-violet-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )
}

// ==================== Animation Variants ====================

const cardStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// ==================== Main Component ====================

export default function NurseDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()

  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [profile, setProfile] = useState<NurseProfile | null>(null)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Assignments tab state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Chat state
  const [activeChatRequestId, setActiveChatRequestId] = useState<string | null>(null)
  const [chatOtherPartyName, setChatOtherPartyName] = useState<string>('')

  // Profile tab state - only location
  const [locationValue, setLocationValue] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Ratings state - fetch from API
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratingsLoading, setRatingsLoading] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Help tab - admin settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Schedule state
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('')

  const nurseId = (user as any)?.id
  const nurseName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`

  // ==================== Data Fetching ====================

  const fetchAssignments = useCallback(async () => {
    if (!nurseId) return
    setAssignmentsLoading(true)
    try {
      const res = await fetch(`/api/nurse/assignments?nurseId=${nurseId}`)
      if (res.ok) {
        const data = await res.json()
        setAssignments(Array.isArray(data) ? data : [])
      } else {
        setAssignments([])
      }
    } catch {
      setAssignments([])
      toast({ title: 'خطأ', description: 'فشل تحميل المهام', variant: 'destructive' })
    } finally {
      setAssignmentsLoading(false)
    }
  }, [nurseId, toast])

  const fetchProfile = useCallback(async () => {
    if (!nurseId) return
    setProfileLoading(true)
    try {
      const res = await fetch(`/api/nurse/profile?nurseId=${nurseId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setLocationValue(data.location || '')
      } else {
        setProfile(null)
        toast({ title: 'خطأ', description: 'فشل تحميل الملف الشخصي', variant: 'destructive' })
      }
    } catch {
      setProfile(null)
      toast({ title: 'خطأ', description: 'فشل تحميل الملف الشخصي', variant: 'destructive' })
    } finally {
      setProfileLoading(false)
    }
  }, [nurseId, toast])

  const fetchRatings = useCallback(async () => {
    if (!nurseId) return
    setRatingsLoading(true)
    try {
      const res = await fetch(`/api/nurse/ratings?nurseId=${nurseId}`)
      if (res.ok) {
        const data = await res.json()
        setRatings(Array.isArray(data) ? data : [])
      } else {
        setRatings([])
      }
    } catch {
      setRatings([])
    } finally {
      setRatingsLoading(false)
    }
  }, [nurseId])

  const fetchAdminSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setAdminSettings(data)
      }
    } catch {
      // silently fail
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  // Build notifications from assignments
  useEffect(() => {
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current)
    }

    notifTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => {
        const prevReadState: Record<string, boolean> = {}
        prev.forEach(n => {
          prevReadState[n.id] = n.read
        })

        const notifs: Notification[] = []
        assignments.forEach(a => {
          if (a.status === 'assigned') {
            notifs.push({
              id: `notif-assign-${a.id}`,
              title: 'مهمة جديدة',
              message: `تم تعيين مهمة "${a.request?.service?.name || 'خدمة'}" لك`,
              type: 'assignment',
              read: prevReadState[`notif-assign-${a.id}`] ?? false,
              createdAt: a.createdAt || new Date().toISOString(),
            })
          }
          if (a.status === 'in_progress') {
            notifs.push({
              id: `notif-progress-${a.id}`,
              title: 'تحديث حالة المهمة',
              message: `المهمة "${a.request?.service?.name || 'خدمة'}" قيد التنفيذ`,
              type: 'status_change',
              read: prevReadState[`notif-progress-${a.id}`] ?? true,
              createdAt: a.updatedAt || new Date().toISOString(),
            })
          }
          if (a.status === 'completed') {
            notifs.push({
              id: `notif-complete-${a.id}`,
              title: 'مهمة مكتملة',
              message: `تم إكمال المهمة "${a.request?.service?.name || 'خدمة'}" بنجاح`,
              type: 'status_change',
              read: prevReadState[`notif-complete-${a.id}`] ?? true,
              createdAt: a.updatedAt || new Date().toISOString(),
            })
          }
        })
        notifs.push({
          id: 'notif-system-1',
          title: 'مرحباً بك',
          message: 'أهلاً بك في منصة عافيتك. يمكنك البدء بمراجعة المهام المعينة لك.',
          type: 'system',
          read: prevReadState['notif-system-1'] ?? false,
          createdAt: new Date().toISOString(),
        })
        return notifs
      })
    }, 100)

    return () => {
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current)
      }
    }
  }, [assignments])

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'assignments' || activeTab === 'schedule' || activeTab === 'notifications') {
      fetchAssignments()
    } else if (activeTab === 'profile') {
      fetchProfile()
    } else if (activeTab === 'ratings') {
      fetchRatings()
    } else if (activeTab === 'help') {
      fetchAdminSettings()
    }
  }, [activeTab, fetchAssignments, fetchProfile, fetchRatings, fetchAdminSettings])

  // ==================== Handlers ====================

  const handleUpdateStatus = async (assignmentId: string, status: string, notes?: string) => {
    setActionLoading(true)
    try {
      const body: Record<string, string> = { status }
      if (notes) body.notes = notes
      const res = await fetch(`/api/nurse/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast({
          title: status === 'in_progress' ? 'تم بدء تنفيذ المهمة' : 'تم إكمال المهمة بنجاح',
          description: status === 'completed' ? 'شكراً لجهودك في إنجاز هذه المهمة' : undefined,
        })
        fetchAssignments()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteWithNotes = async () => {
    if (!selectedAssignment) return
    const assignmentId = selectedAssignment.id
    const notes = completionNotes
    setActionLoading(true)
    try {
      const body: Record<string, string> = { status: 'completed' }
      if (notes) body.notes = notes
      const res = await fetch(`/api/nurse/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast({ title: 'تم إكمال المهمة بنجاح', description: 'شكراً لجهودك في إنجاز هذه المهمة' })
        fetchAssignments()
        setCompleteDialogOpen(false)
        setCompletionNotes('')
        setSelectedAssignment(null)
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveLocation = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/nurse/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseId, location: locationValue }),
      })
      if (res.ok) {
        toast({ title: 'تم التحديث', description: 'تم تحديث الموقع بنجاح' })
        fetchProfile()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'فشل التحديث', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const handleOpenChat = (requestId: string, beneficiaryName?: string) => {
    setActiveChatRequestId(requestId)
    setChatOtherPartyName(beneficiaryName || '')
  }

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // ==================== Computed Values ====================

  const assignedCount = assignments.filter(a => a.status === 'assigned').length
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length
  const completedCount = assignments.filter(a => a.status === 'completed').length
  const unreadNotifications = notifications.filter(n => !n.read).length

  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === 'all') return true
    return a.status === statusFilter
  })

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
  }))

  // ==================== Sidebar Component ====================

  const SidebarContent = () => (
    <>
      {/* Logo Header - Nurse gradient */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-2 ring-white/30">
            <Image src="/logo.png" alt="عافيتك" width={44} height={44} className="rounded-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">عافيتك</h2>
            <p className="text-blue-100 text-xs font-medium">حساب الممرض</p>
          </div>
        </div>
      </div>

      {/* Navigation - Glass style */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map(tab => {
          const badgeCount =
            tab.key === 'assignments' ? assignedCount :
            tab.key === 'notifications' ? unreadNotifications : 0

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-l from-cyan-500/10 via-blue-500/10 to-indigo-500/10 text-blue-700 shadow-lg shadow-blue-500/10 ring-1 ring-blue-200/50'
                  : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-700'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.key ? 'text-blue-600' : ''}`} />
              <span className="flex-1 text-right">{tab.label}</span>
              {badgeCount > 0 && (
                <span className="bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-xs min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full shadow-md shadow-blue-500/30 font-bold">
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t bg-gradient-to-t from-slate-50/80 to-white/50">
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-gradient-to-l from-cyan-50/50 to-blue-50/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-gray-800">{nurseName}</p>
            <p className="text-blue-600 text-xs font-medium">ممرض</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  )

  // ==================== Skeleton Loaders ====================

  const CardSkeleton = () => (
    <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/70 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="w-32 h-4 rounded" />
            <Skeleton className="w-20 h-5 rounded-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 rounded" />
              <Skeleton className="h-4 rounded" />
              <Skeleton className="h-4 rounded" />
              <Skeleton className="h-4 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ==================== Render Helpers ====================

  const renderStars = (count: number, size: string = 'w-5 h-5') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < count ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <ClipboardList className="w-5 h-5 text-blue-500" />
      case 'status_change': return <Activity className="w-5 h-5 text-emerald-500" />
      case 'admin': return <User className="w-5 h-5 text-indigo-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  // ==================== Assignments Tab ====================

  const AssignmentsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/25">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{assignments.length.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-blue-600/70 font-medium">إجمالي المهام</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-lg shadow-purple-500/15 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-purple-500/25">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{assignedCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-purple-600/70 font-medium">بانتظار البدء</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg shadow-orange-500/15 hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-500/25">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-orange-700">{inProgressCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-orange-600/70 font-medium">قيد التنفيذ</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/25">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{completedCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-emerald-600/70 font-medium">مكتملة</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">المهام المعينة</h1>
          <p className="text-gray-500 text-sm mt-1">المهام المسندة إليك من قبل الإدارة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-blue-500" />
          {[
            { key: 'all', label: 'الكل' },
            { key: 'assigned', label: 'معيّن' },
            { key: 'in_progress', label: 'قيد التنفيذ' },
            { key: 'completed', label: 'مكتمل' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === filter.key
                  ? 'bg-gradient-to-l from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/70 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Cards */}
      {assignmentsLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-gray-600 mb-2">لا توجد مهام {statusFilter !== 'all' ? 'بهذه الحالة' : 'معينة حالياً'}</p>
          <p className="text-sm text-gray-400">
            {statusFilter !== 'all' ? 'جرّب تصفية أخرى' : 'سيتم إشعارك عند تعيين مهمة جديدة لك'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAssignments.map((assignment, index) => {
              const borderColor = assignment.status === 'assigned' ? 'border-r-purple-500' : assignment.status === 'in_progress' ? 'border-r-orange-500' : 'border-r-emerald-500'

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-0 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group bg-white/80 backdrop-blur-sm border-r-4 ${borderColor}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Service & Status */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                              <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold truncate text-gray-800">
                                {assignment.request?.service?.name || 'خدمة'}
                              </h3>
                              <Badge className={`${assignment.status === 'assigned' ? 'bg-gradient-to-l from-purple-100 to-violet-100 text-purple-700 border-purple-200' : assignment.status === 'in_progress' ? 'bg-gradient-to-l from-orange-100 to-amber-100 text-orange-700 border-orange-200' : 'bg-gradient-to-l from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200'} text-xs border font-bold`}>
                                {getStatusLabel(assignment.status)}
                              </Badge>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {assignment.request?.beneficiary?.name && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="font-medium text-gray-700">المستفيد:</span>
                                <span className="text-gray-500 truncate">{assignment.request.beneficiary.name}</span>
                              </div>
                            )}
                            {assignment.request?.beneficiary?.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                <span className="font-medium text-gray-700">الهاتف:</span>
                                <span className="text-gray-500" dir="ltr">{assignment.request.beneficiary.phone}</span>
                              </div>
                            )}
                            {assignment.request?.beneficiary?.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-medium text-gray-700">الموقع:</span>
                                <span className="text-gray-500">{assignment.request.beneficiary.location}</span>
                              </div>
                            )}
                            {assignment.request?.service?.price !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-700">السعر:</span>
                                <span className="text-emerald-600 font-bold">{formatPrice(assignment.request.service.price)}</span>
                              </div>
                            )}
                            {assignment.createdAt && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium text-gray-700">تاريخ التعيين:</span>
                                <span className="text-gray-500">{formatDate(assignment.createdAt)}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {assignment.request?.notes && (
                            <div className="mt-3 bg-gradient-to-l from-amber-50 to-orange-50/50 rounded-xl p-2.5 text-sm ring-1 ring-amber-200/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                <span className="font-bold text-amber-800">ملاحظات المستفيد:</span>
                              </div>
                              <p className="text-amber-700">{assignment.request.notes}</p>
                            </div>
                          )}

                          {/* Address */}
                          {assignment.request?.address && (
                            <div className="mt-2 flex items-center gap-1.5 text-sm">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="font-medium text-gray-700">العنوان:</span>
                              <span className="text-gray-500">{assignment.request.address}</span>
                            </div>
                          )}

                          {/* Assignment Notes */}
                          {assignment.notes && (
                            <div className="mt-2 bg-gradient-to-l from-blue-50 to-indigo-50/50 rounded-xl p-2.5 text-sm ring-1 ring-blue-200/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-bold text-blue-800">ملاحظات التنفيذ:</span>
                              </div>
                              <p className="text-blue-700">{assignment.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                          {assignment.status === 'assigned' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-l from-violet-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/25 transition-all duration-300"
                              onClick={() => handleUpdateStatus(assignment.id, 'in_progress')}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Play className="w-4 h-4 ml-1" />}
                              بدء التنفيذ
                            </Button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 transition-all duration-300"
                              onClick={() => {
                                setSelectedAssignment(assignment)
                                setCompleteDialogOpen(true)
                              }}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              إكمال المهمة
                            </Button>
                          )}
                          {assignment.status === 'completed' && (
                            <Badge className="bg-gradient-to-l from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 border font-bold">
                              <CheckCircle className="w-3.5 h-3.5 ml-1" />
                              تم الإكمال
                            </Badge>
                          )}
                          {(assignment.status === 'assigned' || assignment.status === 'in_progress') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-white hover:bg-gradient-to-l hover:from-cyan-500 hover:to-blue-600 border-blue-200 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                              onClick={() => handleOpenChat(assignment.requestId, assignment.request?.beneficiary?.name)}
                            >
                              <MessageSquare className="w-4 h-4 ml-1" />
                              محادثة
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  // ==================== Schedule Tab ====================

  const ScheduleTab = () => {
    const today = new Date()
    const todayKey = getDateKey(today)

    // Initialize selected date to today if not set
    const activeDateKey = selectedScheduleDate || todayKey

    // Build week days (Sunday = 0 to Saturday = 6)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Go to Sunday

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateKey = getDateKey(date)
      const dayIndex = date.getDay()

      // Get assignments for this day
      const dayAssignments = assignments.filter(a => {
        const assignDateKey = getDateKey(a.createdAt)
        return assignDateKey === dateKey
      })

      const isToday = dateKey === todayKey
      const hasAssignments = dayAssignments.length > 0

      // Status dots for the day
      const statusDots: string[] = []
      dayAssignments.forEach(a => {
        if (a.status === 'assigned' && !statusDots.includes('assigned')) statusDots.push('assigned')
        if (a.status === 'in_progress' && !statusDots.includes('in_progress')) statusDots.push('in_progress')
        if (a.status === 'completed' && !statusDots.includes('completed')) statusDots.push('completed')
      })

      return { date, dateKey, dayIndex, dayName: arabicDayNames[dayIndex], dayShort: arabicDayShort[dayIndex], dayNumber: date.getDate(), isToday, hasAssignments, dayAssignments, statusDots }
    })

    // Get assignments for selected date
    const selectedDayAssignments = assignments.filter(a => {
      return getDateKey(a.createdAt) === activeDateKey
    })

    const statusDotColor: Record<string, string> = {
      assigned: 'bg-purple-400',
      in_progress: 'bg-orange-400',
      completed: 'bg-emerald-400',
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">الجدول الأسبوعي</h1>
          <p className="text-gray-500 text-sm mt-1">عرض المهام حسب الأيام</p>
        </div>

        {/* Weekly Calendar Card */}
        <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-4">
            {/* Month/Year Header */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {today.toLocaleDateString('ar-YE', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            {/* Day Columns */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map(day => (
                <motion.button
                  key={day.dateKey}
                  onClick={() => setSelectedScheduleDate(day.dateKey)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                    activeDateKey === day.dateKey
                      ? day.isToday
                        ? 'bg-gradient-to-b from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50'
                        : 'bg-gradient-to-b from-cyan-500/10 via-blue-500/10 to-indigo-500/10 text-blue-700 shadow-lg shadow-blue-500/15 ring-1 ring-blue-200/50'
                      : day.isToday
                        ? 'bg-gradient-to-b from-cyan-50 via-blue-50 to-indigo-50 ring-2 ring-blue-300/50 text-blue-700'
                        : 'hover:bg-blue-50/50 text-gray-600'
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs font-bold mb-1 ${activeDateKey === day.dateKey && day.isToday ? 'text-white/80' : ''}`}>
                    {day.dayShort}
                  </span>
                  <span className={`text-sm sm:text-lg font-bold mb-1 ${activeDateKey === day.dateKey && day.isToday ? 'text-white' : ''}`}>
                    {day.dayNumber}
                  </span>
                  {/* Status dots */}
                  {day.hasAssignments && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {day.statusDots.map(status => (
                        <span key={status} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${activeDateKey === day.dateKey && day.isToday ? 'bg-white/80' : statusDotColor[status]}`} />
                      ))}
                    </div>
                  )}
                  {/* Assignment count badge */}
                  {day.hasAssignments && (
                    <span className={`text-[9px] sm:text-[10px] font-bold mt-0.5 ${activeDateKey === day.dateKey && day.isToday ? 'text-white/70' : 'text-gray-400'}`}>
                      {day.dayAssignments.length}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Assignments */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-800">
              مهام يوم {weekDays.find(d => d.dateKey === activeDateKey)?.dayName || ''} - {weekDays.find(d => d.dateKey === activeDateKey)?.dayNumber || ''}
            </h3>
          </div>

          {selectedDayAssignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-bold">لا توجد مهام في هذا اليوم</p>
              <p className="text-sm text-gray-400 mt-1">اختر يوماً آخر لعرض المهام</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {selectedDayAssignments.map((assignment, index) => {
                  const borderColor = assignment.status === 'assigned' ? 'border-r-purple-500' : assignment.status === 'in_progress' ? 'border-r-orange-500' : 'border-r-emerald-500'
                  const statusBg = assignment.status === 'assigned' ? 'from-purple-50 to-violet-50' : assignment.status === 'in_progress' ? 'from-orange-50 to-amber-50' : 'from-emerald-50 to-teal-50'

                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`border-0 shadow-lg bg-gradient-to-l ${statusBg} border-r-4 ${borderColor}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                                <Stethoscope className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm truncate text-gray-800">
                                  {assignment.request?.service?.name || 'خدمة'}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {assignment.request?.beneficiary?.name && (
                                    <span>{assignment.request.beneficiary.name}</span>
                                  )}
                                  {formatDateTime(assignment.createdAt) !== 'غير محدد' && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDateTime(assignment.createdAt)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge className={`${assignment.status === 'assigned' ? 'bg-gradient-to-l from-purple-100 to-violet-100 text-purple-700 border-purple-200' : assignment.status === 'in_progress' ? 'bg-gradient-to-l from-orange-100 to-amber-100 text-orange-700 border-orange-200' : 'bg-gradient-to-l from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200'} text-xs border font-bold`}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==================== Ratings Tab ====================

  const RatingsTab = () => {
    if (ratingsLoading) {
      return (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Skeleton className="w-20 h-20 rounded-full mx-auto mb-2" />
                  <Skeleton className="w-16 h-4 mx-auto" />
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(i => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">التقييمات</h1>
          <p className="text-gray-500 text-sm mt-1">تقييمات المستفيدين لأدائك</p>
        </div>

        {ratings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-gray-600 mb-2">لا توجد تقييمات بعد</p>
            <p className="text-sm text-gray-400">ستظهر التقييمات هنا بعد إكمال المهام وتقييمها من قبل المستفيدين</p>
          </motion.div>
        ) : (
          <>
            {/* Summary Card */}
            <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">{averageRating.toFixed(1)}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          {renderStars(Math.round(averageRating), 'w-3 h-3')}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{ratings.length} تقييم</p>
                    <p className="text-xs text-gray-400">المتوسط العام</p>
                  </div>

                  {/* Distribution */}
                  <div className="flex-1 w-full space-y-2">
                    {ratingDistribution.map(({ star, count }) => {
                      const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-600 w-8 text-left">{star}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-indigo-500 rounded-full"
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-500 w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Ratings */}
            <div className="space-y-3">
              <AnimatePresence>
                {ratings.map((rating, index) => (
                  <motion.div
                    key={rating.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 bg-white/80 backdrop-blur-sm border-r-4 border-r-amber-400">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                                <Star className="w-4 h-4 text-white fill-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-800">{rating.beneficiaryName || 'مستفيد'}</h4>
                                {rating.serviceName && (
                                  <p className="text-xs text-gray-400">{rating.serviceName}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {renderStars(rating.rating, 'w-4 h-4')}
                              <span className="text-sm font-bold text-amber-600 mr-1">{rating.rating}/5</span>
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-gray-600 bg-gradient-to-l from-amber-50/50 to-orange-50/50 rounded-lg p-2.5 ring-1 ring-amber-200/20">
                                {rating.comment}
                              </p>
                            )}
                            {rating.createdAt && (
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(rating.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    )
  }

  // ==================== Profile Tab ====================

  const ProfileTab = () => {
    if (profileLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!profile) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">فشل تحميل الملف الشخصي</p>
        </div>
      )
    }

    const fullName = `${profile.firstName || ''} ${profile.secondName || ''} ${profile.thirdName || ''} ${profile.lastName || ''}`.trim()

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">الملف الشخصي</h1>
          <p className="text-gray-500 text-sm mt-1">معلوماتك الشخصية والمهنية</p>
        </div>

        {/* Profile Header Card */}
        <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
                <Badge className="mt-1 bg-gradient-to-l from-cyan-100 via-blue-100 to-indigo-100 text-blue-700 border-blue-200 border font-bold">
                  {getStatusLabel(profile.status)}
                </Badge>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-l from-slate-50 to-gray-50/50 rounded-xl p-3.5 ring-1 ring-gray-200/30">
                <Label className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5" />
                  الاسم الكامل
                </Label>
                <p className="text-sm font-bold text-gray-800">{fullName}</p>
              </div>
              <div className="bg-gradient-to-l from-slate-50 to-gray-50/50 rounded-xl p-3.5 ring-1 ring-gray-200/30">
                <Label className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  رقم الهاتف
                </Label>
                <p className="text-sm font-bold text-gray-800" dir="ltr">{profile.phone}</p>
              </div>
              <div className="bg-gradient-to-l from-slate-50 to-gray-50/50 rounded-xl p-3.5 ring-1 ring-gray-200/30">
                <Label className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  الرقم الوطني
                </Label>
                <p className="text-sm font-bold text-gray-800" dir="ltr">{profile.nationalId}</p>
              </div>
              <div className="bg-gradient-to-l from-slate-50 to-gray-50/50 rounded-xl p-3.5 ring-1 ring-gray-200/30">
                <Label className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  تاريخ التسجيل
                </Label>
                <p className="text-sm font-bold text-gray-800">{formatDate(profile.createdAt)}</p>
              </div>
            </div>

            {/* License Card */}
            <Card className="border-0 shadow-md bg-gradient-to-l from-cyan-50 via-blue-50 to-indigo-50 ring-1 ring-blue-200/30 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">رخصة المزاولة</h3>
                    <p className="text-xs text-gray-400">معلومات الترخيص المهني</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">رقم المزاولة</Label>
                    <p className="text-sm font-bold text-blue-700" dir="ltr">{profile.licenseNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">تاريخ الانتهاء</Label>
                    <p className="text-sm font-bold text-blue-700">{formatDate(profile.licenseExpiryDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="mb-6" />

            {/* Editable Location Field */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800">الموقع</h3>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-[10px]">قابل للتعديل</Badge>
              </div>
              <div className="bg-gradient-to-l from-cyan-50/50 via-blue-50/50 to-indigo-50/50 rounded-xl p-4 ring-1 ring-blue-200/30">
                <Label htmlFor="location" className="text-xs text-gray-400 font-medium mb-2 block">
                  عنوانك الفعلي
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={locationValue}
                    onChange={e => setLocationValue(e.target.value)}
                    placeholder="سيتم تحديد موقعك تلقائياً أو أدخل العنوان يدوياً"
                    className="bg-white/80 border-blue-200/50 focus:border-blue-400 rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const { latitude, longitude } = pos.coords
                            setLocationValue(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                            toast({ title: 'تم تحديد الموقع', description: `خط العرض: ${latitude.toFixed(4)}, خط الطول: ${longitude.toFixed(4)}` })
                          },
                          (err) => {
                            toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        )
                      } else {
                        toast({ title: 'غير مدعوم', description: 'متصفحك لا يدعم تحديد الموقع', variant: 'destructive' })
                      }
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-blue-500 mt-2 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  اضغط على زر الموقع لتحديد موقعك تلقائياً عبر GPS أو أدخل العنوان يدوياً
                </p>
                <Button
                  onClick={handleSaveLocation}
                  disabled={profileSaving || locationValue === profile.location}
                  className="mt-3 bg-gradient-to-l from-cyan-500 via-blue-500 to-indigo-500 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 transition-all duration-300 w-full sm:w-auto"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 ml-1" />
                      تحديث الموقع
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== Notifications Tab ====================

  const NotificationsTab = () => {
    const sortedNotifications = [...notifications].sort((a, b) => {
      const dateA = a.createdAt ? new Date(typeof a.createdAt === 'object' && 'seconds' in a.createdAt ? a.createdAt.seconds * 1000 : a.createdAt as string).getTime() : 0
      const dateB = b.createdAt ? new Date(typeof b.createdAt === 'object' && 'seconds' in b.createdAt ? b.createdAt.seconds * 1000 : b.createdAt as string).getTime() : 0
      return dateB - dateA
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">الإشعارات</h1>
            <p className="text-gray-500 text-sm mt-1">آخر التحديثات والمستجدات</p>
          </div>
          {unreadNotifications > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {sortedNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-gray-600 mb-2">لا توجد إشعارات</p>
            <p className="text-sm text-gray-400">ستظهر الإشعارات هنا عند وجود تحديثات</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`cursor-pointer ${!notif.read ? 'border-r-4' : ''}`}
                >
                  <Card className={`border-0 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 ${
                    !notif.read
                      ? 'bg-gradient-to-l from-cyan-50/50 via-blue-50/50 to-indigo-50/50 border-r-blue-500'
                      : 'bg-white/80 backdrop-blur-sm'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                          !notif.read
                            ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 shadow-blue-500/20'
                            : 'bg-gradient-to-br from-gray-100 to-slate-100 shadow-gray-200/20'
                        }`}>
                          {notif.read ? (
                            <Bell className="w-5 h-5 text-gray-400" />
                          ) : (
                            (() => {
                              switch (notif.type) {
                                case 'assignment': return <ClipboardList className="w-5 h-5 text-white" />
                                case 'status_change': return <Activity className="w-5 h-5 text-white" />
                                default: return <Bell className="w-5 h-5 text-white" />
                              }
                            })()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`font-bold text-sm ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shrink-0 shadow-sm shadow-blue-500/30" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  // ==================== Help Tab ====================

  const HelpTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">المساعدة</h1>
        <p className="text-gray-500 text-sm mt-1">الأسئلة الشائعة ومعلومات التواصل</p>
      </div>

      {/* Contact Info Card */}
      <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">معلومات التواصل</h3>
              <p className="text-xs text-gray-400">تواصل معنا في أي وقت</p>
            </div>
          </div>

          {settingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-3">
              {adminSettings?.emergencyPhone && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-l from-red-50 to-rose-50/50 rounded-xl ring-1 ring-red-200/30">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600">رقم الطوارئ</p>
                    <p className="text-sm font-bold text-gray-800" dir="ltr">{adminSettings.emergencyPhone}</p>
                  </div>
                </div>
              )}
              {adminSettings?.phone && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-l from-blue-50 to-cyan-50/50 rounded-xl ring-1 ring-blue-200/30">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600">الهاتف</p>
                    <p className="text-sm font-bold text-gray-800" dir="ltr">{adminSettings.phone}</p>
                  </div>
                </div>
              )}
              {adminSettings?.email && (
                <div className="flex items-center gap-3 p-3.5 bg-gradient-to-l from-indigo-50 to-blue-50/50 rounded-xl ring-1 ring-indigo-200/30">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-600">البريد الإلكتروني</p>
                    <p className="text-sm font-bold text-gray-800" dir="ltr">{adminSettings.email}</p>
                  </div>
                </div>
              )}
              {!adminSettings?.phone && !adminSettings?.email && !adminSettings?.emergencyPhone && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">لم يتم تعيين معلومات التواصل بعد</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="border-0 shadow-lg shadow-blue-500/5 bg-white/80 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">الأسئلة الشائعة</h3>
              <p className="text-xs text-gray-400">إجابات على الأسئلة المتكررة</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-0 bg-gradient-to-l from-slate-50/50 to-gray-50/30 rounded-xl px-4 ring-1 ring-gray-200/20">
                <AccordionTrigger className="text-sm font-bold text-gray-700 hover:text-blue-600 hover:no-underline text-right py-3.5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )

  // ==================== Tab Renderer ====================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignments': return <AssignmentsTab />
      case 'schedule': return <ScheduleTab />
      case 'ratings': return <RatingsTab />
      case 'profile': return <ProfileTab />
      case 'notifications': return <NotificationsTab />
      case 'help': return <HelpTab />
      default: return <AssignmentsTab />
    }
  }

  // ==================== Main Render ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative" dir="rtl">
      <FloatingOrbs />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={32} height={32} className="rounded-lg" />
            <h1 className="text-lg font-bold bg-gradient-to-l from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">عافيتك</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {tabs.map(tab => {
            const badgeCount =
              tab.key === 'assignments' ? assignedCount :
              tab.key === 'notifications' ? unreadNotifications : 0

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-l from-cyan-500/10 via-blue-500/10 to-indigo-500/10 text-blue-700 shadow-md ring-1 ring-blue-200/50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {badgeCount > 0 && (
                  <span className="bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-[9px] min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full font-bold">
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 w-72 bg-white/70 backdrop-blur-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:w-72 lg:w-80 flex-col fixed top-0 right-0 bottom-0 z-10 bg-white/70 backdrop-blur-xl border-l border-white/20 shadow-xl">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <main className="flex-1 md:mr-72 lg:mr-80">
          <div className="pt-28 md:pt-0 p-4 md:p-8 max-w-5xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>

            {/* Chat System */}
            {activeChatRequestId && (
              <ChatSystem
                requestId={activeChatRequestId}
                userId={nurseId}
                userName={nurseName}
                userType="nurse"
                otherPartyName={chatOtherPartyName}
              />
            )}
          </div>
        </main>
      </div>

      {/* Complete Assignment Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              إكمال المهمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              هل أنت متأكد من إكمال المهمة
              <span className="font-bold text-gray-800"> {selectedAssignment?.request?.service?.name || 'الخدمة'} </span>
              للمستفيد
              <span className="font-bold text-gray-800"> {selectedAssignment?.request?.beneficiary?.name || ''}</span>
              ؟
            </p>
            <div>
              <Label htmlFor="completion-notes" className="text-sm font-medium text-gray-700 mb-2 block">
                ملاحظات الإكمال (اختياري)
              </Label>
              <Textarea
                id="completion-notes"
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                placeholder="أضف ملاحظات حول تنفيذ المهمة..."
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 rounded-xl min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCompleteDialogOpen(false)
                setCompletionNotes('')
                setSelectedAssignment(null)
              }}
              className="rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCompleteWithNotes}
              disabled={actionLoading}
              className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 transition-all duration-300 rounded-xl"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  جاري الإكمال...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 ml-1" />
                  تأكيد الإكمال
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
