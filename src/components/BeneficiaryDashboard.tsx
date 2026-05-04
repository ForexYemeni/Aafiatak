'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ClipboardList, CreditCard, LogOut, Loader2, Plus, XCircle,
  ShoppingBag, User, Menu, X, Bell, MapPin, Phone, Home, HelpCircle,
  Filter, RefreshCw, Calendar, Tag, AlertTriangle,
  Copy, Check, Award, Zap, Share2, MessageCircle, Star, Send,
  Siren, ChevronDown, ChevronUp, Shield, Gift, TrendingUp, Sparkles, Navigation,
  Flag, Search, Camera, DollarSign, Clock, Eye, FileText, Upload, ImagePlus, Thermometer, Handshake, Mic, Wallet, Stethoscope, Building
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

type Tab = 'services' | 'requests' | 'payments' | 'profile' | 'notifications' | 'loyalty' | 'referral' | 'help' | 'appointments' | 'tracking' | 'reports'

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
  const [requestForm, setRequestForm] = useState({ paymentMethod: '', paymentMethodId: '', notes: '', address: '', couponCode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [requestPaymentMethods, setRequestPaymentMethods] = useState<any[]>([])
  const [requestPaymentMethodsLoading, setRequestPaymentMethodsLoading] = useState(false)

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

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([])
  const [appointmentDialog, setAppointmentDialog] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ serviceId: '', date: '', time: '', notes: '' })
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false)
  const [rescheduleDialog, setRescheduleDialog] = useState(false)
  const [rescheduleId, setRescheduleId] = useState('')
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' })

  // Tracking state
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingAssignmentId, setTrackingAssignmentId] = useState<string>('')

  // Reports state
  const [reports, setReports] = useState<any[]>([])
  const [reportDialog, setReportDialog] = useState(false)
  const [reportForm, setReportForm] = useState({ type: '', requestId: '', description: '' })
  const [reportSubmitting, setReportSubmitting] = useState(false)

  // Favorite nurse state
  const [favoriteNurse, setFavoriteNurse] = useState<any>(null)
  const [requestFavoriteNurse, setRequestFavoriteNurse] = useState(false)

  // Enhanced rating state
  const [ratingCriteria, setRatingCriteria] = useState({ punctuality: 0, professionalism: 0, cleanliness: 0, communication: 0 })
  const [ratingPhotos, setRatingPhotos] = useState<string[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRangeFilter, setPriceRangeFilter] = useState<{ min: number; max: number }>({ min: 0, max: 999999 })
  const [showSearchFilters, setShowSearchFilters] = useState(false)

  // Payment enhanced state
  const [dynamicPricing, setDynamicPricing] = useState<any>(null)
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])

  // Payment flow state
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ method: '', paymentMethodId: '', transactionRef: '', senderName: '', senderPhone: '', exchangeName: '', walletType: '' })
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [lastCreatedRequestId, setLastCreatedRequestId] = useState<string>('')
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([])

  // Nurse search state
  const [nurseSearchResults, setNurseSearchResults] = useState<any[]>([])
  const [nursePortfolio, setNursePortfolio] = useState<any>(null)
  const [nursePortfolioDialog, setNursePortfolioDialog] = useState(false)
  const [nursePortfolioLoading, setNursePortfolioLoading] = useState(false)

  // API notifications state
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([])
  const [notificationsRefreshing, setNotificationsRefreshing] = useState(false)

  const beneficiaryUser = user as { id: string; name: string; phone: string; location: string } | null

  // Fetch admin-defined payment methods for request dialog
  const fetchRequestPaymentMethods = useCallback(async () => {
    setRequestPaymentMethodsLoading(true)
    try {
      const res = await fetch('/api/payments/methods')
      if (res.ok) {
        const data = await res.json()
        setRequestPaymentMethods(Array.isArray(data) ? data : [])
      } else {
        setRequestPaymentMethods([])
      }
    } catch {
      setRequestPaymentMethods([])
    } finally {
      setRequestPaymentMethodsLoading(false)
    }
  }, [])

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
        // Also fetch favorite nurse
        try {
          const fnRes = await fetch(`/api/favorite-nurse?beneficiaryId=${beneficiaryUser?.id}`)
          if (fnRes.ok) {
            const fnData = await fnRes.json()
            setFavoriteNurse(fnData.nurse || null)
          }
        } catch {}
      } else if (activeTab === 'appointments') {
        const res = await fetch(`/api/appointments?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) setAppointments(await res.json())
      } else if (activeTab === 'tracking') {
        // tracking is fetched on-demand when user selects a request
      } else if (activeTab === 'reports') {
        const res = await fetch(`/api/reports/list?beneficiaryId=${beneficiaryUser?.id}`)
        if (res.ok) setReports(await res.json())
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

  // Generate notifications from requests and merge with API notifications
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
    // Merge: API notifications take precedence (by id), then local-derived
    const localNotifIds = new Set(notifs.map(n => n.id))
    const mergedApiNotifs = apiNotifications.filter(an => !localNotifIds.has(an.id))
    setNotifications([...mergedApiNotifs, ...notifs])
  }, [requests, apiNotifications])

  // Load profile data
  useEffect(() => {
    if (activeTab === 'profile' && beneficiaryUser && !profileLoaded) {
      setProfileLocation(beneficiaryUser.location || '')
      setProfileLoaded(true)
    }
  }, [activeTab, beneficiaryUser, profileLoaded])

  // Request service handler
  const handleRequestService = async () => {
    if (!selectedService && selectedServices.length === 0) return
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
          serviceId: selectedServices.length > 0 ? selectedServices[0].id : selectedService?.id,
          serviceIds: selectedServices.length > 0 ? selectedServices.map((s: any) => s.id) : [selectedService?.id],
          services: selectedServices.length > 0 ? selectedServices.map((s: any) => ({ id: s.id, name: s.name, price: s.price })) : selectedService ? [{ id: selectedService.id, name: selectedService.name, price: selectedService.price }] : [],
          isMultiService: selectedServices.length > 1,
          paymentMethod: requestForm.paymentMethod || null,
          paymentMethodId: requestForm.paymentMethodId || null,
          notes: requestForm.notes || null,
          address: requestForm.address || null,
          couponCode: validCoupon?.id || null,
          requestFavoriteNurse: requestFavoriteNurse || null,
          dynamicPrice: dynamicPricing?.totalPrice || null,
          pricingBreakdown: dynamicPricing ? { base: dynamicPricing.basePrice, distanceFee: dynamicPricing.pricing?.distanceSurcharge || 0, timeFee: dynamicPricing.pricing?.timeFee || 0, fridayFee: dynamicPricing.pricing?.fridayFee || 0 } : null,
          commission: dynamicPricing?.commission || null,
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
        toast({ title: 'تم إرسال الطلب بنجاح', description: requestForm.paymentMethod === 'cash' ? 'سيتم مراجعة طلبك من قبل الإدارة والدفع عند الاستلام' : 'سيتم مراجعة طلبك من قبل الإدارة' })
        // If payment method is card or wallet, open payment dialog
        if (requestForm.paymentMethod && requestForm.paymentMethod !== 'cash') {
          setLastCreatedRequestId(data.id || data.requestId || '')
          setPaymentForm(prev => ({ ...prev, method: requestForm.paymentMethod, paymentMethodId: requestForm.paymentMethodId }))
          setRequestDialog(false)
          // Use already-fetched payment methods or fetch them
          if (requestPaymentMethods.length > 0) {
            setAvailablePaymentMethods(requestPaymentMethods)
            const matching = requestPaymentMethods.find((m: any) => m.id === requestForm.paymentMethodId || m.type === requestForm.paymentMethod)
            if (matching) {
              setPaymentForm(prev => ({ ...prev, method: matching.type, paymentMethodId: matching.id }))
            }
          } else {
            try {
              const pmRes = await fetch('/api/payments/methods')
              if (pmRes.ok) {
                const pmData = await pmRes.json()
                setAvailablePaymentMethods(Array.isArray(pmData) ? pmData : [])
                const matching = (Array.isArray(pmData) ? pmData : []).find((m: any) => m.type === requestForm.paymentMethod)
                if (matching) {
                  setPaymentForm(prev => ({ ...prev, method: matching.type, paymentMethodId: matching.id }))
                }
              }
            } catch {}
          }
          setPaymentDialog(true)
        } else {
          setRequestDialog(false)
        }
        setSelectedService(null)
        setSelectedServices([])
        setRequestForm({ paymentMethod: '', paymentMethodId: '', notes: '', address: '', couponCode: '' })
        setValidCoupon(null)
        setCouponError('')
        setRequestFavoriteNurse(false)
        setDynamicPricing(null)
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
    setRequestForm({ paymentMethod: '', paymentMethodId: '', notes: '', address: req.address || beneficiaryUser?.location || '', couponCode: '' })
    setValidCoupon(null)
    setCouponError('')
    setRequestDialog(true)
    fetchRequestPaymentMethods()
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
    setRatingCriteria({ punctuality: 0, professionalism: 0, cleanliness: 0, communication: 0 })
    setRatingPhotos([])
    setRatingDialog(true)
  }

  // ===== APPOINTMENT HANDLERS =====
  const handleCreateAppointment = async () => {
    if (!appointmentForm.serviceId || !appointmentForm.date || !appointmentForm.time) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    setAppointmentSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: beneficiaryUser?.id,
          serviceId: appointmentForm.serviceId,
          date: appointmentForm.date,
          time: appointmentForm.time,
          notes: appointmentForm.notes || undefined,
        }),
      })
      if (res.ok) {
        toast({ title: 'تم حجز الموعد بنجاح' })
        setAppointmentDialog(false)
        setAppointmentForm({ serviceId: '', date: '', time: '', notes: '' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حجز الموعد', variant: 'destructive' })
    } finally {
      setAppointmentSubmitting(false)
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast({ title: 'خطأ', description: 'يرجى اختيار التاريخ والوقت الجديد', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/appointments/${rescheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleForm.date, time: rescheduleForm.time, action: 'reschedule' }),
      })
      if (res.ok) {
        toast({ title: 'تم إعادة جدولة الموعد' })
        setRescheduleDialog(false)
        setRescheduleForm({ date: '', time: '' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (res.ok) {
        toast({ title: 'تم إلغاء الموعد' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // ===== TRACKING HANDLER =====
  const fetchTrackingData = useCallback(async (assignmentId: string) => {
    if (!assignmentId) return
    setTrackingLoading(true)
    try {
      const res = await fetch(`/api/beneficiary/track-nurse?assignmentId=${assignmentId}`)
      if (res.ok) {
        const data = await res.json()
        setTrackingData(data)
      } else {
        setTrackingData(null)
      }
    } catch {
      setTrackingData(null)
    } finally {
      setTrackingLoading(false)
    }
  }, [])

  // Auto-refresh tracking every 30 seconds
  useEffect(() => {
    if (activeTab === 'tracking' && trackingAssignmentId) {
      fetchTrackingData(trackingAssignmentId)
      const interval = setInterval(() => fetchTrackingData(trackingAssignmentId), 30000)
      return () => clearInterval(interval)
    }
  }, [activeTab, trackingAssignmentId, fetchTrackingData])

  // ===== REPORT HANDLER =====
  const handleSubmitReport = async () => {
    if (!reportForm.type || !reportForm.description.trim()) {
      toast({ title: 'خطأ', description: 'يرجى ملء نوع البلاغ والوصف', variant: 'destructive' })
      return
    }
    setReportSubmitting(true)
    try {
      // Find the selected request to get nurse info
      const selectedReq = reportForm.requestId ? requests.find((r: any) => r.id === reportForm.requestId) : null
      const reportBody: any = {
        reporterId: beneficiaryUser?.id,
        reporterType: 'beneficiary',
        type: reportForm.type,
        description: reportForm.description,
      }
      // If a request is selected, link the report to the nurse
      if (selectedReq) {
        reportBody.reportedId = selectedReq.assignment?.nurseId || selectedReq.nurseId || ''
        reportBody.reportedType = 'nurse'
        reportBody.requestId = selectedReq.id
        reportBody.serviceName = selectedReq.service?.name || ''
      } else {
        reportBody.reportedId = 'general'
        reportBody.reportedType = 'service'
      }
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportBody),
      })
      if (res.ok) {
        toast({ title: 'تم إرسال البلاغ بنجاح', description: 'سيتم مراجعته من قبل الإدارة' })
        setReportDialog(false)
        setReportForm({ type: '', requestId: '', description: '' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء إرسال البلاغ', variant: 'destructive' })
    } finally {
      setReportSubmitting(false)
    }
  }

  // ===== FAVORITE NURSE HANDLER =====
  const handleSetFavoriteNurse = async (nurseId: string) => {
    try {
      const res = await fetch('/api/favorite-nurse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryId: beneficiaryUser?.id, nurseId }),
      })
      if (res.ok) {
        const data = await res.json()
        setFavoriteNurse(data.nurse || { id: nurseId })
        toast({ title: 'تم تعيين الممرض/ة كممرض عائلة' })
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // ===== ENHANCED RATING HANDLER =====
  const handleSubmitEnhancedRating = async () => {
    const { punctuality, professionalism, cleanliness, communication } = ratingCriteria
    const overallRating = Math.round((punctuality + professionalism + cleanliness + communication) / 4)
    if (overallRating < 1) {
      toast({ title: 'خطأ', description: 'يرجى تقييم معايير الخدمة', variant: 'destructive' })
      return
    }
    setRatingSubmitting(true)
    try {
      const res = await fetch('/api/ratings/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: ratingRequestId,
          nurseId: ratingNurseId,
          beneficiaryId: beneficiaryUser?.id,
          overallRating: overallRating,
          criteria: ratingCriteria,
          comment: ratingComment || undefined,
          beforePhotos: [],
          afterPhotos: ratingPhotos.length > 0 ? ratingPhotos : [],
        }),
      })
      if (res.ok) {
        toast({ title: 'شكراً لتقييمك!', description: 'تم إرسال تقييمك التفصيلي بنجاح' })
        setRatedRequests(prev => new Set(prev).add(ratingRequestId))
        setRatingDialog(false)
        setRatingValue(0)
        setRatingComment('')
        setRatingCriteria({ punctuality: 0, professionalism: 0, cleanliness: 0, communication: 0 })
        setRatingPhotos([])
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

  // ===== DYNAMIC PRICING HANDLER =====
  const fetchDynamicPricing = async (serviceIds: string[], address: string) => {
    try {
      const now = new Date()
      const coords = extractCoordinates(address)
      const res = await fetch(`/api/dynamic-pricing?serviceIds=${serviceIds.join(',')}&time=${now.getHours()}&dayOfWeek=${now.getDay()}&distanceKm=${coords ? '' : '0'}`)
      if (res.ok) {
        const data = await res.json()
        setDynamicPricing(data)
      }
    } catch {}
  }

  // ===== PAYMENT PROCESSING HANDLER =====
  const handleProcessPayment = async () => {
    if (!lastCreatedRequestId) return
    setPaymentSubmitting(true)
    try {
      const amount = dynamicPricing?.totalPrice || selectedService?.price || 0
      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: lastCreatedRequestId,
          beneficiaryId: beneficiaryUser?.id,
          amount: dynamicPricing?.totalPrice || selectedService?.price || 0,
          method: paymentForm.method,
          paymentMethod: paymentForm.method,
          transactionRef: paymentForm.transactionRef || undefined,
          senderName: paymentForm.senderName || undefined,
          senderPhone: paymentForm.senderPhone || undefined,
          exchangeName: paymentForm.exchangeName || undefined,
        }),
      })
      if (res.ok) {
        toast({ title: 'تم الدفع بنجاح', description: 'تمت معالجة الدفع بنجاح' })
        setPaymentDialog(false)
        setPaymentForm({ method: '', paymentMethodId: '', transactionRef: '', senderName: '', senderPhone: '', exchangeName: '', walletType: '' })
        setLastCreatedRequestId('')
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ في الدفع', description: data.error || 'فشلت عملية الدفع', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء معالجة الدفع', variant: 'destructive' })
    } finally {
      setPaymentSubmitting(false)
    }
  }

  // ===== HANDLE PAY FOR EXISTING REQUEST =====
  const handlePayForRequest = async (req: any) => {
    setLastCreatedRequestId(req.id)
    setSelectedService(req.service || { id: req.serviceId, name: req.service?.name || 'خدمة', price: req.price || req.service?.price || 0 })
    setPaymentForm({ method: '', paymentMethodId: '', transactionRef: '', senderName: '', senderPhone: '', exchangeName: '', walletType: '' })
    // Fetch admin payment methods
    try {
      const pmRes = await fetch('/api/payments/methods')
      if (pmRes.ok) {
        const pmData = await pmRes.json()
        setAvailablePaymentMethods(Array.isArray(pmData) ? pmData : [])
      }
    } catch {}
    setPaymentDialog(true)
  }

  // ===== FETCH NURSE PORTFOLIO =====
  const handleViewNursePortfolio = async (nurseId: string) => {
    setNursePortfolioLoading(true)
    setNursePortfolioDialog(true)
    try {
      const res = await fetch(`/api/nurse/portfolio?nurseId=${nurseId}`)
      if (res.ok) {
        const data = await res.json()
        setNursePortfolio(data)
      } else {
        setNursePortfolio(null)
      }
    } catch {
      setNursePortfolio(null)
    } finally {
      setNursePortfolioLoading(false)
    }
  }

  // ===== FETCH API NOTIFICATIONS =====
  const fetchApiNotifications = useCallback(async () => {
    if (!beneficiaryUser?.id) return
    setNotificationsRefreshing(true)
    try {
      const res = await fetch(`/api/notifications/list?userId=${beneficiaryUser.id}&userType=beneficiary`)
      if (res.ok) {
        const data = await res.json()
        const apiNotifs: Notification[] = (data.notifications || data || []).map((n: any) => ({
          id: n.id || `api-${Math.random().toString(36).substr(2, 9)}`,
          title: n.title || 'إشعار',
          message: n.message || n.body || '',
          type: n.type || 'general',
          read: n.read || false,
          createdAt: n.createdAt || new Date().toISOString(),
          requestId: n.requestId || undefined,
        }))
        setApiNotifications(apiNotifs)
      }
    } catch {}
    finally {
      setNotificationsRefreshing(false)
    }
  }, [beneficiaryUser?.id])

  // Fetch API notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchApiNotifications()
    }
  }, [activeTab, fetchApiNotifications])

  // Fetch payment transactions when payments tab is active
  useEffect(() => {
    if (activeTab === 'payments') {
      fetch('/api/payments/process')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const txns = Array.isArray(data) ? data : (data.transactions || [])
          setPaymentTransactions(txns)
        })
        .catch(() => {})
    }
  }, [activeTab])

  // ===== SEARCH HANDLER =====
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length >= 2) {
      try {
        const [svcRes, nurseRes] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(query)}&type=services`),
          fetch(`/api/search?q=${encodeURIComponent(query)}&type=nurses`).catch(() => null)
        ])
        if (svcRes.ok) {
          const data = await svcRes.json()
          setServices(data)
        }
        if (nurseRes && nurseRes.ok) {
          const nurseData = await nurseRes.json()
          setNurseSearchResults(Array.isArray(nurseData) ? nurseData : (nurseData.nurses || []))
        } else {
          setNurseSearchResults([])
        }
      } catch {}
    } else if (query.length === 0) {
      const res = await fetch('/api/beneficiary/services')
      if (res.ok) setServices(await res.json())
      setNurseSearchResults([])
    }
  }, [])

  // ===== PHOTO UPLOAD HANDLER =====
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setRatingPhotos(prev => [...prev, String(ev.target!.result)])
        }
      }
      reader.readAsDataURL(file as Blob)
    })
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
    ? services.filter(s => {
        const matchesSearch = !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPrice = (s.price || 0) >= priceRangeFilter.min && (s.price || 0) <= priceRangeFilter.max
        return matchesSearch && matchesPrice
      })
    : services.filter(s => {
        const matchesCategory = s.category === selectedCategory
        const matchesSearch = !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPrice = (s.price || 0) >= priceRangeFilter.min && (s.price || 0) <= priceRangeFilter.max
        return matchesCategory && matchesSearch && matchesPrice
      })

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
    { key: 'appointments', label: 'المواعيد', icon: Calendar },
    { key: 'tracking', label: 'تتبع الممرض', icon: MapPin },
    { key: 'payments', label: 'المدفوعات', icon: CreditCard },
    { key: 'reports', label: 'البلاغات', icon: Flag },
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
    if (!selectedService && selectedServices.length === 0) return 0
    const basePrice = selectedServices.length > 0
      ? selectedServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
      : (selectedService?.price || 0)
    if (validCoupon) {
      return basePrice * (1 - validCoupon.discountPercent / 100)
    }
    return basePrice
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

                    {/* Search Bar */}
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                              placeholder="ابحث عن خدمة..."
                              className="pr-9 rounded-xl border-violet-200 focus:border-violet-400"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 rounded-xl border-violet-200"
                            onClick={() => setShowSearchFilters(!showSearchFilters)}
                          >
                            <Filter className="w-4 h-4 text-violet-600" />
                          </Button>
                        </div>
                        {showSearchFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3"
                          >
                            <div>
                              <Label className="text-xs text-muted-foreground">الحد الأدنى للسعر</Label>
                              <Input
                                type="number"
                                value={priceRangeFilter.min || ''}
                                onChange={(e) => setPriceRangeFilter(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                                placeholder="0"
                                className="rounded-xl text-sm mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">الحد الأقصى للسعر</Label>
                              <Input
                                type="number"
                                value={priceRangeFilter.max === 999999 ? '' : priceRangeFilter.max}
                                onChange={(e) => setPriceRangeFilter(prev => ({ ...prev, max: Number(e.target.value) || 999999 }))}
                                placeholder="بدون حد"
                                className="rounded-xl text-sm mt-1"
                              />
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>

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
                                    className={`hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg transition-all duration-200 ${
                                      selectedServices.find((s: any) => s.id === service.id)
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-violet-500/25'
                                    }`}
                                    onClick={() => {
                                      setSelectedService(service)
                                      setSelectedServices(prev => {
                                        const exists = prev.find((s: any) => s.id === service.id)
                                        if (exists) return prev.filter((s: any) => s.id !== service.id)
                                        return [...prev, service]
                                      })
                                      // Fetch pricing for all selected services
                                      const newSelection = selectedServices.find((s: any) => s.id === service.id)
                                        ? selectedServices.filter((s: any) => s.id !== service.id)
                                        : [...selectedServices, service]
                                      setRequestForm({ paymentMethod: '', paymentMethodId: '', notes: '', address: beneficiaryUser?.location || '', couponCode: '' })
                                      setValidCoupon(null)
                                      setCouponError('')
                                      setDynamicPricing(null)
                                      setRequestFavoriteNurse(false)
                                      setRequestDialog(true)
                                      fetchRequestPaymentMethods()
                                      if (newSelection.length > 0) {
                                        fetchDynamicPricing(newSelection.map((s: any) => s.id), beneficiaryUser?.location || '')
                                      }
                                    }}
                                  >
                                    {selectedServices.find((s: any) => s.id === service.id) ? (
                                      <Check className="w-4 h-4 ml-1" />
                                    ) : (
                                      <Plus className="w-4 h-4 ml-1" />
                                    )}
                                    {selectedServices.find((s: any) => s.id === service.id) ? 'مختار' : 'طلب'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : !searchQuery || nurseSearchResults.length === 0 ? (
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
                    ) : null}

                    {/* Nurse Search Results */}
                    {nurseSearchResults.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-violet-600" />
                          <h2 className="text-lg font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">الممرضون</h2>
                        </div>
                        <motion.div
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {nurseSearchResults.map((nurse: any) => (
                            <motion.div key={nurse.id} variants={itemVariants} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
                              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400 to-violet-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                                <CardContent className="p-5 flex flex-col flex-1 relative z-10">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center shadow-md">
                                      <span className="text-white font-bold text-sm">{nurse.firstName?.charAt(0) || nurse.name?.charAt(0) || '?'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-sm truncate">{nurse.firstName} {nurse.lastName || ''}</h3>
                                      {nurse.specializations && (
                                        <p className="text-xs text-muted-foreground truncate">{Array.isArray(nurse.specializations) ? nurse.specializations.join('، ') : nurse.specializations}</p>
                                      )}
                                    </div>
                                  </div>
                                  {nurse.rating && (
                                    <div className="flex items-center gap-1 mb-2">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                      <span className="text-xs text-amber-600 font-medium">{nurse.rating}</span>
                                    </div>
                                  )}
                                  {nurse.location && (
                                    <div className="flex items-center gap-1 mb-3">
                                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground truncate">{nurse.location}</span>
                                    </div>
                                  )}
                                  <div className="mt-auto pt-3 border-t border-gray-100">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full rounded-xl text-xs border-violet-200 hover:bg-violet-50 text-violet-600"
                                      onClick={() => handleViewNursePortfolio(nurse.id)}
                                    >
                                      <Eye className="w-3.5 h-3.5 ml-1" />
                                      عرض الملف
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
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

                                    {isCompleted && nurseId && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs border-fuchsia-200 hover:bg-fuchsia-50 text-fuchsia-600"
                                        onClick={() => handleSetFavoriteNurse(nurseId)}
                                      >
                                        <Heart className="w-3.5 h-3.5 ml-1" />
                                        تعيين كممرض عائلة
                                      </Button>
                                    )}

                                    {isCompleted && !req.paymentStatus && (
                                      <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs hover:shadow-md"
                                        onClick={() => handlePayForRequest(req)}
                                      >
                                        <CreditCard className="w-3.5 h-3.5 ml-1" />
                                        دفع
                                      </Button>
                                    )}

                                    {req.status === 'in_progress' && req.assignment?.id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                                        onClick={() => {
                                          setTrackingAssignmentId(req.assignment.id)
                                          setActiveTab('tracking')
                                        }}
                                      >
                                        <MapPin className="w-3.5 h-3.5 ml-1" />
                                        تتبع الممرض
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

                {/* ===== PAYMENTS TAB (ENHANCED) ===== */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">سجل المدفوعات</h1>
                      <p className="text-muted-foreground text-sm mt-1">عرض سجل المدفوعات والمعاملات المالية</p>
                    </div>

                    {/* Payment Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'all', label: 'الكل' },
                        { key: 'paid', label: 'مدفوع' },
                        { key: 'pending', label: 'قيد الانتظار' },
                        { key: 'refunded', label: 'مسترد' },
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={() => setPaymentFilter(f.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            paymentFilter === f.key
                              ? 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                              : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:border-violet-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Pricing Info Card */}
                    {dynamicPricing && (
                      <Card className="border-0 bg-gradient-to-l from-violet-50/80 to-fuchsia-50/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-violet-600" />
                            <h3 className="font-semibold text-violet-700">التسعير الديناميكي</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">السعر المقدر بناءً على الوقت والمسافة</p>
                          <div className="mt-2 flex items-center gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">السعر الأساسي</p>
                              <p className="text-lg font-bold text-emerald-600">{formatPrice(dynamicPricing.basePrice || 0)}</p>
                            </div>
                            {dynamicPricing.distanceFee > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground">رسوم المسافة</p>
                                <p className="text-lg font-bold text-amber-600">+{formatPrice(dynamicPricing.distanceFee)}</p>
                              </div>
                            )}
                            {dynamicPricing.timeFee > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground">رسوم الوقت</p>
                                <p className="text-lg font-bold text-blue-600">+{formatPrice(dynamicPricing.timeFee)}</p>
                              </div>
                            )}
                            <div className="mr-auto">
                              <p className="text-xs text-muted-foreground">الإجمالي</p>
                              <p className="text-xl font-black text-violet-700">{formatPrice(dynamicPricing.totalPrice || 0)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(paymentFilter === 'all' ? paymentHistory : paymentHistory.filter(r => {
                      if (paymentFilter === 'paid') return true
                      if (paymentFilter === 'pending') return r.paymentStatus === 'pending'
                      if (paymentFilter === 'refunded') return r.paymentStatus === 'refunded'
                      return true
                    })).length > 0 || paymentTransactions.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {/* Existing payment history */}
                        {(paymentFilter === 'all' ? paymentHistory : paymentHistory.filter(r => {
                          if (paymentFilter === 'paid') return true
                          if (paymentFilter === 'pending') return r.paymentStatus === 'pending'
                          if (paymentFilter === 'refunded') return r.paymentStatus === 'refunded'
                          return true
                        })).map((req, i) => (
                          <motion.div key={`req-${req.id}`} variants={itemVariants}>
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
                                    {req.paymentMethod === 'الدفع عند الاستلام' && (
                                      <div className="mt-2 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-xs text-violet-600">إيصال رقمي متاح</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-left">
                                    <span className="text-lg font-bold text-emerald-600">
                                      {formatPrice(req.dynamicPrice || req.price || req.service?.price || 0)}
                                    </span>
                                    <Badge className={`block mt-1 text-[10px] border-0 ${
                                      req.paymentStatus === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                      req.paymentStatus === 'refunded' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                                      'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                    }`}>
                                      {req.paymentStatus === 'pending' ? 'قيد الانتظار' :
                                       req.paymentStatus === 'refunded' ? 'مسترد' : 'مدفوع'}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                        {/* API Payment Transactions */}
                        {paymentTransactions.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mt-4 mb-2">
                              <DollarSign className="w-4 h-4 text-violet-600" />
                              <span className="text-sm font-semibold text-violet-700">معاملات الدفع الإلكتروني</span>
                            </div>
                            {paymentTransactions.map((txn: any, i: number) => (
                              <motion.div key={`txn-${txn.id || i}`} variants={itemVariants}>
                                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                                  <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base">{txn.serviceName || 'خدمة'}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(txn.createdAt)}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          طريقة الدفع: {txn.method === 'cash' ? 'نقدي' : txn.method === 'wallet-deposit' ? 'إيداع محفظة' : txn.method === 'exchange-transfer' ? 'تحويل صراف' : txn.method === 'bank-transfer' ? 'تحويل بنكي' : txn.method === 'card' ? 'بطاقة' : txn.method === 'wallet' ? 'محفظة إلكترونية' : txn.method === 'transfer' ? 'تحويل بنكي' : txn.method}
                                        </p>
                                      </div>
                                      <div className="text-left">
                                        <span className="text-lg font-bold text-emerald-600">{formatPrice(txn.amount || 0)}</span>
                                        <Badge className={`block mt-1 text-[10px] border-0 ${
                                          txn.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                                          txn.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                          'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                        }`}>
                                          {txn.status === 'failed' ? 'فشل' : txn.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </>
                        )}
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

                        {/* Favorite Nurse Section - ممرض/ة العائلة */}
                        {favoriteNurse && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-fuchsia-700">
                              <Heart className="w-3.5 h-3.5 inline ml-1" />
                              ممرض/ة العائلة
                            </Label>
                            <div className="p-4 rounded-xl bg-gradient-to-l from-fuchsia-50/80 to-violet-50/80 border border-fuchsia-100">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center shadow-md">
                                  <span className="text-white font-bold text-lg">{favoriteNurse.firstName?.charAt(0) || '?'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{favoriteNurse.firstName} {favoriteNurse.lastName}</p>
                                  {favoriteNurse.phone && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
                                      <Phone className="w-3 h-3" />
                                      {favoriteNurse.phone}
                                    </p>
                                  )}
                                  {favoriteNurse.rating && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      <span className="text-xs text-amber-600">{favoriteNurse.rating}</span>
                                    </div>
                                  )}
                                </div>
                                <Badge className="bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white border-0 text-[10px]">
                                  <Heart className="w-3 h-3 ml-0.5" /> عائلة
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white rounded-xl text-xs flex-1"
                                  onClick={() => {
                                    setSelectedService(null)
                                    setRequestForm({ paymentMethod: '', paymentMethodId: '', notes: '', address: beneficiaryUser?.location || '', couponCode: '' })
                                    setRequestFavoriteNurse(true)
                                    setRequestDialog(true)
                                    fetchRequestPaymentMethods()
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5 ml-1" />
                                  طلب خدمة مع ممرض/ة العائلة
                                </Button>
                              </div>
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchApiNotifications} disabled={notificationsRefreshing} className="rounded-xl text-xs gap-1.5">
                          {notificationsRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          تحديث
                        </Button>
                        {unreadNotifications > 0 && (
                          <Button variant="outline" size="sm" onClick={markAllNotificationsRead} className="rounded-xl text-xs">
                            تعيين الكل كمقروء
                          </Button>
                        )}
                      </div>
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

                {/* ===== APPOINTMENTS TAB ===== */}
                {activeTab === 'appointments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">المواعيد</h1>
                        <p className="text-muted-foreground text-sm mt-1">احجز المواعيد وأدرها بسهولة</p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl hover:shadow-md"
                        onClick={() => setAppointmentDialog(true)}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        حجز موعد جديد
                      </Button>
                    </div>

                    {appointments.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {appointments.map((apt: any) => (
                          <motion.div key={apt.id} variants={itemVariants}>
                            <Card className={`border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
                              apt.status === 'scheduled' ? 'border-r-4 border-r-emerald-400' :
                              apt.status === 'completed' ? 'border-r-4 border-r-violet-400' :
                              apt.status === 'cancelled' ? 'border-r-4 border-r-gray-400' :
                              'border-r-4 border-r-amber-400'
                            }`}>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base">{apt.service?.name || 'خدمة'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">{apt.date}</span>
                                      <Clock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                                      <span className="text-sm text-muted-foreground">{apt.time}</span>
                                    </div>
                                  </div>
                                  <Badge className={`text-xs shrink-0 border-0 ${
                                    apt.status === 'scheduled' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                                    apt.status === 'completed' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' :
                                    apt.status === 'cancelled' ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                                    'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                  }`}>
                                    {apt.status === 'scheduled' ? 'مجدول' :
                                     apt.status === 'completed' ? 'مكتمل' :
                                     apt.status === 'cancelled' ? 'ملغي' : apt.status}
                                  </Badge>
                                </div>
                                {apt.notes && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    <span className="font-medium">ملاحظات:</span> {apt.notes}
                                  </p>
                                )}
                                {apt.status === 'scheduled' && (
                                  <div className="flex items-center gap-2 mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl text-xs border-violet-200 hover:bg-violet-50 text-violet-600"
                                      onClick={() => {
                                        setRescheduleId(apt.id)
                                        setRescheduleForm({ date: '', time: '' })
                                        setRescheduleDialog(true)
                                      }}
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 ml-1" />
                                      إعادة جدولة
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl text-xs border-red-200 hover:bg-red-50 text-red-600"
                                      onClick={() => handleCancelAppointment(apt.id)}
                                    >
                                      <XCircle className="w-3.5 h-3.5 ml-1" />
                                      إلغاء الموعد
                                    </Button>
                                  </div>
                                )}
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
                          <Calendar className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد مواعيد</p>
                        <p className="text-muted-foreground text-sm mt-1">احجز موعدك الأول من زر "حجز موعد جديد"</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== TRACKING TAB ===== */}
                {activeTab === 'tracking' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">تتبع الممرض</h1>
                      <p className="text-muted-foreground text-sm mt-1">تتبع موقع الممرض/ة المعين/ة لطلبك</p>
                    </div>

                    {/* Select in-progress request for tracking */}
                    {requests.filter(r => r.status === 'in_progress' && r.assignment?.id).length > 0 && !trackingAssignmentId && (
                      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-violet-600" />
                            اختر طلباً للتتبع
                          </h3>
                          <div className="space-y-3">
                            {requests.filter(r => r.status === 'in_progress' && r.assignment?.id).map(req => (
                              <button
                                key={req.id}
                                className="w-full text-right p-3 rounded-xl border border-violet-100 hover:bg-violet-50 transition-colors"
                                onClick={() => setTrackingAssignmentId(req.assignment.id)}
                              >
                                <p className="font-medium text-sm">{req.service?.name || 'خدمة'}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  الممرض/ة: {req.assignment?.nurse?.firstName} {req.assignment?.nurse?.lastName}
                                </p>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {trackingAssignmentId && trackingData && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Map Embed */}
                        {trackingData.nurseLocation && (
                          <Card className="border-0 shadow-lg overflow-hidden">
                            <iframe
                              width="100%"
                              height="350"
                              frameBorder="0"
                              scrolling="no"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${trackingData.nurseLocation.lng - 0.01},${trackingData.nurseLocation.lat - 0.01},${trackingData.nurseLocation.lng + 0.01},${trackingData.nurseLocation.lat + 0.01}&layer=mapnik&marker=${trackingData.nurseLocation.lat},${trackingData.nurseLocation.lng}`}
                              title="موقع الممرض/ة"
                              className="rounded-xl"
                            />
                          </Card>
                        )}

                        {/* Nurse Info Card */}
                        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <span className="text-white font-bold text-xl">
                                  {trackingData.nurse?.firstName?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg">
                                  {trackingData.nurse?.firstName} {trackingData.nurse?.lastName}
                                </h3>
                                {trackingData.nurse?.phone && (
                                  <a
                                    href={`tel:${trackingData.nurse.phone}`}
                                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 hover:underline mt-1"
                                    dir="ltr"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    {trackingData.nurse.phone}
                                  </a>
                                )}
                              </div>
                              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                                في الطريق
                              </Badge>
                            </div>

                            {trackingData.estimatedArrival && (
                              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm font-medium text-emerald-700">
                                    الوقت المتوقع للوصول: {trackingData.estimatedArrival}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Auto-refresh notice */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>يتم تحديث الموقع كل 30 ثانية</span>
                        </div>
                      </motion.div>
                    )}

                    {trackingAssignmentId && trackingLoading && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
                        <p className="text-muted-foreground text-sm">جارٍ تحميل بيانات التتبع...</p>
                      </div>
                    )}

                    {trackingAssignmentId && !trackingLoading && !trackingData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لم يتم العثور على بيانات تتبع</p>
                        <p className="text-muted-foreground text-sm mt-1">قد لا يكون الممرض/ة في الطريق بعد</p>
                      </motion.div>
                    )}

                    {!trackingAssignmentId && requests.filter(r => r.status === 'in_progress' && r.assignment?.id).length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                      >
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد طلبات نشطة للتتبع</p>
                        <p className="text-muted-foreground text-sm mt-1">عندما يتم تعيين ممرض/ة لطلبك، يمكنك تتبع موقعه هنا</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ===== REPORTS TAB ===== */}
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-l from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">البلاغات</h1>
                        <p className="text-muted-foreground text-sm mt-1">قدّم بلاغاً أو شكوى وسيتم مراجعتها</p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl hover:shadow-md"
                        onClick={() => setReportDialog(true)}
                      >
                        <Flag className="w-4 h-4 ml-1" />
                        بلاغ جديد
                      </Button>
                    </div>

                    {reports.length > 0 ? (
                      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                        {reports.map((report: any) => (
                          <motion.div key={report.id} variants={itemVariants}>
                            <Card className={`border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
                              report.status === 'open' ? 'border-r-4 border-r-amber-400' :
                              report.status === 'resolved' ? 'border-r-4 border-r-emerald-400' :
                              'border-r-4 border-r-gray-400'
                            }`}>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className="text-[10px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 shrink-0">
                                        {report.type === 'nurse_issue' ? 'مشكلة ممرض' :
                                         report.type === 'service_issue' ? 'مشكلة خدمة' : 'أخرى'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm mt-2 leading-relaxed">{report.description}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{formatDateTime(report.createdAt)}</p>
                                  </div>
                                  <Badge className={`text-xs shrink-0 border-0 ${
                                    report.status === 'open' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                    report.status === 'resolved' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                                    'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                  }`}>
                                    {report.status === 'open' ? 'مفتوح' :
                                     report.status === 'resolved' ? 'تم الحل' :
                                     report.status === 'in_review' ? 'قيد المراجعة' : report.status}
                                  </Badge>
                                </div>
                                {report.adminResponse && (
                                  <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                                    <p className="text-xs font-medium text-violet-600 mb-1">رد الإدارة:</p>
                                    <p className="text-sm text-violet-800">{report.adminResponse}</p>
                                  </div>
                                )}
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
                          <Flag className="w-10 h-10 text-violet-300" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">لا توجد بلاغات</p>
                        <p className="text-muted-foreground text-sm mt-1">إذا واجهت مشكلة، قم بتقديم بلاغ جديد</p>
                      </motion.div>
                    )}
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
      {activeChatRequestId && beneficiaryUser?.id && (
        <ChatSystem
          requestId={activeChatRequestId}
          userId={beneficiaryUser.id}
          userName={beneficiaryUser.name || 'مستفيد'}
          userType="beneficiary"
          otherPartyName={activeChatNurseName}
        />
      )}

      {/* ===== PAYMENT DIALOG ===== */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">ادفع الآن</DialogTitle>
                <p className="text-emerald-100 text-xs mt-0.5">أكمل عملية الدفع لطلبك</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Service Info */}
            <div className="p-4 rounded-xl bg-gradient-to-l from-emerald-50/50 to-teal-50/50 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{selectedService?.name || 'خدمة'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">رقم الطلب: {lastCreatedRequestId.slice(0, 8)}...</p>
                </div>
                <span className="text-lg font-bold text-emerald-600">{formatPrice(dynamicPricing?.totalPrice || selectedService?.price || 0)}</span>
              </div>
            </div>

            {/* Payment Method Selection from Admin-added methods */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <CreditCard className="w-3.5 h-3.5 inline ml-1" />
                اختر طريقة الدفع
              </Label>
              {availablePaymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {availablePaymentMethods.map((pm: any) => {
                    const isSelected = paymentForm.paymentMethodId === pm.id
                    const typeIcon = pm.type === 'wallet-deposit' ? Wallet : pm.type === 'exchange-transfer' ? Send : pm.type === 'bank-transfer' ? Building : DollarSign
                    const typeColor = pm.type === 'wallet-deposit' ? 'from-blue-400 to-indigo-500' : pm.type === 'exchange-transfer' ? 'from-amber-400 to-orange-500' : pm.type === 'bank-transfer' ? 'from-emerald-400 to-teal-500' : 'from-gray-400 to-gray-500'
                    const typeLabel = pm.type === 'wallet-deposit' ? 'محفظة' : pm.type === 'exchange-transfer' ? 'صراف' : pm.type === 'bank-transfer' ? 'بنكي' : 'نقدي'
                    const Icon = typeIcon
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentForm(prev => ({ ...prev, method: pm.type, paymentMethodId: pm.id }))}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50 shadow-md'
                            : 'border-gray-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColor} flex items-center justify-center shadow-md shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm">{pm.name}</p>
                              <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] px-1.5">{typeLabel}</Badge>
                            </div>
                            {pm.walletType && (
                              <p className="text-xs text-gray-500 mt-0.5">{
                                pm.walletType === 'one-cash' ? 'ون كاش' :
                                pm.walletType === 'cash-wallet' ? 'محفظة كاش' :
                                pm.walletType === 'jawali' ? 'جوالي' :
                                pm.walletType === 'yemen-wallet' ? 'يمن والت' :
                                pm.walletType === 'saba-cash' ? 'سبأكاش' :
                                pm.walletType === 'mahfathati' ? 'محفظتي' :
                                pm.walletType === 'pyes' ? 'بيس' :
                                pm.walletType === 'floosak' ? 'فلوسك' :
                                pm.walletType === 'jaib' ? 'جيب' :
                                pm.walletType === 'shamil-money' ? 'شامل مالي' :
                                pm.walletType === 'em-pay' ? 'إم باي' :
                                pm.walletType === 'bin-dowal-pay' ? 'بن دول باي' :
                                pm.walletType === 'national-wallet' ? 'المحفظة الوطنية' : pm.walletType
                              }</p>
                            )}
                            {pm.accountNumber && (
                              <p className="text-xs text-gray-600 mt-1 font-mono" dir="ltr">{pm.accountNumber}</p>
                            )}
                            {pm.accountName && (
                              <p className="text-xs text-gray-500">{pm.accountName}</p>
                            )}
                            {pm.bankName && (
                              <p className="text-xs text-gray-500">{pm.bankName}</p>
                            )}
                            {pm.exchangeName && (
                              <p className="text-xs text-gray-500">صراف: {pm.exchangeName}</p>
                            )}
                            {pm.instructions && (
                              <p className="text-xs text-amber-600 mt-1 italic">{pm.instructions}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {/* Cash option always available */}
                  <button
                    onClick={() => setPaymentForm(prev => ({ ...prev, method: 'cash', paymentMethodId: 'cash' }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-right ${
                      paymentForm.method === 'cash'
                        ? 'border-emerald-400 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md shrink-0">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">نقدي عند الاستلام</p>
                        <p className="text-xs text-gray-500">سيتم الدفع نقداً عند وصول الممرض</p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <CreditCard className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-700 text-sm font-medium">لا توجد طرق دفع إلكترونية متاحة حالياً</p>
                  <p className="text-amber-600 text-xs mt-1">يمكنك الدفع نقداً عند الاستلام</p>
                  <button
                    onClick={() => setPaymentForm(prev => ({ ...prev, method: 'cash', paymentMethodId: 'cash' }))}
                    className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 transition-colors"
                  >
                    الدفع نقداً
                  </button>
                </div>
              )}
            </div>

            {/* Payment proof fields */}
            {paymentForm.method && paymentForm.method !== 'cash' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm font-bold text-gray-700">أدخل بيانات التحويل</p>

                {/* Sender name for exchange/bank */}
                {(paymentForm.method === 'exchange-transfer' || paymentForm.method === 'bank-transfer') && (
                  <div>
                    <Label className="text-sm font-medium">اسم المرسل *</Label>
                    <Input value={paymentForm.senderName} onChange={e => setPaymentForm(prev => ({ ...prev, senderName: e.target.value }))} placeholder="اسم المرسل" className="rounded-xl mt-1" />
                  </div>
                )}

                {/* Sender phone */}
                <div>
                  <Label className="text-sm font-medium">رقم هاتف المرسل *</Label>
                  <Input value={paymentForm.senderPhone} onChange={e => setPaymentForm(prev => ({ ...prev, senderPhone: e.target.value }))} placeholder="رقم هاتف المرسل" className="rounded-xl mt-1" dir="ltr" />
                </div>

                {/* Transaction reference */}
                <div>
                  <Label className="text-sm font-medium">رقم العملية / المرجع *</Label>
                  <Input value={paymentForm.transactionRef} onChange={e => setPaymentForm(prev => ({ ...prev, transactionRef: e.target.value }))} placeholder="رقم إيصال التحويل" className="rounded-xl mt-1" dir="ltr" />
                </div>

                <p className="text-xs text-amber-600">⚠️ سيتم مراجعة الدفع من قبل الإدارة قبل تنفيذ الطلب</p>
              </div>
            )}

            {paymentForm.method === 'cash' && (
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-amber-700 text-sm">سيتم الدفع نقداً عند وصول الممرض</p>
                <p className="text-amber-600 text-xs mt-1">يرجى تجهيز المبلغ المطلوب: <strong>{formatPrice(dynamicPricing?.totalPrice || selectedService?.price || 0)}</strong></p>
              </div>
            )}

            <Button
              onClick={handleProcessPayment}
              disabled={paymentSubmitting || !paymentForm.method}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg rounded-xl"
            >
              {paymentSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <CreditCard className="w-5 h-5 ml-2" />
              )}
              تأكيد الدفع
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== NURSE PORTFOLIO DIALOG ===== */}
      <Dialog open={nursePortfolioDialog} onOpenChange={setNursePortfolioDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">ملف الممرض/ة</DialogTitle>
                <p className="text-violet-100 text-xs mt-0.5">عرض التفاصيل والخبرات</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {nursePortfolioLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-3" />
                <p className="text-sm text-muted-foreground">جارٍ تحميل الملف...</p>
              </div>
            ) : nursePortfolio ? (
              <div className="space-y-4">
                {/* Nurse Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">{nursePortfolio.firstName?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{nursePortfolio.firstName} {nursePortfolio.lastName}</h3>
                    {nursePortfolio.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3" /> {nursePortfolio.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {nursePortfolio.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-amber-600">{nursePortfolio.rating}</span>
                    {nursePortfolio.reviewCount && (
                      <span className="text-xs text-muted-foreground">({nursePortfolio.reviewCount} تقييم)</span>
                    )}
                  </div>
                )}

                {/* Specializations */}
                {nursePortfolio.specializations && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-violet-700">التخصصات</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(nursePortfolio.specializations) ? nursePortfolio.specializations : [nursePortfolio.specializations]).map((spec: string, i: number) => (
                        <Badge key={i} className="bg-violet-100 text-violet-700 border-0 text-xs">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {nursePortfolio.experience && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-violet-700">الخبرة</Label>
                    <p className="text-sm text-muted-foreground">{nursePortfolio.experience}</p>
                  </div>
                )}

                {/* Bio */}
                {nursePortfolio.bio && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-violet-700">نبذة</Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">{nursePortfolio.bio}</p>
                  </div>
                )}

                {/* Location */}
                {nursePortfolio.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-500" />
                    <span className="text-sm text-muted-foreground">{nursePortfolio.location}</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl"
                    onClick={() => {
                      setNursePortfolioDialog(false)
                      handleSetFavoriteNurse(nursePortfolio.id)
                    }}
                  >
                    <Heart className="w-4 h-4 ml-1" />
                    تعيين كممرض عائلة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <User className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                <p className="text-muted-foreground">لم يتم العثور على بيانات الممرض/ة</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                  <span className="text-white font-bold">{formatPrice(dynamicPricing?.totalPrice || selectedService.price)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-sm font-bold text-violet-700 mb-2">الخدمات المختارة ({selectedServices.length})</p>
                {selectedServices.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-violet-600 font-medium">{s.price} ر.ي</span>
                  </div>
                ))}
                {dynamicPricing && (
                  <div className="border-t border-violet-200 mt-2 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>المجموع الأساسي</span>
                      <span>{dynamicPricing.pricing?.basePrice || dynamicPricing.basePrice} ر.ي</span>
                    </div>
                    {dynamicPricing.pricing?.timeFee > 0 && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>{dynamicPricing.pricing?.timeLabel || 'رسوم الوقت'}</span>
                        <span>+{dynamicPricing.pricing.timeFee} ر.ي</span>
                      </div>
                    )}
                    {dynamicPricing.pricing?.fridayFee > 0 && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>{dynamicPricing.pricing?.fridayLabel || 'رسوم الجمعة'}</span>
                        <span>+{dynamicPricing.pricing.fridayFee} ر.ي</span>
                      </div>
                    )}
                    {dynamicPricing.pricing?.distanceSurcharge > 0 && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>رسوم المسافة ({dynamicPricing.pricing.distanceKm?.toFixed(1)} كم)</span>
                        <span>+{dynamicPricing.pricing.distanceSurcharge} ر.ي</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-violet-700 pt-1 border-t border-violet-200">
                      <span>الإجمالي</span>
                      <span>{dynamicPricing.totalPrice} ر.ي</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                        // Fetch dynamic pricing when service and address are available
                        if (selectedServices.length > 0) {
                          fetchDynamicPricing(selectedServices.map((s: any) => s.id), e.target.value)
                        } else if (selectedService?.id) {
                          fetchDynamicPricing([selectedService.id], e.target.value)
                        }
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

            {/* Payment Method - Admin Defined */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <CreditCard className="w-3.5 h-3.5 inline ml-1" />
                طريقة الدفع
              </Label>
              {requestPaymentMethodsLoading ? (
                <div className="flex items-center gap-2 p-4 bg-violet-50 rounded-xl justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span className="text-sm text-violet-600">جاري تحميل طرق الدفع...</span>
                </div>
              ) : requestPaymentMethods.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(() => {
                    // Group methods by type
                    const walletMethods = requestPaymentMethods.filter((m: any) => m.type === 'wallet-deposit')
                    const exchangeMethods = requestPaymentMethods.filter((m: any) => m.type === 'exchange-transfer')
                    const bankMethods = requestPaymentMethods.filter((m: any) => m.type === 'bank-transfer')
                    const cashMethods = requestPaymentMethods.filter((m: any) => m.type === 'cash')
                    const otherMethods = requestPaymentMethods.filter((m: any) => !['wallet-deposit', 'exchange-transfer', 'bank-transfer', 'cash'].includes(m.type))
                    
                    type GroupInfo = { label: string; icon: any; color: string; methods: any[] }
                    const groups: GroupInfo[] = [
                      { label: 'إيداع عبر محفظة', icon: Wallet, color: 'from-blue-400 to-indigo-500', methods: walletMethods },
                      { label: 'تحويل عبر صراف', icon: Send, color: 'from-amber-400 to-orange-500', methods: exchangeMethods },
                      { label: 'تحويل بنكي', icon: Building, color: 'from-emerald-400 to-teal-500', methods: bankMethods },
                      { label: 'أخرى', icon: CreditCard, color: 'from-purple-400 to-violet-500', methods: otherMethods },
                    ].filter(g => g.methods.length > 0)
                    
                    return (
                      <>
                        {groups.map(group => (
                          <div key={group.label} className="space-y-1.5">
                            <div className="flex items-center gap-1.5 px-1">
                              <group.icon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-bold text-gray-500">{group.label}</span>
                              <span className="text-[10px] text-gray-400">({group.methods.length})</span>
                            </div>
                            {group.methods.map((pm: any) => {
                              const isSelected = requestForm.paymentMethodId === pm.id
                              const Icon = group.icon
                              return (
                                <button
                                  key={pm.id}
                                  type="button"
                                  onClick={() => setRequestForm(prev => ({ ...prev, paymentMethod: pm.type, paymentMethodId: pm.id }))}
                                  className={`w-full p-3 rounded-xl border-2 transition-all text-right ${
                                    isSelected
                                      ? 'border-violet-400 bg-violet-50 shadow-md'
                                      : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center shadow-sm shrink-0`}>
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm truncate">{pm.name}</p>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {pm.walletType && (
                                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{
                                            pm.walletType === 'one-cash' ? 'ون كاش' :
                                            pm.walletType === 'cash-wallet' ? 'محفظة كاش' :
                                            pm.walletType === 'jawali' ? 'جوالي' :
                                            pm.walletType === 'yemen-wallet' ? 'يمن والت' :
                                            pm.walletType === 'saba-cash' ? 'سبأكاش' :
                                            pm.walletType === 'mahfathati' ? 'محفظتي' :
                                            pm.walletType === 'pyes' ? 'بيس' :
                                            pm.walletType === 'floosak' ? 'فلوسك' :
                                            pm.walletType === 'jaib' ? 'جيب' :
                                            pm.walletType === 'shamil-money' ? 'شامل مالي' :
                                            pm.walletType === 'em-pay' ? 'إم باي' :
                                            pm.walletType === 'bin-dowal-pay' ? 'بن دول باي' :
                                            pm.walletType === 'national-wallet' ? 'المحفظة الوطنية' : pm.walletType
                                          }</span>
                                        )}
                                        {pm.accountNumber && (
                                          <span className="text-[10px] text-gray-500 font-mono" dir="ltr">{pm.accountNumber}</span>
                                        )}
                                        {pm.bankName && (
                                          <span className="text-[10px] text-gray-500">{pm.bankName}</span>
                                        )}
                                        {pm.exchangeName && (
                                          <span className="text-[10px] text-gray-500">صراف: {pm.exchangeName}</span>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-violet-500 shrink-0" />}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ))}
                        {/* Cash on delivery - always available */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 px-1">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">نقدي</span>
                          </div>
                          {cashMethods.map((pm: any) => {
                            const isSelected = requestForm.paymentMethodId === pm.id
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setRequestForm(prev => ({ ...prev, paymentMethod: 'cash', paymentMethodId: pm.id }))}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-right ${
                                  isSelected
                                    ? 'border-violet-400 bg-violet-50 shadow-md'
                                    : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm shrink-0">
                                    <DollarSign className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">{pm.name}</p>
                                    {pm.instructions && <p className="text-[10px] text-gray-500 mt-0.5">{pm.instructions}</p>}
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-violet-500 shrink-0" />}
                                </div>
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() => setRequestForm(prev => ({ ...prev, paymentMethod: 'cash', paymentMethodId: 'cash-on-delivery' }))}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-right ${
                              requestForm.paymentMethod === 'cash' && requestForm.paymentMethodId === 'cash-on-delivery'
                                ? 'border-violet-400 bg-violet-50 shadow-md'
                                : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm shrink-0">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">نقدي عند الاستلام</p>
                                <p className="text-[10px] text-gray-500">سيتم الدفع نقداً عند وصول الممرض</p>
                              </div>
                              {requestForm.paymentMethod === 'cash' && requestForm.paymentMethodId === 'cash-on-delivery' && <Check className="w-4 h-4 text-violet-500 shrink-0" />}
                            </div>
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <CreditCard className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-700 text-sm font-medium">لا توجد طرق دفع إلكترونية متاحة حالياً</p>
                  <p className="text-amber-600 text-xs mt-1">يمكنك الدفع نقداً عند الاستلام</p>
                  <button
                    type="button"
                    onClick={() => setRequestForm(prev => ({ ...prev, paymentMethod: 'cash', paymentMethodId: 'cash-on-delivery' }))}
                    className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 transition-colors"
                  >
                    الدفع نقداً عند الاستلام
                  </button>
                </div>
              )}
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

            {/* Favorite Nurse Request */}
            {favoriteNurse && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setRequestFavoriteNurse(!requestFavoriteNurse)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    requestFavoriteNurse
                      ? 'bg-gradient-to-l from-fuchsia-50 to-violet-50 border-2 border-fuchsia-300'
                      : 'bg-gray-50 border border-gray-200 hover:border-fuchsia-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${requestFavoriteNurse ? 'fill-fuchsia-500 text-fuchsia-500' : 'text-gray-400'}`} />
                  <div className="text-right flex-1">
                    <p className="text-sm font-medium">طلب ممرض/ة العائلة</p>
                    <p className="text-xs text-muted-foreground">{favoriteNurse.firstName} {favoriteNurse.lastName}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    requestFavoriteNurse ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-gray-300'
                  }`}>
                    {requestFavoriteNurse && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
                {requestFavoriteNurse && (
                  <p className="text-xs text-fuchsia-600 flex items-center gap-1 mr-8">
                    <Navigation className="w-3 h-3" />
                    سيتم توجيه طلبك لممرض/ة العائلة الخاص بك أولاً
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Price Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-l from-violet-50/50 to-fuchsia-50/50 border border-violet-100/50">
              {/* Dynamic Pricing Breakdown */}
              {dynamicPricing && (
                <div className="mb-3 pb-3 border-b border-violet-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-700">التسعير الديناميكي</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">السعر الأساسي</span>
                    <span>{formatPrice(dynamicPricing.basePrice || 0)}</span>
                  </div>
                  {dynamicPricing.distanceFee > 0 && (
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-amber-600">رسوم المسافة</span>
                      <span className="text-amber-600">+{formatPrice(dynamicPricing.distanceFee)}</span>
                    </div>
                  )}
                  {dynamicPricing.timeFee > 0 && (
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-blue-600">رسوم الوقت</span>
                      <span className="text-blue-600">+{formatPrice(dynamicPricing.timeFee)}</span>
                    </div>
                  )}
                </div>
              )}
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
                <span>السعر الإجمالي</span>
                <span className="text-violet-700 text-lg">{formatPrice(dynamicPricing?.totalPrice || getDiscountedPrice())}</span>
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

      {/* ===== RATING DIALOG (ENHANCED) ===== */}
      <Dialog open={ratingDialog} onOpenChange={setRatingDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
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
            {/* Multi-Criteria Rating */}
            <div className="space-y-4">
              {[
                { key: 'punctuality' as const, label: 'الالتزام بالمواعيد', icon: Clock },
                { key: 'professionalism' as const, label: 'الاحترافية', icon: Shield },
                { key: 'cleanliness' as const, label: 'النظافة', icon: Sparkles },
                { key: 'communication' as const, label: 'التواصل', icon: MessageCircle },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-violet-500" />
                      <Label className="text-sm font-medium">{label}</Label>
                    </div>
                    <span className="text-xs text-muted-foreground">{ratingCriteria[key]}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setRatingCriteria(prev => ({ ...prev, [key]: star }))}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors duration-150 ${
                            star <= ratingCriteria[key]
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Rating Auto-Calculated */}
            {Object.values(ratingCriteria).some((v: number) => v > 0) && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <p className="text-xs text-amber-600 mb-1">التقييم العام</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => {
                    const overall = Math.round(Object.values(ratingCriteria).reduce((a: number, b: number) => a + b, 0) / 4)
                    return (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= overall ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    )
                  })}
                  <span className="text-sm font-bold text-amber-700 mr-2">
                    {Math.round(Object.values(ratingCriteria).reduce((a: number, b: number) => a + b, 0) / 4)}/5
                  </span>
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-violet-500" />
                صور قبل/بعد (اختياري)
              </Label>
              <div className="flex gap-2 flex-wrap">
                {ratingPhotos.map((photo, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                    <img src={photo} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      onClick={() => setRatingPhotos(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-violet-300 flex items-center justify-center cursor-pointer hover:bg-violet-50 transition-colors">
                  <Upload className="w-5 h-5 text-violet-400" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

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
              onClick={handleSubmitEnhancedRating}
              disabled={ratingSubmitting || (ratingCriteria.punctuality + ratingCriteria.professionalism + ratingCriteria.cleanliness + ratingCriteria.communication === 0)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg rounded-xl"
            >
              {ratingSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Star className="w-5 h-5 ml-2" />
              )}
              إرسال التقييم التفصيلي
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== APPOINTMENT DIALOG ===== */}
      <Dialog open={appointmentDialog} onOpenChange={setAppointmentDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">حجز موعد جديد</DialogTitle>
                <p className="text-violet-100 text-xs mt-0.5">اختر الخدمة والوقت المناسب</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">الخدمة</Label>
              <Select value={appointmentForm.serviceId} onValueChange={v => setAppointmentForm(prev => ({ ...prev, serviceId: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - {formatPrice(s.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">التاريخ</Label>
                <Input
                  type="date"
                  value={appointmentForm.date}
                  onChange={e => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                  className="rounded-xl"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">الوقت</Label>
                <Input
                  type="time"
                  value={appointmentForm.time}
                  onChange={e => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ملاحظات (اختياري)</Label>
              <Textarea
                value={appointmentForm.notes}
                onChange={e => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            <Button
              onClick={handleCreateAppointment}
              disabled={appointmentSubmitting}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg rounded-xl"
            >
              {appointmentSubmitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Calendar className="w-5 h-5 ml-2" />}
              حجز الموعد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== RESCHEDULE DIALOG ===== */}
      <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
        <DialogContent className="sm:max-w-sm border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">إعادة جدولة الموعد</DialogTitle>
                <p className="text-violet-100 text-xs mt-0.5">اختر التاريخ والوقت الجديد</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">التاريخ الجديد</Label>
                <Input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={e => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  className="rounded-xl"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">الوقت الجديد</Label>
                <Input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={e => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={handleRescheduleAppointment}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg rounded-xl"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              تأكيد إعادة الجدولة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== REPORT DIALOG ===== */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl p-0 max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="bg-gradient-to-l from-red-600 via-rose-600 to-red-700 p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">تقديم بلاغ أو شكوى</DialogTitle>
                <p className="text-red-100 text-xs mt-0.5">اشرح ما حدث بالتفصيل وسيتم مراجعته من الإدارة</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Select related request */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-violet-500" />
                الخدمة المتعلقة بالبلاغ
              </Label>
              <p className="text-xs text-gray-400 mb-1">اختر الطلب الذي تريد الإبلاغ عنه (اختياري)</p>
              <Select
                value={reportForm.requestId}
                onValueChange={(val) => setReportForm(prev => ({ ...prev, requestId: val === 'none' ? '' : val }))}
              >
                <SelectTrigger className="rounded-xl bg-white/80 border-gray-200/50">
                  <SelectValue placeholder="اختر طلب الخدمة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بلاغ عام (بدون طلب محدد)</SelectItem>
                  {requests
                    .filter((r: any) => r.status === 'completed' || r.status === 'in_progress' || r.status === 'assigned')
                    .map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.service?.name || 'خدمة'} - {r.assignment?.nurse ? `${r.assignment.nurse.firstName} ${r.assignment.nurse.lastName}` : 'لم يُعيّن ممرض'} ({getStatusLabel(r.status)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {reportForm.requestId && (() => {
                const selReq = requests.find((r: any) => r.id === reportForm.requestId)
                if (selReq?.assignment?.nurse) {
                  return (
                    <div className="mt-2 p-3 rounded-xl bg-blue-50/80 ring-1 ring-blue-200/30">
                      <p className="text-xs font-bold text-blue-700 mb-1">الممرض/ة المعين/ة:</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{selReq.assignment.nurse.firstName} {selReq.assignment.nurse.lastName}</p>
                          {selReq.assignment.nurse.phone && <p className="text-xs text-gray-500" dir="ltr">{selReq.assignment.nurse.phone}</p>}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            {/* Report type */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-red-700">نوع البلاغ</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'misconduct', label: 'سلوك غير لائق', desc: 'تصرف غير مهني من الممرض/ة' },
                  { key: 'no-show', label: 'عدم الحضور', desc: 'الممرض/ة لم يحضر في الموعد' },
                  { key: 'late', label: 'تأخر', desc: 'الممرض/ة تأخر عن الموعد' },
                  { key: 'quality', label: 'جودة الخدمة', desc: 'الخدمة لم تكن بالمستوى المطلوب' },
                  { key: 'complaint', label: 'شكوى عامة', desc: 'شكوى أخرى متعلقة بالخدمة' },
                  { key: 'other', label: 'أخرى', desc: 'مشكلة أخرى' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setReportForm(prev => ({ ...prev, type: t.key }))}
                    className={`px-3 py-2.5 rounded-xl text-right transition-all duration-200 ${
                      reportForm.type === t.key
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md ring-2 ring-red-300/50'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{t.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${reportForm.type === t.key ? 'text-red-100' : 'text-gray-400'}`}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed description */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-red-500" />
                شرح تفصيلي لما حدث
              </Label>
              <p className="text-xs text-gray-400">اشرح بالتفصيل ما جرى خلال الخدمة - هذا سيساعد الإدارة في فهم المشكلة</p>
              <Textarea
                value={reportForm.description}
                onChange={e => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب شرحاً تفصيلياً لما حدث... مثلاً: وصل الممرض متأخراً 45 دقيقة عن الموعد المحدد، ثم قام بـ..."
                className="rounded-xl resize-none bg-white/80 border-gray-200/50 focus:border-red-400 min-h-[140px]"
                rows={6}
              />
            </div>

            <Button
              onClick={handleSubmitReport}
              disabled={reportSubmitting}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg rounded-xl h-12"
            >
              {reportSubmitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Flag className="w-5 h-5 ml-2" />}
              إرسال البلاغ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
