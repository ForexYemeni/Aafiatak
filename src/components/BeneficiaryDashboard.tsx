'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ClipboardList, CreditCard, LogOut, Loader2, Plus, XCircle,
  ShoppingBag, User, Menu, X, Bell, MapPin, Phone, Home, HelpCircle,
  Star, Filter, RefreshCw, Calendar, Gift, Tag, AlertTriangle,
  Copy, Check, Award, Zap, Share2, MessageCircle, Moon, Sun
} from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import ChatSystem from '@/components/ChatSystem'
import Image from 'next/image'

type Tab = 'services' | 'requests' | 'payments' | 'profile' | 'notifications' | 'loyalty' | 'referral' | 'help'

interface Notification {
  id: string
  title: string
  message: string
  type: 'status_change' | 'admin_message' | 'assignment' | 'general'
  read: boolean
  createdAt: string
  requestId?: string
}

const statusFilters = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'approved', label: 'مقبول' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'cancelled', label: 'ملغي' },
]

const faqItems = [
  {
    q: 'كيف أطلب خدمة؟',
    a: 'انتقل إلى قسم الخدمات، اختر الخدمة المناسبة، اضغط على زر "طلب"، ثم املأ تفاصيل الطلب بما في ذلك العنوان وطريقة الدفع والملاحظات.'
  },
  {
    q: 'كيف أتابع حالة طلبي؟',
    a: 'انتقل إلى قسم "طلباتي" لمشاهدة جميع طلباتك وحالتها الحالية. يمكنك تصفية الطلبات حسب الحالة للعثور على طلب محدد.'
  },
  {
    q: 'هل يمكنني إلغاء طلب؟',
    a: 'نعم، يمكنك إلغاء الطلب إذا كان لا يزال في حالة "قيد الانتظار". بعد قبول الطلب من الإدارة، يرجى التواصل مع الدعم الفني.'
  },
  {
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'يمكنك الاطلاع على طرق الدفع المتاحة في قسم "المدفوعات". يتم دعم الدفع النقدي عند الاستلام بالإضافة إلى طرق الدفع الإلكترونية المتاحة.'
  },
  {
    q: 'كيف أعيد طلب خدمة مكتملة؟',
    a: 'في قسم "طلباتي"، اضغط على زر "إعادة الطلب" بجانب أي طلب مكتمل وسيتم فتح نافذة طلب جديدة بنفس الخدمة.'
  },
  {
    q: 'متى يتم تعيين ممرض/ة لطلبي؟',
    a: 'بعد قبول الطلب من الإدارة، يتم تعيين ممرض/ة مؤهل/ة لتنفيذ الخدمة. ستظهر معلومات الممرض/ة المعين/ة في تفاصيل الطلب.'
  },
]

export default function BeneficiaryDashboard() {
  const { user, setView, logout, darkMode, toggleDarkMode } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('services')
  const [services, setServices] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Request dialog state
  const [requestDialog, setRequestDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [requestForm, setRequestForm] = useState({ paymentMethod: '', notes: '', address: '', couponCode: '' })
  const [submitting, setSubmitting] = useState(false)

  // Coupon validation state
  const [validCoupon, setValidCoupon] = useState<any>(null)
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponError, setCouponError] = useState('')

  // Category filter for services
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Status filter for requests
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Payment methods (for request dialog)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  // Loyalty state
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [loyaltyHistory, setLoyaltyHistory] = useState<any[]>([])
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  // Emergency state
  const [emergencyDialog, setEmergencyDialog] = useState(false)
  const [emergencyForm, setEmergencyForm] = useState({ serviceType: '', address: '', notes: '' })
  const [emergencySubmitting, setEmergencySubmitting] = useState(false)

  // Referral state
  const [referralCode, setReferralCode] = useState<string>('')
  const [referralUses, setReferralUses] = useState(0)
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [referralInput, setReferralInput] = useState('')
  const [referralApplying, setReferralApplying] = useState(false)

  // Chat state
  const [activeChatRequestId, setActiveChatRequestId] = useState<string | null>(null)

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Profile edit
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', location: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const beneficiaryUser = user as { id: string; name: string; phone: string; location: string } | null

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'services') {
        const res = await fetch('/api/beneficiary/services')
        if (res.ok) setServices(await res.json())
      } else if (activeTab === 'requests') {
        const res = await fetch(`/api/beneficiary/requests?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) setRequests(await res.json())
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/beneficiary/payments')
        if (res.ok) setPayments(await res.json())
      } else if (activeTab === 'loyalty') {
        const res = await fetch(`/api/loyalty?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) {
          const data = await res.json()
          setLoyaltyBalance(data.balance || 0)
          setLoyaltyHistory(data.history || [])
        }
      } else if (activeTab === 'referral') {
        const res = await fetch(`/api/referral?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) {
          const data = await res.json()
          setReferralCode(data.code || '')
          setReferralUses(data.uses || 0)
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, beneficiaryUser?.id, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch payment methods once for the request dialog
  useEffect(() => {
    fetch('/api/beneficiary/payments')
      .then(res => res.ok ? res.json() : [])
      .then(data => setPaymentMethods(data))
      .catch(() => {})
  }, [])

  // Generate notifications from requests
  useEffect(() => {
    const notifs: Notification[] = []
    requests.forEach(req => {
      if (req.status === 'approved') {
        notifs.push({
          id: `approved-${req.id}`,
          title: 'تم قبول طلبك',
          message: `تم قبول طلب خدمة "${req.service?.name || ''}" وسيتم تعيين ممرض/ة قريباً`,
          type: 'status_change',
          read: false,
          createdAt: req.updatedAt || req.createdAt,
          requestId: req.id,
        })
      }
      if (req.status === 'in_progress' && req.assignment?.nurse) {
        notifs.push({
          id: `assigned-${req.id}`,
          title: 'تم تعيين ممرض/ة',
          message: `تم تعيين ${req.assignment.nurse.firstName} ${req.assignment.nurse.lastName} لتنفيذ خدمة "${req.service?.name || ''}"`,
          type: 'assignment',
          read: false,
          createdAt: req.updatedAt || req.createdAt,
          requestId: req.id,
        })
      }
      if (req.status === 'completed') {
        notifs.push({
          id: `completed-${req.id}`,
          title: 'تم إكمال الخدمة',
          message: `تم إكمال خدمة "${req.service?.name || ''}" بنجاح`,
          type: 'status_change',
          read: false,
          createdAt: req.updatedAt || req.createdAt,
          requestId: req.id,
        })
      }
      if (req.adminNotes) {
        notifs.push({
          id: `admin-note-${req.id}`,
          title: 'ملاحظة من الإدارة',
          message: req.adminNotes,
          type: 'admin_message',
          read: false,
          createdAt: req.updatedAt || req.createdAt,
          requestId: req.id,
        })
      }
    })
    setNotifications(notifs)
  }, [requests])

  // Load profile data
  useEffect(() => {
    if (activeTab === 'profile' && beneficiaryUser && !profileLoaded) {
      setProfileForm({
        name: beneficiaryUser.name || '',
        phone: beneficiaryUser.phone || '',
        location: beneficiaryUser.location || '',
      })
      setProfileLoaded(true)
    }
  }, [activeTab, beneficiaryUser, profileLoaded])

  // Request service handler
  const handleRequestService = async () => {
    if (!selectedService) return
    if (!requestForm.address.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال العنوان', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/beneficiary/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          serviceId: selectedService.id,
          paymentMethod: requestForm.paymentMethod || null,
          notes: requestForm.notes || null,
          address: requestForm.address || null,
          couponCode: validCoupon?.id || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Add loyalty points for the order
        try {
          await fetch('/api/loyalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              beneficiaryId: beneficiaryUser?.id,
              points: 10,
              reason: 'طلب خدمة جديد',
            }),
          })
        } catch {}
        toast({ title: 'تم إرسال الطلب بنجاح', description: 'سيتم مراجعة طلبك من قبل الإدارة' })
        setRequestDialog(false)
        setSelectedService(null)
        setRequestForm({ paymentMethod: '', notes: '', address: '', couponCode: '' })
        setValidCoupon(null)
        setCouponError('')
        setActiveTab('requests')
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال الطلب', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel request handler
  const handleCancelRequest = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return
    try {
      const res = await fetch(`/api/beneficiary/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        toast({ title: 'تم إلغاء الطلب' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إلغاء الطلب', variant: 'destructive' })
    }
  }

  // Reorder handler (opens request dialog with same service)
  const handleReorder = (req: any) => {
    const service = req.service || { id: req.serviceId, name: 'خدمة', price: 0 }
    setSelectedService(service)
    setRequestForm({ paymentMethod: req.paymentMethod || '', notes: '', address: req.address || '', couponCode: '' })
    setValidCoupon(null)
    setCouponError('')
    setRequestDialog(true)
  }

  // Coupon validation handler
  const handleValidateCoupon = async () => {
    if (!requestForm.couponCode.trim()) return
    setCouponValidating(true)
    setCouponError('')
    setValidCoupon(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: requestForm.couponCode.trim() }),
      })
      const data = await res.json()
      if (data.valid && data.coupon) {
        setValidCoupon(data.coupon)
        setCouponError('')
        toast({ title: 'تم تطبيق الكوبون', description: `خصم ${data.coupon.discountPercent}%` })
      } else {
        setValidCoupon(null)
        setCouponError(data.error || 'كوبون غير صالح')
      }
    } catch {
      setCouponError('فشل التحقق من الكوبون')
    } finally {
      setCouponValidating(false)
    }
  }

  // Emergency request handler
  const handleEmergencyRequest = async () => {
    if (!emergencyForm.serviceType.trim() || !emergencyForm.address.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال نوع الخدمة والعنوان', variant: 'destructive' })
      return
    }
    setEmergencySubmitting(true)
    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          serviceType: emergencyForm.serviceType,
          address: emergencyForm.address,
          notes: emergencyForm.notes || undefined,
        }),
      })
      if (res.ok) {
        toast({ title: 'تم إرسال طلب الطوارئ', description: 'سيتم التواصل معك في أقرب وقت' })
        setEmergencyDialog(false)
        setEmergencyForm({ serviceType: '', address: '', notes: '' })
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال الطلب', variant: 'destructive' })
    } finally {
      setEmergencySubmitting(false)
    }
  }

  // Redeem loyalty points handler
  const handleRedeemPoints = async () => {
    const points = parseInt(redeemAmount)
    if (!points || points < 100) {
      toast({ title: 'خطأ', description: 'الحد الأدنى للاستبدال 100 نقطة', variant: 'destructive' })
      return
    }
    setRedeeming(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          points,
          action: 'redeem',
        }),
      })
      if (res.ok) {
        toast({ title: 'تم استبدال النقاط', description: `تم استبدال ${points} نقطة بنجاح` })
        setRedeemAmount('')
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setRedeeming(false)
    }
  }

  // Copy referral code
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedReferral(true)
    setTimeout(() => setCopiedReferral(false), 2000)
    toast({ title: 'تم نسخ الكود' })
  }

  // Apply referral code
  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return
    setReferralApplying(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralInput.trim(), beneficiaryId: beneficiaryUser?.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'تم تطبيق كود الإحالة!', description: 'حصلت على 25 نقطة مكافأة' })
        setReferralInput('')
        fetchData()
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setReferralApplying(false)
    }
  }

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم', variant: 'destructive' })
      return
    }
    setProfileSaving(true)
    try {
      const res = await fetch('/api/beneficiary/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          name: profileForm.name,
          phone: profileForm.phone,
          location: profileForm.location,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update store user
        const { setUser } = useAppStore.getState()
        setUser({ ...beneficiaryUser!, name: data.name, phone: data.phone, location: data.location }, 'beneficiary')
        toast({ title: 'تم حفظ التعديلات', description: 'تم تحديث بياناتك الشخصية بنجاح' })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ التعديلات', variant: 'destructive' })
    } finally {
      setProfileSaving(false)
    }
  }

  // Mark notification as read
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    if (tab === 'profile') setProfileLoaded(false)
  }

  // Computed values
  const categories = [...new Set(services.map(s => s.category))]
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const completedRequests = requests.filter(r => r.status === 'completed').length
  const unreadNotifications = notifications.filter(n => !n.read).length

  // Filtered services
  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category === selectedCategory)

  // Filtered requests
  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  // Payment history from completed requests
  const paymentHistory = requests.filter(r => r.status === 'completed')

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'services', label: 'الخدمات', icon: ShoppingBag },
    { key: 'requests', label: 'طلباتي', icon: ClipboardList, badge: pendingRequests },
    { key: 'payments', label: 'المدفوعات', icon: CreditCard },
    { key: 'profile', label: 'الملف الشخصي', icon: User },
    { key: 'notifications', label: 'الإشعارات', icon: Bell, badge: unreadNotifications },
    { key: 'loyalty', label: 'النقاط', icon: Award },
    { key: 'referral', label: 'الإحالة', icon: Share2 },
    { key: 'help', label: 'المساعدة', icon: HelpCircle },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 to-rose-50 dark:to-gray-900/30 dark:from-gray-950 dark:to-gray-900 flex" dir="rtl">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="w-72 bg-white dark:bg-gray-900 border-l dark:border-gray-800 shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        {/* Logo Header */}
        <div className="p-6 border-b bg-gradient-to-l from-rose-500 to-pink-600">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="عافيتك" width={44} height={44} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-rose-100 text-xs mt-0.5">حساب المستفيد</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-l from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-100 dark:border-rose-900'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-rose-600' : ''}`} />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-rose-500 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">{beneficiaryUser?.name?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{beneficiaryUser?.name}</p>
              <p className="text-muted-foreground text-xs">مستفيد</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl mb-1"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun className="w-4 h-4 ml-2 text-amber-500" /> : <Moon className="w-4 h-4 ml-2" />}
            {darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* ===== Mobile Menu Overlay ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ===== Mobile Sidebar ===== */}
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Mobile Header */}
        <div className="p-4 border-b bg-gradient-to-l from-rose-500 to-pink-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" />
            <h2 className="text-lg font-bold text-white">عافيتك</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-l from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-rose-600' : ''}`} />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-rose-500 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Mobile User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50/80 dark:bg-gray-800/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{beneficiaryUser?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{beneficiaryUser?.name}</p>
              <p className="text-muted-foreground text-xs">مستفيد</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start mb-1" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="w-4 h-4 ml-2 text-amber-500" /> : <Moon className="w-4 h-4 ml-2" />}
            {darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* ===== Mobile Top Header ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold text-rose-700 dark:text-rose-300">عافيتك</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => handleTabChange('notifications')}>
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-rose-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
            <LogOut className="w-4 h-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <main className="flex-1 lg:mr-72 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-10 h-10 animate-spin text-rose-600 mb-4" />
                <p className="text-muted-foreground text-sm">جارٍ تحميل البيانات...</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {/* ===== SERVICES TAB ===== */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {[
                        { icon: ShoppingBag, value: services.length, label: 'خدمة متاحة', gradient: 'from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30', iconColor: 'text-rose-600', valueColor: 'text-rose-700' },
                        { icon: ClipboardList, value: requests.length, label: 'إجمالي الطلبات', gradient: 'from-violet-50 dark:from-violet-950/30 to-purple-50 dark:to-purple-950/30', iconColor: 'text-violet-600', valueColor: 'text-violet-700' },
                        { icon: Bell, value: pendingRequests, label: 'قيد الانتظار', gradient: 'from-amber-50 dark:from-amber-950/30 to-orange-50 dark:to-orange-950/30', iconColor: 'text-amber-600', valueColor: 'text-amber-700' },
                        { icon: Heart, value: completedRequests, label: 'مكتملة', gradient: 'from-emerald-50 dark:from-emerald-950/30 to-teal-50 dark:to-teal-950/30', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700 dark:text-emerald-300' },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <Card className={`border-0 shadow-sm bg-gradient-to-br ${stat.gradient}`}>
                            <CardContent className="p-4 text-center">
                              <stat.icon className={`w-6 h-6 ${stat.iconColor} mx-auto mb-1.5`} />
                              <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value.toLocaleString('ar-YE')}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold">الخدمات المتاحة</h1>
                        <p className="text-muted-foreground text-sm mt-1">اختر الخدمة التي تناسبك واطلبها بسهولة</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث
                      </Button>
                    </div>

                    {/* Category Filter Pills */}
                    {categories.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            selectedCategory === 'all'
                              ? 'bg-gradient-to-l from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          الكل
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              selectedCategory === cat
                                ? 'bg-gradient-to-l from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Services Grid */}
                    {filteredServices.length > 0 ? (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredServices.map(service => (
                          <motion.div key={service.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-white dark:bg-card">
                              <CardContent className="p-5 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="font-semibold text-lg leading-tight">{service.name}</h3>
                                  <Badge variant="outline" className="text-xs shrink-0 mr-2 border-rose-200 dark:border-rose-800 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">
                                    {service.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{service.description}</p>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                  <span className="text-lg font-bold text-emerald-600">{formatPrice(service.price)}</span>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-md hover:shadow-rose-200 transition-all duration-200"
                                    onClick={() => {
                                      setSelectedService(service)
                                      setRequestForm({ paymentMethod: '', notes: '', address: '' })
                                      setRequestDialog(true)
                                    }}
                                  >
                                    <Plus className="w-4 h-4 ml-1" />
                                    طلب
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShoppingBag className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد خدمات متاحة حالياً</p>
                        <p className="text-muted-foreground text-sm mt-1">يرجى التحقق لاحقاً</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== REQUESTS TAB ===== */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold">طلباتي</h1>
                        <p className="text-muted-foreground text-sm mt-1">متابعة حالة طلبات الخدمات</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث
                      </Button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {statusFilters.map(filter => (
                        <button
                          key={filter.key}
                          onClick={() => setStatusFilter(filter.key)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            statusFilter === filter.key
                              ? 'bg-gradient-to-l from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                        >
                          {filter.label}
                          {filter.key === 'all' && requests.length > 0 && (
                            <span className="mr-1.5 text-xs opacity-80">({requests.length})</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Requests List */}
                    {requests.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لم تقم بأي طلبات بعد</p>
                        <p className="text-muted-foreground text-sm mt-1 mb-6">تصفح الخدمات المتاحة واطلب ما يناسبك</p>
                        <Button
                          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-md hover:shadow-rose-200"
                          onClick={() => setActiveTab('services')}
                        >
                          <ShoppingBag className="w-4 h-4 ml-2" />
                          تصفح الخدمات
                        </Button>
                      </motion.div>
                    ) : filteredRequests.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                      >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Filter className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-muted-foreground font-medium">لا توجد طلبات بهذه الحالة</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="grid gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredRequests.map(req => (
                          <motion.div key={req.id} variants={itemVariants}>
                            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                  <div className="flex-1 min-w-0">
                                    {/* Service Name & Status */}
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30 flex items-center justify-center shrink-0">
                                        <ClipboardList className="w-5 h-5 text-rose-600" />
                                      </div>
                                      <div className="min-w-0">
                                        <h3 className="font-semibold text-base truncate">{req.service?.name || 'خدمة محذوفة'}</h3>
                                        <Badge className={`${getStatusColor(req.status)} text-xs mt-1`}>
                                          {getStatusLabel(req.status)}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      {req.service?.price !== undefined && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                                          <span className="font-medium text-foreground ml-1">السعر:</span>
                                          <span className="text-emerald-600 font-semibold">{formatPrice(req.service.price)}</span>
                                        </div>
                                      )}
                                      {req.paymentMethod && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <CreditCard className="w-3.5 h-3.5" />
                                          <span className="font-medium text-foreground ml-1">طريقة الدفع:</span>
                                          {req.paymentMethod}
                                        </div>
                                      )}
                                      {req.address && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                          <span className="font-medium text-foreground ml-1">العنوان:</span>
                                          {req.address}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="font-medium text-foreground ml-1">التاريخ:</span>
                                        {new Date(req.createdAt).toLocaleDateString('ar-YE', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    {req.notes && (
                                      <div className="mt-3 bg-blue-50/50 rounded-lg p-3 text-sm">
                                        <span className="font-medium text-blue-800">ملاحظاتك: </span>
                                        <span className="text-blue-700">{req.notes}</span>
                                      </div>
                                    )}

                                    {/* Admin Notes */}
                                    {req.adminNotes && (
                                      <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-sm">
                                        <span className="font-medium text-amber-800 dark:text-amber-200">ملاحظات الإدارة: </span>
                                        <span className="text-amber-700 dark:text-amber-300">{req.adminNotes}</span>
                                      </div>
                                    )}

                                    {/* Assigned Nurse */}
                                    {req.assignment?.nurse && (
                                      <div className="mt-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 text-sm flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                          <User className="w-3.5 h-3.5 text-violet-600" />
                                        </div>
                                        <div>
                                          <span className="font-medium text-violet-800 dark:text-violet-200">الممرض/ة المعيّن/ة: </span>
                                          <span className="text-violet-700 dark:text-violet-300">
                                            {req.assignment.nurse.firstName} {req.assignment.nurse.lastName}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col gap-2 shrink-0">
                                    {req.status === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 border-red-200"
                                        onClick={() => handleCancelRequest(req.id)}
                                      >
                                        <XCircle className="w-4 h-4 ml-1" />
                                        إلغاء
                                      </Button>
                                    )}
                                    {req.status === 'completed' && (
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-md hover:shadow-rose-200"
                                        onClick={() => handleReorder(req)}
                                      >
                                        <RefreshCw className="w-4 h-4 ml-1" />
                                        إعادة الطلب
                                      </Button>
                                    )}
                                    {(req.status === 'approved' || req.status === 'in_progress') && req.assignment?.nurse && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-violet-600 hover:text-violet-700 dark:hover:text-violet-300 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 border-violet-200 dark:border-violet-800"
                                        onClick={() => setActiveChatRequestId(req.id)}
                                      >
                                        <MessageCircle className="w-4 h-4 ml-1" />
                                        محادثة
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== PAYMENTS TAB ===== */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">المدفوعات</h1>
                      <p className="text-muted-foreground text-sm mt-1">طرق الدفع المتاحة وسجل المدفوعات</p>
                    </div>

                    {/* Payment Methods Section */}
                    <div>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-rose-600" />
                        طرق الدفع المتاحة
                      </h2>
                      {payments.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-card rounded-xl shadow-sm">
                          <CreditCard className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">لا توجد طرق دفع متاحة حالياً</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {payments.map(payment => (
                            <motion.div key={payment.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card">
                                <CardContent className="p-5">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                      <CreditCard className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="font-semibold">{payment.name}</h3>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
                                    <p className="text-muted-foreground leading-relaxed">{payment.accountInfo}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Payment History / Statements */}
                    <div>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                        سجل المدفوعات
                      </h2>
                      {paymentHistory.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-card rounded-xl shadow-sm">
                          <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">لا توجد مدفوعات مكتملة بعد</p>
                          <p className="text-muted-foreground text-xs mt-1">ستظهر هنا المدفوعات للخدمات المكتملة</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {paymentHistory.map(req => (
                            <Card key={req.id} className="border-0 shadow-sm bg-white dark:bg-card dark:bg-card">
                              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{req.service?.name || 'خدمة'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {req.paymentMethod || 'غير محددة'} • {new Date(req.createdAt).toLocaleDateString('ar-YE')}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-emerald-600 font-bold">{formatPrice(req.service?.price || 0)}</span>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== PROFILE TAB ===== */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">الملف الشخصي</h1>
                      <p className="text-muted-foreground text-sm mt-1">معلومات حسابك الشخصية</p>
                    </div>

                    <Card className="border-0 shadow-sm bg-white dark:bg-card dark:bg-card">
                      <CardContent className="p-6">
                        {/* Avatar & Name Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200">
                            <span className="text-2xl font-bold text-white">{beneficiaryUser?.name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{beneficiaryUser?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-rose-100 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">مستفيد</Badge>
                            </div>
                          </div>
                        </div>

                        <Separator className="mb-6" />

                        {/* Edit Form */}
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="profile-name" className="text-sm font-medium flex items-center gap-2">
                              <User className="w-4 h-4 text-rose-500" />
                              الاسم الكامل
                            </Label>
                            <Input
                              id="profile-name"
                              value={profileForm.name}
                              onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="أدخل اسمك الكامل"
                              className="rounded-xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="profile-phone" className="text-sm font-medium flex items-center gap-2">
                              <Phone className="w-4 h-4 text-rose-500" />
                              رقم الهاتف
                            </Label>
                            <Input
                              id="profile-phone"
                              value={profileForm.phone}
                              onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="رقم الهاتف"
                              className="rounded-xl"
                              dir="ltr"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="profile-location" className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-rose-500" />
                              الموقع
                            </Label>
                            <Input
                              id="profile-location"
                              value={profileForm.location}
                              onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))}
                              placeholder="المدينة / المنطقة"
                              className="rounded-xl"
                            />
                          </div>

                          {/* Registration Date (Read-only) */}
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>تاريخ التسجيل:</span>
                              <span className="font-medium text-foreground">
                                {(user as any)?.createdAt
                                  ? new Date((user as any).createdAt).toLocaleDateString('ar-YE', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : 'غير متوفر'}
                              </span>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-md hover:shadow-rose-200 rounded-xl h-11"
                            onClick={handleSaveProfile}
                            disabled={profileSaving}
                          >
                            {profileSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                جارٍ الحفظ...
                              </>
                            ) : (
                              'حفظ التعديلات'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== NOTIFICATIONS TAB ===== */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold">الإشعارات</h1>
                        <p className="text-muted-foreground text-sm mt-1">تحديثات الطلبات والرسائل</p>
                      </div>
                      {unreadNotifications > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAllNotificationsRead}
                          className="gap-1.5"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          تحديد الكل كمقروء
                        </Button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-10 h-10 text-rose-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات</p>
                        <p className="text-muted-foreground text-sm mt-1">ستظهر هنا تحديثات طلباتك ورسائل الإدارة</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="grid gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {notifications.map(notif => (
                          <motion.div key={notif.id} variants={itemVariants}>
                            <Card
                              className={`border-0 shadow-sm transition-all duration-200 cursor-pointer ${
                                notif.read ? 'bg-white dark:bg-card' : 'bg-rose-50 dark:bg-rose-950/30/40 border-r-4 border-r-rose-400'
                              }`}
                              onClick={() => markNotificationRead(notif.id)}
                            >
                              <CardContent className="p-4 flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  notif.type === 'status_change' ? 'bg-amber-100' :
                                  notif.type === 'assignment' ? 'bg-violet-100' :
                                  notif.type === 'admin_message' ? 'bg-blue-100 dark:bg-blue-950/40' :
                                  'bg-gray-100'
                                }`}>
                                  {notif.type === 'status_change' && <RefreshCw className="w-4 h-4 text-amber-600" />}
                                  {notif.type === 'assignment' && <User className="w-4 h-4 text-violet-600" />}
                                  {notif.type === 'admin_message' && <ClipboardList className="w-4 h-4 text-blue-600" />}
                                  {notif.type === 'general' && <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`text-sm font-semibold ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                      {notif.title}
                                    </h4>
                                    {!notif.read && (
                                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-muted-foreground mt-2">
                                    {notif.createdAt
                                      ? new Date(notif.createdAt).toLocaleDateString('ar-YE', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : ''}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== LOYALTY TAB ===== */}
                {activeTab === 'loyalty' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold">برنامج النقاط</h1>
                        <p className="text-muted-foreground text-sm mt-1">اجمع نقاط واحصل على خصومات</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث
                      </Button>
                    </div>

                    {/* Points Balance Card */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 dark:from-amber-950/30 to-yellow-50 dark:to-yellow-950/30">
                      <CardContent className="p-6 text-center">
                        <Award className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-amber-700 dark:text-amber-300">{loyaltyBalance.toLocaleString('ar-YE')}</p>
                        <p className="text-sm text-amber-600 mt-1">نقطة متاحة</p>
                        <Separator className="my-4" />
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 text-sm">
                          <p className="text-amber-800 dark:text-amber-200 font-medium">💎 كل 100 نقطة = خصم على خدمة مجانية</p>
                          <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">تحصل على 10 نقاط لكل طلب خدمة</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Redeem Section */}
                    {loyaltyBalance >= 100 && (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            استبدال النقاط
                          </h3>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min="100"
                              max={loyaltyBalance}
                              value={redeemAmount}
                              onChange={e => setRedeemAmount(e.target.value)}
                              placeholder="عدد النقاط"
                              className="flex-1"
                            />
                            <Button
                              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white"
                              onClick={handleRedeemPoints}
                              disabled={redeeming}
                            >
                              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'استبدال'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">الحد الأدنى: 100 نقطة • المتاح: {loyaltyBalance.toLocaleString('ar-YE')} نقطة</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Points History */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">سجل النقاط</h3>
                        {loyaltyHistory.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loyaltyHistory.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between p-p-3 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'earn' ? 'bg-emerald-100' : 'bg-red-100 dark:bg-red-950/40'}`}>
                                    {item.type === 'earn' ? <Plus className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{item.reason}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.createdAt ? new Date(typeof item.createdAt === 'object' && 'seconds' in item.createdAt ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleDateString('ar-YE') : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className={`font-bold ${item.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {item.points > 0 ? '+' : ''}{item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">لا يوجد سجل نقاط بعد</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== REFERRAL TAB ===== */}
                {activeTab === 'referral' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">برنامج الإحالة</h1>
                      <p className="text-muted-foreground text-sm mt-1">ادعُ أصدقاءك واحصل على نقاط مكافأة</p>
                    </div>

                    {/* Referral Code Card */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 dark:from-violet-950/30 to-purple-50 dark:to-purple-950/30">
                      <CardContent className="p-6 text-center">
                        <Share2 className="w-12 h-12 text-violet-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg mb-2">كود الإحالة الخاص بك</h3>
                        {referralCode ? (
                          <>
                            <div className="bg-white dark:bg-card rounded-xl p-4 inline-block border-2 border-dashed border-violet-300 dark:border-violet-800 mb-4">
                              <p className="font-mono text-2xl font-bold text-violet-700 dark:text-violet-300 tracking-wider">{referralCode}</p>
                            </div>
                            <div className="flex justify-center gap-3">
                              <Button
                                variant="outline"
                                className="gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                                onClick={handleCopyReferral}
                              >
                                {copiedReferral ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedReferral ? 'تم النسخ!' : 'نسخ الكود'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-center mt-2">
                            <Button
                              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                              onClick={fetchData}
                            >
                              إنشاء كود إحالة
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Referral Stats */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">إحصائيات الإحالة</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{referralUses}</p>
                            <p className="text-xs text-muted-foreground">أشخاص استخدموا كودك</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{referralUses * 50}</p>
                            <p className="text-xs text-muted-foreground">نقاط مكافأة مكتسبة</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-sm">
                          <p className="text-amber-800 dark:text-amber-200 font-medium">🎁 شارك كودك مع أصدقائك!</p>
                          <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">تحصل على 50 نقطة لكل شخص يستخدم كودك، ويحصل هو على 25 نقطة مكافأة</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Apply Referral Code */}
                    {!referralCode && (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-4">لديك كود إحالة؟</h3>
                          <div className="flex items-center gap-3">
                            <Input
                              value={referralInput}
                              onChange={e => setReferralInput(e.target.value.toUpperCase())}
                              placeholder="أدخل كود الإحالة"
                              className="flex-1 font-mono"
                            />
                            <Button
                              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                              onClick={handleApplyReferral}
                              disabled={referralApplying}
                            >
                              {referralApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ===== HELP TAB ===== */}
                {activeTab === 'help' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">المساعدة والدعم</h1>
                      <p className="text-muted-foreground text-sm mt-1">الأسئلة الشائعة ومعلومات التواصل</p>
                    </div>

                    {/* FAQ Section */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-rose-600" />
                        الأسئلة الشائعة
                      </h2>
                      <div className="grid gap-3">
                        {faqItems.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <Card className="border-0 shadow-sm bg-white dark:bg-card hover:shadow-md transition-shadow duration-200">
                              <CardContent className="p-5">
                                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <span className="text-rose-600 text-xs font-bold">{(i + 1).toLocaleString('ar-YE')}</span>
                                  </div>
                                  {item.q}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mr-8">{item.a}</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-rose-600" />
                        معلومات التواصل
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="border-0 shadow-sm bg-white dark:bg-card dark:bg-card">
                          <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                              <p className="font-semibold text-sm" dir="ltr">+967 777 000 000</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm bg-white dark:bg-card dark:bg-card">
                          <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                              <Home className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                              <p className="font-semibold text-sm" dir="ltr">support@afiyatak.com</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* App Info */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30">
                      <CardContent className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
                          <span className="font-bold text-rose-700 dark:text-rose-300">عافيتك</span>
                        </div>
                        <p className="text-sm text-muted-foreground">منصة التمريض المنزلي الأولى في اليمن</p>
                        <p className="text-xs text-muted-foreground mt-1">الإصدار 1.0.0</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ===== Request Service Dialog ===== */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" />
              طلب خدمة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedService && (
              <>
                {/* Service Summary */}
                <div className="bg-gradient-to-l from-rose-50 dark:from-rose-950/30 to-pink-50 dark:to-pink-950/30 rounded-xl p-4 border border-rose-100 dark:border-rose-900">
                  <h3 className="font-semibold text-base">{selectedService.name}</h3>
                  {selectedService.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{selectedService.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <p className={`text-lg font-bold ${validCoupon ? 'text-muted-foreground line-through' : 'text-emerald-600'}`}>
                      {formatPrice(selectedService.price)}
                    </p>
                    {validCoupon && (
                      <p className="text-lg font-bold text-emerald-600">
                        {formatPrice(Math.round(selectedService.price * (1 - validCoupon.discountPercent / 100)))}
                      </p>
                    )}
                  </div>
                  {validCoupon && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm">
                      <Tag className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-600 font-medium">خصم {validCoupon.discountPercent}% مطبّق</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    كود الخصم
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={requestForm.couponCode}
                      onChange={e => {
                        setRequestForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))
                        if (validCoupon) { setValidCoupon(null); setCouponError('') }
                      }}
                      placeholder="أدخل كود الخصم"
                      className="flex-1 font-mono rounded-xl"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xl"
                      onClick={handleValidateCoupon}
                      disabled={couponValidating || !requestForm.couponCode.trim()}
                    >
                      {couponValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحقق'}
                    </Button>
                  </div>
                  {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                  {validCoupon && <p className="text-xs text-emerald-600">✓ كوبون صالح - خصم {validCoupon.discountPercent}%</p>}
                </div>

                {/* Address Input */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    العنوان <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={requestForm.address}
                    onChange={e => setRequestForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="عنوانك بالتفصيل (المدينة، الحي، الشارع)"
                    className="rounded-xl"
                  />
                </div>

                {/* Payment Method Select */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                    طريقة الدفع
                  </Label>
                  <Select
                    value={requestForm.paymentMethod}
                    onValueChange={v => setRequestForm(f => ({ ...f, paymentMethod: v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقدي عند الاستلام">💵 نقدي عند الاستلام</SelectItem>
                      {paymentMethods.map(pm => (
                        <SelectItem key={pm.id} value={pm.name}>
                          💳 {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes Textarea */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-rose-500" />
                    ملاحظات
                  </Label>
                  <Textarea
                    value={requestForm.notes}
                    onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="أي ملاحظات إضافية أو تفاصيل خاصة بالخدمة..."
                    className="rounded-xl min-h-[80px] resize-none"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRequestDialog(false)}
              className="rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-md hover:shadow-rose-200 rounded-xl"
              onClick={handleRequestService}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإرسال...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-1" />
                  إرسال الطلب
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Emergency Request Dialog ===== */}
      <Dialog open={emergencyDialog} onOpenChange={setEmergencyDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              طلب طوارئ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-sm border border-red-100">
              <p className="text-red-700 font-medium">سيتم إرسال طلبك كحالة طوارئ وسيتم التواصل معك في أقرب وقت ممكن.</p>
            </div>
            <div className="space-y-2">
              <Label>نوع الخدمة <span className="text-red-500">*</span></Label>
              <Select
                value={emergencyForm.serviceType}
                onValueChange={v => setEmergencyForm(f => ({ ...f, serviceType: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر نوع الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="إسعافات أولية">إسعافات أولية</SelectItem>
                  <SelectItem value="تمريض طوارئ">تمريض طوارئ</SelectItem>
                  <SelectItem value="قياسات حيوية">قياسات حيوية</SelectItem>
                  <SelectItem value="رعاية عاجلة">رعاية عاجلة</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العنوان <span className="text-red-500">*</span></Label>
              <Input
                value={emergencyForm.address}
                onChange={e => setEmergencyForm(f => ({ ...f, address: e.target.value }))}
                placeholder="عنوانك بالتفصيل"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={emergencyForm.notes}
                onChange={e => setEmergencyForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="صف الحالة باختصار..."
                className="rounded-xl min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEmergencyDialog(false)} className="rounded-xl">إلغاء</Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md rounded-xl"
              onClick={handleEmergencyRequest}
              disabled={emergencySubmitting}
            >
              {emergencySubmitting ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الإرسال...</>
              ) : (
                <><AlertTriangle className="w-4 h-4 ml-1" />إرسال طلب الطوارئ</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Emergency Button ===== */}
      <motion.button
        onClick={() => setEmergencyDialog(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="طلب طوارئ"
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-bold text-sm">طلب طوارئ</span>
      </motion.button>

      {/* ===== Chat System ===== */}
      {activeChatRequestId && beneficiaryUser && (
        <ChatSystem
          requestId={activeChatRequestId}
          userId={beneficiaryUser.id}
          userName={beneficiaryUser.name}
          userType="beneficiary"
        />
      )}
    </div>
  )
}
