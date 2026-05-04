'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ClipboardList, CreditCard, LogOut, Loader2, Plus, XCircle,
  ShoppingBag, User, Menu, X, Bell, MapPin, Phone, Home, HelpCircle,
  Filter, RefreshCw, Calendar, Tag, AlertTriangle,
  Copy, Check, Award, Zap, Share2, MessageCircle, Star, Send,
  Siren, ChevronDown, ChevronUp, Shield, Gift, TrendingUp, Sparkles, Navigation
} from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { openInMaps, getGPSLocation, searchLocation, extractCoordinates, getDisplayLocation, getMapEmbedUrl, getDirectionsUrl } from '@/lib/location-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import ChatSystem from '@/components/ChatSystem'
import Image from 'next/image'

// ===== Date Formatting Helpers =====
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

interface AdminSettings {
  phone?: string
  email?: string
  emergencyPhone?: string
  referralBonusPoints?: number
  referralBonusPointsReceiver?: number
  referralEnabled?: boolean
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
  {
    q: 'ما هو برنامج النقاط؟',
    a: 'تحصل على نقاط عند كل طلب خدمة وعند استخدام كود إحالة. يمكنك استبدال النقاط بخصومات على الخدمات المستقبلية. الحد الأدنى للاستبدال 100 نقطة.'
  },
]

// Emergency service types
const emergencyServiceTypes = [
  'تمريض منزلي عاجل',
  'إسعافات أولية',
  'حقن وريدي',
  'قياس الضغط والسكر',
  'عناية بالجروح',
  'أخرى',
]

// Status right border color mapping (RTL)
const statusBorderColor: Record<string, string> = {
  pending: 'border-r-4 border-r-amber-400',
  approved: 'border-r-4 border-r-emerald-400',
  in_progress: 'border-r-4 border-r-blue-400',
  completed: 'border-r-4 border-r-violet-400',
  cancelled: 'border-r-4 border-r-gray-400',
  assigned: 'border-r-4 border-r-purple-400',
  rejected: 'border-r-4 border-r-red-400',
}

// Status badge gradient mapping
const statusGradientBadge: Record<string, string> = {
  pending: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  approved: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
  in_progress: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  completed: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
  cancelled: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
  assigned: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white',
  rejected: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
}

// Notification border color
const notifBorderColor: Record<string, string> = {
  status_change: 'border-r-4 border-r-amber-400',
  assignment: 'border-r-4 border-r-violet-400',
  admin_message: 'border-r-4 border-r-blue-400',
  general: 'border-r-4 border-r-gray-300',
}

// Notification type icon color
const notifIconBg: Record<string, string> = {
  status_change: 'bg-amber-100 text-amber-600',
  assignment: 'bg-violet-100 text-violet-600',
  admin_message: 'bg-blue-100 text-blue-600',
  general: 'bg-gray-100 text-gray-600',
}

export default function BeneficiaryDashboard() {
  const { user, setView, logout } = useAppStore()
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
  const [activeChatNurseName, setActiveChatNurseName] = useState<string>('')

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Profile edit (only location)
  const [profileLocation, setProfileLocation] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ name: string; lat: string; lng: string; display: string }>>([])
  const [emergencyGpsLoading, setEmergencyGpsLoading] = useState(false)
  const [emergencyLocationSearchResults, setEmergencyLocationSearchResults] = useState<Array<{ name: string; lat: string; lng: string; display: string }>>([])
  const [requestGpsLoading, setRequestGpsLoading] = useState(false)
  const [requestLocationSearchResults, setRequestLocationSearchResults] = useState<Array<{ name: string; lat: string; lng: string; display: string }>>([])

  // Rating state
  const [ratingDialog, setRatingDialog] = useState(false)
  const [ratingRequestId, setRatingRequestId] = useState<string>('')
  const [ratingNurseId, setRatingNurseId] = useState<string>('')
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratedRequests, setRatedRequests] = useState<Set<string>>(new Set())

  // Admin settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({})

  const beneficiaryUser = user as { id: string; name: string; phone: string; location: string } | null

  // Fetch admin settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.ok ? res.json() : {})
      .then(data => setAdminSettings(data))
      .catch(() => {})
  }, [])

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'services') {
        const res = await fetch('/api/beneficiary/services')
        if (res.ok) setServices(await res.json())
      } else if (activeTab === 'requests') {
        const [reqRes, emRes] = await Promise.all([
          fetch(`/api/beneficiary/requests?beneficiaryId=${beneficiaryUser?.id}`),
          fetch(`/api/beneficiary/emergency?beneficiaryId=${beneficiaryUser?.id}`)
        ])
        const normalRequests = reqRes.ok ? await reqRes.json() : []
        const emergencyRequests = emRes.ok ? await emRes.json() : []
        // Merge and sort by createdAt, marking emergency requests
        const allRequests = [
          ...normalRequests,
          ...emergencyRequests.map((e: any) => ({ ...e, isEmergency: true }))
        ].sort((a: any, b: any) => {
          const getTime = (t: any) => {
            if (!t) return 0
            if (typeof t === 'object' && 'seconds' in t) return t.seconds * 1000
            return new Date(t).getTime() || 0
          }
          return getTime(b.createdAt) - getTime(a.createdAt)
        })
        setRequests(allRequests)
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
      } else if (activeTab === 'profile') {
        const res = await fetch(`/api/beneficiary/profile?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) {
          const data = await res.json()
          setProfileData(data)
          setProfileLocation(data.location || beneficiaryUser?.location || '')
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, beneficiaryUser?.id, beneficiaryUser?.location, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      setProfileLocation(beneficiaryUser.location || '')
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

  // Reorder handler
  const handleReorder = (req: any) => {
    const service = req.service || { id: req.serviceId, name: 'خدمة', price: 0 }
    setSelectedService(service)
    setRequestForm({ paymentMethod: req.paymentMethod || '', notes: '', address: req.address || beneficiaryUser?.location || '', couponCode: '' })
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
        const bonusPoints = adminSettings.referralBonusPointsReceiver || 25
        toast({ title: 'تم تطبيق كود الإحالة!', description: `حصلت على ${bonusPoints} نقطة مكافأة` })
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

  // Save profile handler (location only)
  const handleSaveProfile = async () => {
    if (!profileLocation.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الموقع', variant: 'destructive' })
      return
    }
    setProfileSaving(true)
    try {
      const res = await fetch('/api/beneficiary/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          location: profileLocation,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const { setUser } = useAppStore.getState()
        setUser({ ...beneficiaryUser!, location: data.location || profileLocation }, 'beneficiary')
        toast({ title: 'تم تحديث الموقع', description: 'تم تحديث موقعك بنجاح' })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ التعديلات', variant: 'destructive' })
    } finally {
      setProfileSaving(false)
    }
  }

  // Rating handler
  const handleSubmitRating = async () => {
    if (ratingValue < 1) {
      toast({ title: 'خطأ', description: 'يرجى اختيار التقييم', variant: 'destructive' })
      return
    }
    setRatingSubmitting(true)
    try {
      const res = await fetch('/api/beneficiary/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: ratingRequestId,
          nurseId: ratingNurseId,
          beneficiaryId: beneficiaryUser?.id,
          rating: ratingValue,
          comment: ratingComment || undefined,
        }),
      })
      if (res.ok) {
        toast({ title: 'شكراً لتقييمك!', description: 'تم إرسال تقييمك بنجاح' })
        setRatedRequests(prev => new Set(prev).add(ratingRequestId))
        setRatingDialog(false)
        setRatingValue(0)
        setRatingComment('')
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال التقييم', variant: 'destructive' })
    } finally {
      setRatingSubmitting(false)
    }
  }

  // Open rating dialog
  const openRatingDialog = (requestId: string, nurseId: string) => {
    setRatingRequestId(requestId)
    setRatingNurseId(nurseId)
    setRatingValue(0)
    setRatingComment('')
    setRatingDialog(true)
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

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category === selectedCategory)

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  const paymentHistory = requests.filter(r => r.status === 'completed')

  // Loyalty level calculation
  const loyaltyLevel = loyaltyBalance >= 1000 ? 'ذهبي' : loyaltyBalance >= 500 ? 'فضي' : 'برونزي'
  const loyaltyNextLevel = loyaltyBalance >= 1000 ? 'ذهبي' : loyaltyBalance >= 500 ? 'ذهبي' : 'فضي'
  const loyaltyNextThreshold = loyaltyBalance >= 1000 ? 1000 : loyaltyBalance >= 500 ? 1000 : 500
  const loyaltyPrevThreshold = loyaltyBalance >= 1000 ? 500 : loyaltyBalance >= 500 ? 500 : 0
  const loyaltyProgress = Math.min(((loyaltyBalance - loyaltyPrevThreshold) / (loyaltyNextThreshold - loyaltyPrevThreshold)) * 100, 100)
  const loyaltyLevelGradient = loyaltyBalance >= 1000
    ? 'from-yellow-400 via-amber-500 to-yellow-600'
    : loyaltyBalance >= 500
      ? 'from-gray-300 via-gray-400 to-gray-500'
      : 'from-amber-600 via-orange-700 to-amber-800'

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

  // Calculate discounted price
  const getDiscountedPrice = () => {
    if (!selectedService) return 0
    if (validCoupon) {
      return selectedService.price * (1 - validCoupon.discountPercent / 100)
    }
    return selectedService.price
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-fuchsia-50/10 flex relative overflow-hidden" dir="rtl">
      {/* ===== Floating Orbs Background ===== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-fuchsia-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* ===== Desktop Sidebar ===== */}
      <aside className="w-72 bg-white/70 backdrop-blur-xl border-l border-white/20 shadow-xl hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        {/* Logo Header */}
        <div className="p-6 bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-lg">
              <Image src="/logo.png" alt="عافيتك" width={44} height={44} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-violet-100 text-xs mt-0.5">حساب المستفيد</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-l from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 text-violet-700 shadow-md shadow-violet-500/10 border border-violet-200/50'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-violet-600' : ''}`} />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-sm shadow-violet-500/30">
                  {tab.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-gradient-to-l from-violet-50/50 to-fuchsia-50/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white font-bold text-sm">{beneficiaryUser?.name?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{beneficiaryUser?.name}</p>
              <p className="text-muted-foreground text-xs">مستفيد</p>
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
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white/90 backdrop-blur-xl z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" />
            <h2 className="text-lg font-bold text-white">عافيتك</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-l from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 text-violet-700 border border-violet-200/50'
                  : 'text-gray-600 hover:bg-white/60'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-violet-600' : ''}`} />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/25">
              <span className="text-white font-bold text-xs">{beneficiaryUser?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{beneficiaryUser?.name}</p>
              <p className="text-muted-foreground text-xs">مستفيد</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* ===== Mobile Top Header ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold bg-gradient-to-l from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">عافيتك</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => handleTabChange('notifications')}>
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
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
      <main className="flex-1 lg:mr-72 overflow-y-auto relative z-10">
        <div className="p-4 md:p-8 max-w-6xl mx-auto pt-20 lg:pt-8 pb-40 lg:pb-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
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
                        { icon: ShoppingBag, value: services.length, label: 'خدمة متاحة', gradient: 'from-violet-500 to-purple-500', glow: 'shadow-violet-500/25', iconBg: 'bg-violet-100' },
                        { icon: ClipboardList, value: requests.length, label: 'إجمالي الطلبات', gradient: 'from-fuchsia-500 to-pink-500', glow: 'shadow-fuchsia-500/25', iconBg: 'bg-fuchsia-100' },
                        { icon: Bell, value: pendingRequests, label: 'قيد الانتظار', gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/25', iconBg: 'bg-amber-100' },
                        { icon: Heart, value: completedRequests, label: 'مكتملة', gradient: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/25', iconBg: 'bg-emerald-100' },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4 text-center">
                              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mx-auto mb-2`}>
                                <stat.icon className="w-5 h-5 text-gray-700" />
                              </div>
                              <p className="text-2xl font-bold bg-gradient-to-l from-gray-800 to-gray-600 bg-clip-text text-transparent">{stat.value.toLocaleString('ar-YE')}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                              <div className={`mt-2 h-1 rounded-full bg-gradient-to-l ${stat.gradient} shadow-sm ${stat.glow}`} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">الخدمات المتاحة</h1>
                        <p className="text-muted-foreground text-sm mt-1">اختر الخدمة التي تناسبك واطلبها بسهولة</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث
                      </Button>
                    </div>

                    {/* Category Filter Pills */}
                    {categories.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                            selectedCategory === 'all'
                              ? 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                              : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                          }`}
                        >
                          الكل
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                              selectedCategory === cat
                                ? 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
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
                          <motion.div key={service.id} variants={itemVariants} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                              <CardContent className="p-5 flex flex-col flex-1 relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="font-semibold text-lg leading-tight">{service.name}</h3>
                                  <Badge className="text-xs shrink-0 mr-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 shadow-sm shadow-violet-500/20">
                                    {service.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{service.description}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <span className="text-xl font-black text-emerald-600">{formatPrice(service.price)}</span>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                                    onClick={() => {
                                      setSelectedService(service)
                                      setRequestForm({ paymentMethod: '', notes: '', address: beneficiaryUser?.location || '', couponCode: '' })
                                      setValidCoupon(null)
                                      setCouponError('')
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
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShoppingBag className="w-10 h-10 text-violet-300" />
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
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">طلباتي</h1>
                        <p className="text-muted-foreground text-sm mt-1">تتبع حالة طلباتك والحصول على التحديثات</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث
                      </Button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {statusFilters.map(f => (
                        <button
                          key={f.key}
                          onClick={() => setStatusFilter(f.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            statusFilter === f.key
                              ? 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                              : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:border-violet-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Requests List */}
                    {filteredRequests.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {filteredRequests.map((req, i) => {
                          const nurseAssigned = req.assignment?.nurse
                          const nurseId = req.assignment?.nurseId || req.assignment?.nurse?.id
                          const isCompleted = req.status === 'completed'
                          const canRate = isCompleted && nurseId && !ratedRequests.has(req.id)

                          return (
                            <motion.div key={req.id} variants={itemVariants}>
                              <Card className={`border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${req.isEmergency ? 'ring-2 ring-red-400' : ''} ${statusBorderColor[req.status] || ''}`}>
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-base truncate">{req.service?.name || req.serviceType || 'خدمة'}</h3>
                                        {req.isEmergency && (
                                          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0 shrink-0">
                                            <AlertTriangle className="w-3 h-3 ml-0.5" />طوارئ
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatDateTime(req.createdAt)}
                                      </p>
                                    </div>
                                    <Badge className={`text-xs shrink-0 ${req.isEmergency ? (req.status === 'pending' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-0' : statusGradientBadge[req.status] || 'bg-gray-200 text-gray-700') : statusGradientBadge[req.status] || 'bg-gray-200 text-gray-700'} border-0`}>
                                      {req.isEmergency ? (req.status === 'pending' ? 'بانتظار الطوارئ' : req.status === 'in_progress' ? 'قيد المعالجة' : req.status === 'completed' ? 'تم المعالجة' : getStatusLabel(req.status)) : getStatusLabel(req.status)}
                                    </Badge>
                                  </div>

                                  {req.address && (
                                    <button onClick={() => openInMaps(req.address)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors mb-2">
                                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{getDisplayLocation(req.address)}</span>
                                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">خريطة</span>
                                    </button>
                                  )}

                                  {req.paymentMethod && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                                      <span>{req.paymentMethod}</span>
                                    </div>
                                  )}

                                  {nurseAssigned && (
                                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-l from-violet-50/50 to-fuchsia-50/50 border border-violet-100/50">
                                      <p className="text-xs font-medium text-violet-600 mb-1">الممرض/ة المعين/ة</p>
                                      <p className="text-sm font-semibold">{nurseAssigned.firstName} {nurseAssigned.lastName}</p>
                                    </div>
                                  )}

                                  {req.notes && (
                                    <div className="mt-2 text-sm text-muted-foreground">
                                      <span className="font-medium">ملاحظات:</span> {req.notes}
                                    </div>
                                  )}

                                  {req.price !== undefined && (
                                    <div className="mt-2 text-sm font-semibold text-emerald-600">
                                      {formatPrice(req.price || req.service?.price || 0)}
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                                    {req.status === 'pending' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl text-xs"
                                        onClick={() => handleCancelRequest(req.id)}
                                      >
                                        <XCircle className="w-3.5 h-3.5 ml-1" />
                                        إلغاء
                                      </Button>
                                    )}

                                    {req.status === 'completed' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs border-violet-200 hover:bg-violet-50 text-violet-600"
                                        onClick={() => handleReorder(req)}
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 ml-1" />
                                        إعادة الطلب
                                      </Button>
                                    )}

                                    {nurseAssigned && (req.status === 'in_progress' || req.status === 'approved' || req.status === 'assigned') && (
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl text-xs hover:shadow-md"
                                        onClick={() => {
                                          setActiveChatRequestId(req.id)
                                          setActiveChatNurseName(`${nurseAssigned.firstName} ${nurseAssigned.lastName}`)
                                        }}
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 ml-1" />
                                        محادثة
                                      </Button>
                                    )}

                                    {canRate && (
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs hover:shadow-md"
                                        onClick={() => openRatingDialog(req.id, nurseId)}
                                      >
                                        <Star className="w-3.5 h-3.5 ml-1" />
                                        تقييم الخدمة
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد طلبات</p>
                        <p className="text-muted-foreground text-sm mt-1">قم بطلب خدمة من قسم الخدمات</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== PAYMENTS TAB ===== */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">سجل المدفوعات</h1>
                      <p className="text-muted-foreground text-sm mt-1">عرض سجل المدفوعات والمعاملات المالية</p>
                    </div>

                    {paymentHistory.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {paymentHistory.map((req, i) => (
                          <motion.div key={req.id} variants={itemVariants}>
                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base">{req.service?.name || 'خدمة'}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(req.completedAt || req.updatedAt || req.createdAt)}</p>
                                    {req.paymentMethod && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        طريقة الدفع: {req.paymentMethod}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-left">
                                    <span className="text-lg font-bold text-emerald-600">
                                      {formatPrice(req.price || req.service?.price || 0)}
                                    </span>
                                    <Badge className="block mt-1 text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                                      مدفوع
                                    </Badge>
                                  </div>
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
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد مدفوعات</p>
                        <p className="text-muted-foreground text-sm mt-1">ستظهر المدفوعات هنا بعد إكمال الخدمات</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== PROFILE TAB (Location Edit Only) ===== */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">الملف الشخصي</h1>
                      <p className="text-muted-foreground text-sm mt-1">عرض بياناتك الشخصية وتحديث الموقع</p>
                    </div>

                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                      <CardContent className="p-6 space-y-5">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <span className="text-white font-bold text-2xl">{beneficiaryUser?.name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{profileData?.name || beneficiaryUser?.name}</h2>
                            <Badge className="mt-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 text-xs">مستفيد</Badge>
                          </div>
                        </div>

                        {/* Read-Only: Name */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-500">
                            <User className="w-3.5 h-3.5 inline ml-1" />
                            الاسم
                          </Label>
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700">
                            {profileData?.name || beneficiaryUser?.name || 'غير محدد'}
                          </div>
                        </div>

                        {/* Read-Only: Phone */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-500">
                            <Phone className="w-3.5 h-3.5 inline ml-1" />
                            رقم الهاتف
                          </Label>
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700" dir="ltr">
                            {profileData?.phone || beneficiaryUser?.phone || 'غير محدد'}
                          </div>
                        </div>

                        {/* Editable: Location */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-violet-700">
                            <MapPin className="w-3.5 h-3.5 inline ml-1" />
                            الموقع / العنوان
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Input
                                value={profileLocation}
                                onChange={(e) => {
                                  setProfileLocation(e.target.value)
                                  if (e.target.value.length >= 3) {
                                    searchLocation(e.target.value).then(results => setLocationSearchResults(results))
                                  } else {
                                    setLocationSearchResults([])
                                  }
                                }}
                                placeholder="ابحث عن موقع أو اضغط زر GPS..."
                                className="rounded-xl border-violet-200 focus:border-violet-400 focus:ring-violet-200 w-full"
                              />
                              {locationSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-violet-100 max-h-48 overflow-y-auto">
                                  {locationSearchResults.map((result, idx) => (
                                    <button
                                      key={idx}
                                      className="w-full text-right px-3 py-2.5 hover:bg-violet-50 transition-colors text-sm border-b border-gray-50 last:border-0"
                                      onClick={() => {
                                        setProfileLocation(`${result.name} [${result.lat},${result.lng}]`)
                                        setLocationSearchResults([])
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                        <span className="truncate">{result.name}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="shrink-0 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
                              disabled={gpsLoading}
                              onClick={async () => {
                                setGpsLoading(true)
                                const result = await getGPSLocation()
                                setGpsLoading(false)
                                if (result) {
                                  setProfileLocation(result.address)
                                  setLocationSearchResults([])
                                  toast({ title: 'تم تحديد الموقع بنجاح', description: getDisplayLocation(result.address).substring(0, 80) })
                                } else {
                                  toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
                                }
                              }}
                            >
                              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                            </Button>
                          </div>
                          {/* Clickable map link */}
                          {profileLocation && (
                            <button
                              onClick={() => openInMaps(profileLocation)}
                              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{getDisplayLocation(profileLocation)}</span>
                              <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">فتح في الخريطة</span>
                            </button>
                          )}
                          <p className="text-xs text-violet-600 flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            اضغط على زر GPS لتحديد موقعك تلقائياً أو اكتب للبحث عن عنوان
                          </p>
                        </div>

                        {/* Referral Code (if available) */}
                        {referralCode && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500">
                              <Share2 className="w-3.5 h-3.5 inline ml-1" />
                              كود الإحالة
                            </Label>
                            <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 font-mono font-bold text-center tracking-wider">
                              {referralCode}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleSaveProfile}
                          disabled={profileSaving}
                          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          {profileSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          ) : (
                            <MapPin className="w-4 h-4 ml-2" />
                          )}
                          تحديث الموقع
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== NOTIFICATIONS TAB ===== */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">الإشعارات</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                          {unreadNotifications > 0 ? `لديك ${unreadNotifications} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                        </p>
                      </div>
                      {unreadNotifications > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllNotificationsRead} className="rounded-xl text-xs">
                          تعيين الكل كمقروء
                        </Button>
                      )}
                    </div>

                    {notifications.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {notifications.map((notif, i) => (
                          <motion.div key={notif.id} variants={itemVariants}>
                            <Card
                              className={`border-0 bg-white/80 backdrop-blur-sm shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl ${notifBorderColor[notif.type] || ''} ${!notif.read ? 'ring-1 ring-violet-200/50' : ''}`}
                              onClick={() => markNotificationRead(notif.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${notifIconBg[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {notif.type === 'assignment' ? <User className="w-4 h-4" /> :
                                     notif.type === 'status_change' ? <ClipboardList className="w-4 h-4" /> :
                                     notif.type === 'admin_message' ? <Bell className="w-4 h-4" /> :
                                     <Bell className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className={`font-semibold text-sm ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</h3>
                                      {!notif.read && (
                                        <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                                    <p className="text-[10px] text-muted-foreground mt-2">{formatDateTime(notif.createdAt)}</p>
                                  </div>
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
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد إشعارات</p>
                        <p className="text-muted-foreground text-sm mt-1">ستظهر الإشعارات هنا عند تحديث حالة طلباتك</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== LOYALTY TAB ===== */}
                {activeTab === 'loyalty' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">نقاط الولاء</h1>
                      <p className="text-muted-foreground text-sm mt-1">اجمع النقاط واستبدلها بخصومات</p>
                    </div>

                    {/* Circular Glowing Points Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="border-0 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
                        <CardContent className="p-8 relative z-10 text-center">
                          {/* Circular Points Display */}
                          <div className="relative mx-auto w-40 h-40 mb-6">
                            <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm shadow-[0_0_60px_rgba(139,92,246,0.5)]" />
                            <div className="absolute inset-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Award className="w-6 h-6 text-white/70 mb-1" />
                              <p className="text-4xl font-bold text-white">{loyaltyBalance}</p>
                              <p className="text-violet-200 text-xs mt-0.5">نقطة</p>
                            </div>
                          </div>

                          {/* Level Badge */}
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${loyaltyLevelGradient} shadow-lg mb-4`}>
                            <Shield className="w-4 h-4 text-white" />
                            <span className="text-white font-bold text-sm">مستوى {loyaltyLevel}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="max-w-xs mx-auto">
                            <div className="flex items-center justify-between text-xs text-violet-200 mb-2">
                              <span>{loyaltyLevel}</span>
                              <span>{loyaltyNextLevel}</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/20 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-l from-white via-violet-200 to-fuchsia-200"
                                initial={{ width: 0 }}
                                animate={{ width: `${loyaltyProgress}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                              />
                            </div>
                            <p className="text-xs text-violet-200 mt-2">
                              {loyaltyBalance >= 1000
                                ? 'لقد وصلت أعلى مستوى!'
                                : `تحتاج ${loyaltyNextThreshold - loyaltyBalance} نقطة للوصول للمستوى ${loyaltyNextLevel}`
                              }
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Redeem Section */}
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                          <Gift className="w-5 h-5 text-fuchsia-600" />
                          استبدال النقاط
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">الحد الأدنى للاستبدال 100 نقطة</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={redeemAmount}
                            onChange={(e) => setRedeemAmount(e.target.value)}
                            placeholder="عدد النقاط"
                            min="100"
                            className="rounded-xl"
                          />
                          <Button
                            onClick={handleRedeemPoints}
                            disabled={redeeming || !redeemAmount}
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl hover:shadow-md shrink-0"
                          >
                            {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'استبدال'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Points History */}
                    {loyaltyHistory.length > 0 && (
                      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-violet-600" />
                            سجل النقاط
                          </h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loyaltyHistory.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium">{item.reason || 'معاملة نقاط'}</p>
                                  <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                                </div>
                                <span className={`text-sm font-bold ${item.action === 'redeem' || item.type === 'redeem' ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {item.action === 'redeem' || item.type === 'redeem' ? '-' : '+'}{item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ===== REFERRAL TAB ===== */}
                {activeTab === 'referral' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">برنامج الإحالة</h1>
                      <p className="text-muted-foreground text-sm mt-1">شارك كود الإحالة مع أصدقائك واحصل على نقاط</p>
                    </div>

                    {/* Referral Code Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-0 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]" />
                        <CardContent className="p-8 relative z-10 text-center">
                          <Sparkles className="w-8 h-8 text-white/80 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-white mb-1">كود الإحالة الخاص بك</h3>
                          <p className="text-violet-200 text-xs mb-5">شارك الكود مع أصدقائك</p>

                          {/* Code Display */}
                          <div className="relative mx-auto max-w-xs">
                            <div className="bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 p-4 flex items-center justify-between gap-3">
                              <span className="text-2xl font-bold text-white tracking-[0.2em] font-mono flex-1 text-center">
                                {referralCode || '------'}
                              </span>
                              <button
                                onClick={handleCopyReferral}
                                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
                                aria-label="نسخ الكود"
                              >
                                {copiedReferral ? (
                                  <Check className="w-5 h-5 text-emerald-300" />
                                ) : (
                                  <Copy className="w-5 h-5 text-white" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-violet-200 text-xs mt-4">
                            كل صديق يستخدم كودك يحصل على {adminSettings.referralBonusPointsReceiver || 25} نقطة وأنت تحصل على {adminSettings.referralBonusPoints || 50} نقطة
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Referral Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-5 text-center">
                          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                            <Share2 className="w-6 h-6 text-violet-600" />
                          </div>
                          <p className="text-3xl font-bold text-violet-700">{referralUses}</p>
                          <p className="text-sm text-muted-foreground mt-1">شخص استخدم كودك</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-5 text-center">
                          <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center mx-auto mb-3">
                            <Gift className="w-6 h-6 text-fuchsia-600" />
                          </div>
                          <p className="text-3xl font-bold text-fuchsia-700">{adminSettings.referralBonusPoints || 50}</p>
                          <p className="text-sm text-muted-foreground mt-1">نقطة لكل إحالة ناجحة</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Apply Referral Code */}
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-base mb-1">لديك كود إحالة؟</h3>
                        <p className="text-xs text-muted-foreground mb-4">أدخل كود إحالة صديقك واحصل على {adminSettings.referralBonusPointsReceiver || 25} نقطة</p>
                        <div className="flex gap-2">
                          <Input
                            value={referralInput}
                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                            placeholder="أدخل كود الإحالة"
                            className="rounded-xl font-mono tracking-wider"
                          />
                          <Button
                            onClick={handleApplyReferral}
                            disabled={referralApplying || !referralInput.trim()}
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl hover:shadow-md shrink-0"
                          >
                            {referralApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== HELP TAB ===== */}
                {activeTab === 'help' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">المساعدة والدعم</h1>
                      <p className="text-muted-foreground text-sm mt-1">الأسئلة الشائعة ومعلومات التواصل</p>
                    </div>

                    {/* Contact Info from Admin Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {adminSettings.emergencyPhone && (
                        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-5 text-center">
                              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Phone className="w-6 h-6 text-red-600" />
                              </div>
                              <h3 className="font-semibold text-sm mb-1">هاتف الطوارئ</h3>
                              <a
                                href={`tel:${adminSettings.emergencyPhone}`}
                                className="text-lg font-bold text-red-600 hover:underline"
                                dir="ltr"
                              >
                                {adminSettings.emergencyPhone}
                              </a>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                      {adminSettings.phone && (
                        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-5 text-center">
                              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                                <Phone className="w-6 h-6 text-violet-600" />
                              </div>
                              <h3 className="font-semibold text-sm mb-1">هاتف الدعم</h3>
                              <a
                                href={`tel:${adminSettings.phone}`}
                                className="text-lg font-bold text-violet-600 hover:underline"
                                dir="ltr"
                              >
                                {adminSettings.phone}
                              </a>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                      {adminSettings.email && (
                        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                            <CardContent className="p-5 text-center">
                              <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-6 h-6 text-fuchsia-600" />
                              </div>
                              <h3 className="font-semibold text-sm mb-1">البريد الإلكتروني</h3>
                              <a
                                href={`mailto:${adminSettings.email}`}
                                className="text-sm font-bold text-fuchsia-600 hover:underline break-all"
                              >
                                {adminSettings.email}
                              </a>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>

                    {/* FAQ Accordion */}
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-violet-600" />
                          الأسئلة الشائعة
                        </h3>
                        <Accordion type="single" collapsible className="w-full">
                          {faqItems.map((item, i) => (
                            <AccordionItem key={i} value={`faq-${i}`}>
                              <AccordionTrigger className="text-sm font-medium text-right hover:no-underline">
                                {item.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                                {item.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ===== FLOATING EMERGENCY BUTTON ===== */}
      <motion.button
        onClick={() => {
          setEmergencyForm(prev => ({
            ...prev,
            address: beneficiaryUser?.location || profileLocation || '',
          }))
          setEmergencyDialog(true)
        }}
        className="fixed bottom-24 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.4)',
            '0 0 0 12px rgba(239, 68, 68, 0)',
            '0 0 0 0 rgba(239, 68, 68, 0)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        aria-label="طلب طوارئ"
      >
        <Siren className="w-6 h-6" />
      </motion.button>

      {/* ===== ChatSystem Component ===== */}
      {activeChatRequestId && (
        <ChatSystem
          requestId={activeChatRequestId}
          userId={beneficiaryUser?.id || ''}
          userName={beneficiaryUser?.name || ''}
          userType="beneficiary"
          otherPartyName={activeChatNurseName}
        />
      )}

      {/* ===== EMERGENCY DIALOG ===== */}
      <Dialog open={emergencyDialog} onOpenChange={setEmergencyDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          {/* Red Gradient Header */}
          <div className="bg-gradient-to-l from-red-600 via-rose-600 to-red-700 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">طلب طوارئ</DialogTitle>
                <p className="text-red-100 text-xs mt-0.5">سيتم التعامل مع طلبك بأولوية قصوى</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Service Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 inline ml-1" />
                نوع الخدمة العاجلة
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {emergencyServiceTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setEmergencyForm(prev => ({ ...prev, serviceType: type }))}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      emergencyForm.serviceType === type
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 inline ml-1" />
                العنوان
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={emergencyForm.address}
                    onChange={(e) => {
                      setEmergencyForm(prev => ({ ...prev, address: e.target.value }))
                      if (e.target.value.length >= 3) {
                        searchLocation(e.target.value).then(results => setEmergencyLocationSearchResults(results))
                      } else {
                        setEmergencyLocationSearchResults([])
                      }
                    }}
                    placeholder="ابحث عن موقع أو اضغط زر GPS..."
                    className="rounded-xl w-full"
                  />
                  {emergencyLocationSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-red-100 max-h-48 overflow-y-auto">
                      {emergencyLocationSearchResults.map((result, idx) => (
                        <button
                          key={idx}
                          className="w-full text-right px-3 py-2.5 hover:bg-red-50 transition-colors text-sm border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setEmergencyForm(prev => ({ ...prev, address: `${result.name} [${result.lat},${result.lng}]` }))
                            setEmergencyLocationSearchResults([])
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{result.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-xl"
                  disabled={emergencyGpsLoading}
                  onClick={async () => {
                    setEmergencyGpsLoading(true)
                    const result = await getGPSLocation()
                    setEmergencyGpsLoading(false)
                    if (result) {
                      setEmergencyForm(prev => ({ ...prev, address: result.address }))
                      setEmergencyLocationSearchResults([])
                      toast({ title: 'تم تحديد الموقع بنجاح', description: getDisplayLocation(result.address).substring(0, 80) })
                    } else {
                      toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
                    }
                  }}
                >
                  {emergencyGpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </Button>
              </div>
              {/* Clickable map link */}
              {emergencyForm.address && (
                <button
                  onClick={() => openInMaps(emergencyForm.address)}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 hover:underline transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{getDisplayLocation(emergencyForm.address)}</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">فتح في الخريطة</span>
                </button>
              )}
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">ملاحظات إضافية</Label>
              <Textarea
                value={emergencyForm.notes}
                onChange={(e) => setEmergencyForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف أي تفاصيل إضافية..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <Separator />

            {/* Call Admin Section */}
            {adminSettings.emergencyPhone && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  اتصل بالإدارة
                </p>
                <p className="text-xs text-red-600 mb-3">في حالات الطوارئ، اتصل مباشرة بالإدارة للحصول على استجابة فورية</p>
                <a
                  href={`tel:${adminSettings.emergencyPhone}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Phone className="w-5 h-5" />
                  اتصال
                  <span className="text-red-100 text-sm mr-1" dir="ltr">({adminSettings.emergencyPhone})</span>
                </a>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleEmergencyRequest}
              disabled={emergencySubmitting || !emergencyForm.serviceType || !emergencyForm.address}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg rounded-xl text-base py-3"
            >
              {emergencySubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Siren className="w-5 h-5 ml-2" />
              )}
              إرسال طلب الطوارئ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== SERVICE REQUEST DIALOG ===== */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative">
              <DialogTitle className="text-lg font-bold">طلب خدمة</DialogTitle>
              {selectedService && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-violet-100 text-sm">{selectedService.name}</p>
                  <span className="text-white font-bold">{formatPrice(selectedService.price)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Address Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 inline ml-1" />
                العنوان
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={requestForm.address}
                    onChange={(e) => {
                      setRequestForm(prev => ({ ...prev, address: e.target.value }))
                      if (e.target.value.length >= 3) {
                        searchLocation(e.target.value).then(results => setRequestLocationSearchResults(results))
                      } else {
                        setRequestLocationSearchResults([])
                      }
                    }}
                    placeholder="ابحث عن موقع أو اضغط زر GPS..."
                    className="rounded-xl w-full"
                  />
                  {requestLocationSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-violet-100 max-h-48 overflow-y-auto">
                      {requestLocationSearchResults.map((result, idx) => (
                        <button
                          key={idx}
                          className="w-full text-right px-3 py-2.5 hover:bg-violet-50 transition-colors text-sm border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setRequestForm(prev => ({ ...prev, address: `${result.name} [${result.lat},${result.lng}]` }))
                            setRequestLocationSearchResults([])
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                            <span className="truncate">{result.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-xl"
                  disabled={requestGpsLoading}
                  onClick={async () => {
                    setRequestGpsLoading(true)
                    const result = await getGPSLocation()
                    setRequestGpsLoading(false)
                    if (result) {
                      setRequestForm(prev => ({ ...prev, address: result.address }))
                      setRequestLocationSearchResults([])
                      toast({ title: 'تم تحديد الموقع بنجاح', description: getDisplayLocation(result.address).substring(0, 80) })
                    } else {
                      toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
                    }
                  }}
                >
                  {requestGpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </Button>
              </div>
              {/* Clickable map link */}
              {requestForm.address && (
                <button
                  onClick={() => openInMaps(requestForm.address)}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{getDisplayLocation(requestForm.address)}</span>
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">فتح في الخريطة</span>
                </button>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <CreditCard className="w-3.5 h-3.5 inline ml-1" />
                طريقة الدفع
              </Label>
              <Select value={requestForm.paymentMethod} onValueChange={(v) => setRequestForm(prev => ({ ...prev, paymentMethod: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي عند الاستلام</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">ملاحظات</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف أي ملاحظات..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            {/* Coupon Code */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <Tag className="w-3.5 h-3.5 inline ml-1" />
                كود الخصم
              </Label>
              <div className="flex gap-2">
                <Input
                  value={requestForm.couponCode}
                  onChange={(e) => {
                    setRequestForm(prev => ({ ...prev, couponCode: e.target.value }))
                    if (validCoupon) {
                      setValidCoupon(null)
                      setCouponError('')
                    }
                  }}
                  placeholder="أدخل كود الخصم"
                  className="rounded-xl"
                  disabled={!!validCoupon}
                />
                <Button
                  variant="outline"
                  onClick={handleValidateCoupon}
                  disabled={couponValidating || !requestForm.couponCode.trim() || !!validCoupon}
                  className="rounded-xl shrink-0"
                >
                  {couponValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحقق'}
                </Button>
              </div>
              {couponError && (
                <p className="text-xs text-red-500">{couponError}</p>
              )}
              {validCoupon && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  تم تطبيق خصم {validCoupon.discountPercent}%
                </p>
              )}
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-l from-violet-50/50 to-fuchsia-50/50 border border-violet-100/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">السعر الأصلي</span>
                <span>{formatPrice(selectedService?.price || 0)}</span>
              </div>
              {validCoupon && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-emerald-600">الخصم ({validCoupon.discountPercent}%)</span>
                  <span className="text-emerald-600">-{formatPrice((selectedService?.price || 0) * validCoupon.discountPercent / 100)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-center justify-between font-bold">
                <span>المجموع</span>
                <span className="text-violet-700 text-lg">{formatPrice(getDiscountedPrice())}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleRequestService}
              disabled={submitting || !requestForm.address.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 rounded-xl"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Plus className="w-5 h-5 ml-2" />
              )}
              إرسال الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== RATING DIALOG ===== */}
      <Dialog open={ratingDialog} onOpenChange={setRatingDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">تقييم الخدمة</DialogTitle>
                <p className="text-amber-100 text-xs mt-0.5">أخبرنا عن رأيك في الخدمة المقدمة</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Stars */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRatingValue(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors duration-150 ${
                      star <= ratingValue
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            {ratingValue > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {ratingValue === 1 ? 'سيء' :
                 ratingValue === 2 ? 'مقبول' :
                 ratingValue === 3 ? 'جيد' :
                 ratingValue === 4 ? 'جيد جداً' :
                 'ممتاز'}
              </p>
            )}

            {/* Comment */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">تعليقك (اختياري)</Label>
              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="شاركنا تجربتك..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitRating}
              disabled={ratingSubmitting || ratingValue === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg rounded-xl"
            >
              {ratingSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Star className="w-5 h-5 ml-2" />
              )}
              إرسال التقييم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
