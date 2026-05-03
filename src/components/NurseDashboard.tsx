'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, ClipboardList, User, LogOut, Loader2, Play, CheckCircle,
  Menu, X, Phone, MapPin, Clock, HelpCircle, Bell, Activity,
  Calendar, Star, Filter, MessageSquare, ChevronDown, ChevronUp
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

// ==================== Types ====================

type Tab = 'assignments' | 'schedule' | 'ratings' | 'profile' | 'notifications' | 'help'

interface Assignment {
  id: string
  nurseId: string
  requestId: string
  status: string
  notes?: string
  createdAt?: string
  updatedAt?: string
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
  createdAt?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'admin' | 'system'
  read: boolean
  createdAt: string
}

interface Rating {
  id: string
  beneficiaryName: string
  rating: number
  comment: string
  serviceName: string
  createdAt: string
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
    answer: 'يمكنك التواصل مع فريق الدعم الفني عبر رقم الهاتف: 777-000-000 أو من خلال البريد الإلكتروني: support@afiyatak.com. فريقنا متاح على مدار الساعة لمساعدتك.'
  },
  {
    question: 'هل يمكنني تعديل معلوماتي الشخصية؟',
    answer: 'نعم، يمكنك تعديل بعض المعلومات الشخصية مثل الاسم ورقم الهاتف والموقع من خلال قسم "الملف الشخصي". أما المعلومات المهنية مثل رقم المزاولة والرقم الوطني فلا يمكن تعديلها إلا من خلال الإدارة.'
  },
]

// ==================== Main Component ====================

export default function NurseDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()

  // Core state
  const [activeTab, setActiveTab] = useState<Tab>('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [profile, setProfile] = useState<NurseProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Assignments tab state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Chat state
  const [activeChatRequestId, setActiveChatRequestId] = useState<string | null>(null)

  // Profile tab state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    secondName: '',
    thirdName: '',
    lastName: '',
    phone: '',
    location: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Notifications tab state (mock)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)

  // Ratings (mock data)
  const [ratings] = useState<Rating[]>([
    {
      id: '1',
      beneficiaryName: 'أحمد محمد',
      rating: 5,
      comment: 'خدمة ممتازة وممرض محترف جداً',
      serviceName: 'التمريض المنزلي',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      beneficiaryName: 'فاطمة علي',
      rating: 4,
      comment: 'خدمة جيدة والتزام بالمواعيد',
      serviceName: 'قياس الضغط',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      beneficiaryName: 'خالد حسن',
      rating: 5,
      comment: 'رعاية ممتازة واهتمام بالتفاصيل',
      serviceName: 'العناية بالجروح',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ])

  const nurseId = (user as any)?.id
  const nurseName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`

  // ==================== Data Fetching ====================

  const fetchAssignments = useCallback(async () => {
    if (!nurseId) return
    setLoading(true)
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
      setLoading(false)
    }
  }, [nurseId, toast])

  const fetchProfile = useCallback(async () => {
    if (!nurseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/nurse/profile?nurseId=${nurseId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setProfileForm({
          firstName: data.firstName || '',
          secondName: data.secondName || '',
          thirdName: data.thirdName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          location: data.location || '',
        })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل الملف الشخصي', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [nurseId, toast])

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    // Mock notifications based on assignments
    setTimeout(() => {
      const notifs: Notification[] = []
      assignments.forEach((a, i) => {
        if (a.status === 'assigned') {
          notifs.push({
            id: `notif-assign-${a.id}`,
            title: 'مهمة جديدة',
            message: `تم تعيين مهمة "${a.request?.service?.name || 'خدمة'}" لك`,
            type: 'assignment',
            read: false,
            createdAt: a.createdAt || new Date().toISOString(),
          })
        }
        if (a.status === 'in_progress') {
          notifs.push({
            id: `notif-progress-${a.id}`,
            title: 'تحديث حالة المهمة',
            message: `المهمة "${a.request?.service?.name || 'خدمة'}" قيد التنفيذ`,
            type: 'status_change',
            read: true,
            createdAt: a.updatedAt || new Date().toISOString(),
          })
        }
        if (a.status === 'completed') {
          notifs.push({
            id: `notif-complete-${a.id}`,
            title: 'مهمة مكتملة',
            message: `تم إكمال المهمة "${a.request?.service?.name || 'خدمة'}" بنجاح`,
            type: 'status_change',
            read: true,
            createdAt: a.updatedAt || new Date().toISOString(),
          })
        }
      })
      // Add a system notification
      notifs.push({
        id: 'notif-system-1',
        title: 'مرحباً بك',
        message: 'أهلاً بك في منصة عافيتك. يمكنك البدء بمراجعة المهام المعينة لك.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      })
      setNotifications(notifs)
      setNotifLoading(false)
    }, 300)
  }, [assignments])

  useEffect(() => {
    if (activeTab === 'assignments' || activeTab === 'schedule') {
      fetchAssignments()
    } else if (activeTab === 'profile') {
      fetchProfile()
    } else if (activeTab === 'notifications') {
      fetchAssignments() // fetch assignments first, then build notifications
    }
  }, [activeTab, fetchAssignments, fetchProfile, fetchNotifications])

  useEffect(() => {
    if (activeTab === 'notifications' && assignments.length >= 0) {
      fetchNotifications()
    }
  }, [activeTab, assignments, fetchNotifications])

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

  const handleCompleteWithNotes = () => {
    if (!selectedAssignment) return
    handleUpdateStatus(selectedAssignment.id, 'completed', completionNotes)
    setCompleteDialogOpen(false)
    setCompletionNotes('')
    setSelectedAssignment(null)
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch('/api/nurse/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseId, ...profileForm }),
      })
      if (res.ok) {
        toast({ title: 'تم التحديث', description: 'تم تحديث الملف الشخصي بنجاح' })
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
    if (statusFilter === 'assigned') return a.status === 'assigned'
    if (statusFilter === 'in_progress') return a.status === 'in_progress'
    if (statusFilter === 'completed') return a.status === 'completed'
    return true
  })

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  // ==================== Sidebar Component ====================

  const SidebarContent = () => (
    <>
      {/* Logo Header */}
      <div className="p-6 border-b bg-gradient-to-l from-violet-500 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">عافيتك</h2>
            <p className="text-violet-100 text-xs">حساب الممرض</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map(tab => {
          const badgeCount =
            tab.key === 'assignments' ? assignedCount :
            tab.key === 'notifications' ? unreadNotifications : 0

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-violet-50 text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-right">{tab.label}</span>
              {badgeCount > 0 && (
                <span className="bg-violet-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full">
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{nurseName}</p>
            <p className="text-muted-foreground text-xs">ممرض</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  )

  // ==================== Skeleton Loaders ====================

  const StatsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Skeleton className="w-6 h-6 mx-auto mb-2 rounded" />
            <Skeleton className="w-8 h-8 mx-auto mb-1 rounded" />
            <Skeleton className="w-16 h-3 mx-auto rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const CardSkeleton = () => (
    <Card className="border-0 shadow-sm">
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
      case 'assignment': return <ClipboardList className="w-5 h-5 text-violet-500" />
      case 'status_change': return <Activity className="w-5 h-5 text-emerald-500" />
      case 'admin': return <User className="w-5 h-5 text-blue-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  // ==================== Tab Content ====================

  const AssignmentsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-4 text-center">
              <ClipboardList className="w-6 h-6 text-violet-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-violet-700">{assignments.length.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-muted-foreground">إجمالي المهام</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4 text-center">
              <Bell className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{assignedCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-muted-foreground">بانتظار البدء</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-700">{inProgressCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-700">{completedCount.toLocaleString('ar-YE')}</p>
              <p className="text-xs text-muted-foreground">مكتملة</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">المهام المعينة</h1>
          <p className="text-muted-foreground text-sm">المهام المسندة إليك من قبل الإدارة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {[
            { key: 'all', label: 'الكل' },
            { key: 'assigned', label: 'معيّن' },
            { key: 'in_progress', label: 'قيد التنفيذ' },
            { key: 'completed', label: 'مكتمل' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === filter.key
                  ? 'bg-violet-100 text-violet-700 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Cards */}
      {loading ? (
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
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500 mb-2">لا توجد مهام {statusFilter !== 'all' ? 'بهذه الحالة' : 'معينة حالياً'}</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== 'all' ? 'جرّب تصفية أخرى' : 'سيتم إشعارك عند تعيين مهمة جديدة لك'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Service & Status */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">
                              {assignment.request?.service?.name || 'خدمة'}
                            </h3>
                            <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {assignment.request?.beneficiary?.name && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">المستفيد:</span>
                              <span className="text-muted-foreground truncate">{assignment.request.beneficiary.name}</span>
                            </div>
                          )}
                          {assignment.request?.beneficiary?.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">الهاتف:</span>
                              <span className="text-muted-foreground" dir="ltr">{assignment.request.beneficiary.phone}</span>
                            </div>
                          )}
                          {assignment.request?.beneficiary?.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">الموقع:</span>
                              <span className="text-muted-foreground">{assignment.request.beneficiary.location}</span>
                            </div>
                          )}
                          {assignment.request?.service?.price !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">السعر:</span>
                              <span className="text-emerald-600 font-semibold">{formatPrice(assignment.request.service.price)}</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {assignment.request?.notes && (
                          <div className="mt-3 bg-amber-50 rounded-lg p-2.5 text-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span className="font-medium text-amber-800">ملاحظات المستفيد:</span>
                            </div>
                            <p className="text-amber-700">{assignment.request.notes}</p>
                          </div>
                        )}

                        {/* Address */}
                        {assignment.request?.address && (
                          <div className="mt-2 flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-medium">العنوان:</span>
                            <span className="text-muted-foreground">{assignment.request.address}</span>
                          </div>
                        )}

                        {/* Assignment Notes (from nurse) */}
                        {assignment.notes && (
                          <div className="mt-2 bg-violet-50 rounded-lg p-2.5 text-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                              <span className="font-medium text-violet-800">ملاحظات التنفيذ:</span>
                            </div>
                            <p className="text-violet-700">{assignment.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {assignment.status === 'assigned' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 shadow-sm"
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
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-sm"
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
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 ml-1" />
                            تم الإكمال
                          </Badge>
                        )}
                        {(assignment.status === 'assigned' || assignment.status === 'in_progress') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            onClick={() => setActiveChatRequestId(assignment.requestId)}
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
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  const ScheduleTab = () => {
    // Group assignments by date
    const groupedByDate: Record<string, Assignment[]> = {}
    assignments.forEach(a => {
      const dateKey = a.createdAt
        ? new Date(a.createdAt).toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'تاريخ غير محدد'
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = []
      groupedByDate[dateKey].push(a)
    })

    // Weekly view data
    const today = new Date()
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + i)
      const dayName = date.toLocaleDateString('ar-YE', { weekday: 'short' })
      const dateStr = date.toISOString().split('T')[0]
      const hasTasks = assignments.some(a => {
        if (!a.createdAt) return false
        return new Date(a.createdAt).toISOString().split('T')[0] === dateStr
      })
      const dayAssignments = assignments.filter(a => {
        if (!a.createdAt) return false
        return new Date(a.createdAt).toISOString().split('T')[0] === dateStr
      })
      const isToday = date.toDateString() === today.toDateString()
      return { date, dayName, dateStr, hasTasks, isToday, dayAssignments }
    })

    const statusColorMap: Record<string, string> = {
      assigned: 'bg-purple-400',
      in_progress: 'bg-orange-400',
      completed: 'bg-emerald-400',
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">الجدول الأسبوعي</h1>
          <p className="text-muted-foreground text-sm">عرض المهام حسب الأيام</p>
        </div>

        {/* Weekly View Strip */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                    day.isToday ? 'bg-violet-50 ring-2 ring-violet-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-medium ${day.isToday ? 'text-violet-700' : 'text-muted-foreground'}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-lg font-bold mt-1 ${day.isToday ? 'text-violet-700' : ''}`}>
                    {day.date.getDate().toLocaleString('ar-YE')}
                  </span>
                  {day.hasTasks && (
                    <div className="flex gap-0.5 mt-1">
                      {day.dayAssignments.map(a => (
                        <div
                          key={a.id}
                          className={`w-2 h-2 rounded-full ${statusColorMap[a.status] || 'bg-gray-400'}`}
                          title={getStatusLabel(a.status)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">دليل الحالات:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-xs">معيّن</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-xs">قيد التنفيذ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs">مكتمل</span>
          </div>
        </div>

        {/* Grouped by Date */}
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">لا توجد مهام في الجدول</p>
            <p className="text-sm text-muted-foreground">سيتم عرض المهام هنا عند تعيينها لك</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <h3 className="font-semibold text-sm">{date}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length} مهمة</Badge>
                </div>
                <div className="grid gap-3">
                  {items.map(assignment => (
                    <Card key={assignment.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${statusColorMap[assignment.status] || 'bg-gray-400'}`} />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {assignment.request?.service?.name || 'خدمة'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assignment.request?.beneficiary?.name || 'مستفيد'}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                            {getStatusLabel(assignment.status)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const RatingsTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">التقييمات</h1>
        <p className="text-muted-foreground text-sm">تقييمات المستفيدين لخدماتك</p>
      </div>

      {/* Average Rating Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {renderStars(Math.round(averageRating), 'w-8 h-8')}
          </div>
          <p className="text-4xl font-bold text-amber-700 mb-1">{averageRating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">
            متوسط التقييم من {ratings.length.toLocaleString('ar-YE')} تقييم
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratings.filter(r => r.rating === star).length
              const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-1 text-xs">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Individual Ratings */}
      {ratings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500 mb-2">لا توجد تقييمات بعد</p>
          <p className="text-sm text-muted-foreground">ستظهر تقييمات المستفيدين هنا عند إكمال المهام</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating, index) => (
            <motion.div
              key={rating.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{rating.beneficiaryName}</p>
                        <p className="text-xs text-muted-foreground">{rating.serviceName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(rating.rating, 'w-3.5 h-3.5')}
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{rating.comment}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(rating.createdAt).toLocaleDateString('ar-YE')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  const ProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">الملف الشخصي</h1>
        <p className="text-muted-foreground text-sm">معلوماتك المهنية والشخصية</p>
      </div>

      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-40 h-6 rounded" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : profile ? (
        <>
          {/* Profile Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{profile.firstName?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {profile.firstName} {profile.secondName} {profile.thirdName} {profile.lastName}
                  </h3>
                  <Badge className={getStatusColor(profile.status)}>{getStatusLabel(profile.status)}</Badge>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Stethoscope className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">رقم المزاولة</p>
                    <p className="font-medium">{profile.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">انتهاء المزاولة</p>
                    <p className="font-medium">{profile.licenseExpiryDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">الرقم الوطني</p>
                    <p className="font-medium">{profile.nationalId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">تاريخ التسجيل</p>
                    <p className="font-medium">
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-YE') : 'غير متوفر'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Editable Form */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-600" />
                  تعديل المعلومات الشخصية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondName">الاسم الثاني</Label>
                    <Input
                      id="secondName"
                      value={profileForm.secondName}
                      onChange={e => setProfileForm(p => ({ ...p, secondName: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thirdName">الاسم الثالث</Label>
                    <Input
                      id="thirdName"
                      value={profileForm.thirdName}
                      onChange={e => setProfileForm(p => ({ ...p, thirdName: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">اللقب</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      className="rounded-xl"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">الموقع</Label>
                    <Input
                      id="location"
                      value={profileForm.location}
                      onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 shadow-sm rounded-xl px-8"
                  >
                    {profileSaving ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                    حفظ التعديلات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500 mb-2">فشل تحميل الملف الشخصي</p>
          <Button variant="outline" onClick={fetchProfile} className="mt-2">
            إعادة المحاولة
          </Button>
        </motion.div>
      )}
    </div>
  )

  const NotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">الإشعارات</h1>
          <p className="text-muted-foreground text-sm">آخر التحديثات والإشعارات</p>
        </div>
        {unreadNotifications > 0 && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead} className="rounded-xl text-xs">
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {notifLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4 rounded" />
                    <Skeleton className="w-48 h-3 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500 mb-2">لا توجد إشعارات</p>
          <p className="text-sm text-muted-foreground">ستظهر الإشعارات هنا عند توفر تحديثات</p>
        </motion.div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  !notif.read ? 'bg-violet-50/50 border-r-4 border-r-violet-400' : ''
                }`}
                onClick={() => markNotificationRead(notif.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('ar-YE', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  const HelpTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">المساعدة والدعم</h1>
        <p className="text-muted-foreground text-sm">معلومات مهمة للممرضين</p>
      </div>

      {/* FAQ Accordion */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-600" />
              الأسئلة الشائعة
            </h3>
          </div>
          <Accordion type="single" collapsible className="px-4">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-right hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="font-bold text-lg mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-sm text-muted-foreground mb-4">
            فريق الدعم الفني متاح على مدار الساعة لمساعدتك
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" className="rounded-xl gap-2">
              <Phone className="w-4 h-4" />
              <span>777-000-000</span>
            </Button>
            <Button variant="outline" className="rounded-xl gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>support@afiyatak.com</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ==================== Main Render ====================

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-l shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold text-violet-700">عافيتك</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleTabChange('notifications')} className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:mr-72 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'assignments' && <AssignmentsTab />}
              {activeTab === 'schedule' && <ScheduleTab />}
              {activeTab === 'ratings' && <RatingsTab />}
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'help' && <HelpTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              إكمال المهمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAssignment && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-medium text-sm">{selectedAssignment.request?.service?.name || 'خدمة'}</p>
                <p className="text-xs text-muted-foreground">
                  المستفيد: {selectedAssignment.request?.beneficiary?.name || 'غير محدد'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="completionNotes">ملاحظات التنفيذ (اختياري)</Label>
              <Textarea
                id="completionNotes"
                placeholder="أضف ملاحظات حول تنفيذ المهمة..."
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
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
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 rounded-xl"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-1" />}
              تأكيد الإكمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Chat System ===== */}
      {activeChatRequestId && nurseId && (
        <ChatSystem
          requestId={activeChatRequestId}
          userId={nurseId}
          userName={nurseName}
          userType="nurse"
          otherPartyName={assignments.find(a => a.requestId === activeChatRequestId)?.request?.beneficiary?.name}
        />
      )}
    </div>
  )
}
