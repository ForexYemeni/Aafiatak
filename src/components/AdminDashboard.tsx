'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wrench, Users, ClipboardList, CreditCard,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle, UserPlus,
  Loader2, Shield, Heart, Menu, X, UserCog,
  FileText, Activity, Search, Filter, BarChart3,
  TrendingUp, Tag, Sparkles, Star, Phone, Mail, Gift,
  Ban, Unlock, Eye, AlertTriangle, UsersRound, Settings,
  ChevronDown, AlertCircle, MessageSquare, Clock, MapPin, Calendar, Navigation,
  FileWarning, ShieldCheck, ShieldAlert, Image as ImageIcon,
  Wallet, Send, Building, DollarSign, Save, Copy, Maximize2, ZoomIn,
  Bell, BadgeCheck, Receipt
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { openInMaps, getGPSLocation, searchLocation, extractCoordinates, getDisplayLocation, getMapEmbedUrl, getDirectionsUrl } from '@/lib/location-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

// ─── Date Helpers ──────────────────────────────────────────────
function parseTimestamp(ts: any): Date | null {
  if (!ts) return null
  try {
    // Firestore Timestamp object { seconds, nanoseconds } or { _seconds, _nanoseconds }
    if (typeof ts === 'object' && ts !== null) {
      const sec = ts.seconds ?? ts._seconds ?? ts.sec
      if (sec !== undefined) return new Date(sec * 1000)
      // If it's a Date object
      if (ts instanceof Date) return ts
      // If it has toDate method (Firestore Timestamp)
      if (typeof ts.toDate === 'function') return ts.toDate()
    }
    if (typeof ts === 'number') return new Date(ts)
    if (typeof ts === 'string') {
      const d = new Date(ts)
      if (!isNaN(d.getTime())) return d
    }
    return null
  } catch { return null }
}

function formatDate(ts: any): string {
  const d = parseTimestamp(ts)
  if (!d) return 'غير محدد'
  return isNaN(d.getTime()) ? 'غير محدد' : d.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })
}
function formatDateTime(ts: any): string {
  const d = parseTimestamp(ts)
  if (!d) return 'غير محدد'
  return isNaN(d.getTime()) ? 'غير محدد' : d.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Types ─────────────────────────────────────────────────────
type Tab = 'dashboard' | 'services' | 'nurses' | 'beneficiaries' | 'requests' | 'emergency' | 'payments' | 'coupons' | 'ratings' | 'complaints' | 'activity' | 'sub-admins' | 'settings'
type FinanceSubTab = 'methods' | 'transactions' | 'settings' | 'pricing'

interface DashboardStats {
  totalNurses: number
  approvedNurses: number
  pendingNurses: number
  totalBeneficiaries: number
  totalServices: number
  activeServices: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  completedRequests: number
  totalRevenue: number
  unverifiedNurses?: number
  pendingComplaints?: number
  pendingPaymentConfirmations?: number
  pendingEmergency?: number
  pendingAssignmentAcceptance?: number
  allPendingRequests?: number
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#6b7280']

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AdminDashboard() {
  const { user, setUser, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [nurses, setNurses] = useState<any[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ─── Dialog states ─────────────────────────────────────────
  const [editNameDialog, setEditNameDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const [nurseSearch, setNurseSearch] = useState('')
  const [nurseFilter, setNurseFilter] = useState<string>('all')
  const [beneficiarySearch, setBeneficiarySearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all')
  const [requestServiceFilter, setRequestServiceFilter] = useState<string>('all')
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [requestActionFilter, setRequestActionFilter] = useState<string>('needs_action')

  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')

  const [beneficiaryDetail, setBeneficiaryDetail] = useState<any>(null)
  const [beneficiaryRequests, setBeneficiaryRequests] = useState<any[]>([])
  const [nurseDetail, setNurseDetail] = useState<any>(null)
  const [viewingImage, setViewingImage] = useState<{url: string, title: string} | null>(null)

  // Service form
  const [serviceDialog, setServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', category: 'قياسات وتحاليل', isActive: true })
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all')
  const [seedServicesLoading, setSeedServicesLoading] = useState(false)

  // Payment form
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({
    type: 'wallet-deposit',
    name: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    exchangeName: '',
    walletType: '',
    instructions: '',
    isActive: true,
  })

  // Assign nurse / approve request dialog
  const [approveDialog, setApproveDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [approveMode, setApproveMode] = useState<'assign' | 'direct'>('assign')
  const [selectedNurseId, setSelectedNurseId] = useState('')
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentConfirmStep, setPaymentConfirmStep] = useState(false)

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectingId, setRejectingId] = useState('')
  const [rejectType, setRejectType] = useState<'nurse' | 'request'>('nurse')
  const [adminNotes, setAdminNotes] = useState('')

  // Delete confirm dialog
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'nurse' | 'beneficiary'; id: string; name: string } | null>(null)

  // Coupons
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponDialog, setCouponDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true })

  // Ratings
  const [ratingsNurseFilter, setRatingsNurseFilter] = useState<string>('all')

  // Reset all data
  const [resetDataDialog, setResetDataDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Nearby nurses geocoding cache
  const [nurseDistances, setNurseDistances] = useState<Record<string, number>>({})
  const [geocodingLoading, setGeocodingLoading] = useState(false)

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ name: string; lat: string; lng: string; display: string }>>([])
  const [locationSearchLoading, setLocationSearchLoading] = useState(false)

  // Finance sub-tab
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubTab>('methods')

  // ─── Sub-admin permission check (MUST be before all useEffects/handlers that use them) ────
  const isSubAdmin = (user as any)?.role === 'sub-admin'
  const adminId = (user as any)?.id || (user as any)?.adminId || ''
  const subAdminPermissions: Record<string, boolean> = (user as any)?.permissions || {}
  const hasPermission = (perm: string) => !isSubAdmin || !!subAdminPermissions[perm]

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; icon: any; iconColor: string; onConfirm: () => void } | null>(null)

  const showConfirmDialog = (title: string, description: string, icon: any, iconColor: string, onConfirm: () => void) => {
    setConfirmAction({ title, description, icon, iconColor, onConfirm })
    setConfirmDialog(true)
  }

  // Complaints
  const [complaints, setComplaints] = useState<any[]>([])
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [complaintDetail, setComplaintDetail] = useState<any>(null)
  const [complaintFilter, setComplaintFilter] = useState<string>('all')
  const [complaintNotes, setComplaintNotes] = useState('')

  // Settings
  const [settings, setSettings] = useState<any>(null)
  const [subAdmins, setSubAdmins] = useState<any[]>([])
  const [subAdminDialog, setSubAdminDialog] = useState(false)
  const [editingSubAdmin, setEditingSubAdmin] = useState<any>(null)
  const [subAdminForm, setSubAdminForm] = useState({ name: '', phone: '', password: '', permissions: { services: false, nurses: false, beneficiaries: false, requests: false, payments: false, coupons: false, reports: false, emergency: false, ratings: false } })

  // Map preview dialog
  const [mapPreviewDialog, setMapPreviewDialog] = useState(false)
  const [mapPreviewLocation, setMapPreviewLocation] = useState('')
  const [mapPreviewLabel, setMapPreviewLabel] = useState('')

  // ─── mustChangePassword check ──────────────────────────────
  useEffect(() => {
    if ((user as any)?.mustChangePassword) {
      setView('admin-change-password')
    }
  }, [user, setView])

  // ─── Activity logger ───────────────────────────────────────
  const logActivity = useCallback(async (type: string, description: string, metadata?: Record<string, any>) => {
    try {
      await fetch('/api/admin/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, userId: (user as any)?.id, userName: (user as any)?.name || 'المدير', metadata }),
      })
    } catch { /* silently fail */ }
  }, [user])

  // ─── Fetch data by tab ─────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const [dashRes, actRes, emRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/activity-log?limit=10'),
          fetch('/api/admin/emergency'),
        ])
        if (dashRes.ok) setStats(await dashRes.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل إحصائيات لوحة التحكم', variant: 'destructive' })
        if (actRes.ok) setActivityLogs(await actRes.json())
        if (emRes.ok) { const data = await emRes.json(); setEmergencyRequests(Array.isArray(data) ? data : []) }
      } else if (activeTab === 'services') {
        const res = await fetch('/api/admin/services')
        if (res.ok) setServices(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل الخدمات', variant: 'destructive' })
      } else if (activeTab === 'nurses') {
        const res = await fetch('/api/admin/nurses')
        if (res.ok) setNurses(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل بيانات الممرضين', variant: 'destructive' })
      } else if (activeTab === 'beneficiaries') {
        const res = await fetch('/api/admin/beneficiaries')
        if (res.ok) setBeneficiaries(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل بيانات المستفيدين', variant: 'destructive' })
      } else if (activeTab === 'requests') {
        const res = await fetch('/api/admin/requests')
        if (res.ok) setRequests(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل الطلبات', variant: 'destructive' })
      } else if (activeTab === 'emergency') {
        const res = await fetch('/api/admin/emergency')
        if (res.ok) { const data = await res.json(); setEmergencyRequests(Array.isArray(data) ? data : []) }
        else toast({ title: 'خطأ', description: 'فشل تحميل طلبات الطوارئ', variant: 'destructive' })
      } else if (activeTab === 'payments') {
        const [payRes, transRes] = await Promise.all([
          fetch('/api/admin/payments'),
          fetch('/api/payments/process').catch(() => null),
        ])
        if (payRes.ok) setPayments(await payRes.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل طرق الدفع', variant: 'destructive' })
        if (transRes?.ok) { const transData = await transRes.json(); setTransactions(Array.isArray(transData) ? transData : []) }
        try {
          const settingsUrl = isSubAdmin ? `/api/admin/settings?subAdminId=${(user as any)?.id}` : '/api/admin/settings'
          const setRes = await fetch(settingsUrl)
          if (setRes.ok) setSettings(await setRes.json())
        } catch {}
      } else if (activeTab === 'coupons') {
        const res = await fetch('/api/admin/coupons')
        if (res.ok) setCoupons(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل الكوبونات', variant: 'destructive' })
      } else if (activeTab === 'ratings') {
        const url = ratingsNurseFilter !== 'all' ? `/api/admin/ratings?nurseId=${ratingsNurseFilter}` : '/api/admin/ratings'
        const res = await fetch(url)
        if (res.ok) setRatings(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل التقييمات', variant: 'destructive' })
      } else if (activeTab === 'activity') {
        const res = await fetch('/api/admin/activity-log?limit=50')
        if (res.ok) setActivityLogs(await res.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل سجل النشاط', variant: 'destructive' })
      } else if (activeTab === 'complaints') {
        setComplaintsLoading(true)
        try {
          const res = await fetch('/api/reports/list')
          if (res.ok) { const data = await res.json(); setComplaints(Array.isArray(data) ? data : []) }
          else toast({ title: 'خطأ', description: 'فشل تحميل الشكاوى', variant: 'destructive' })
        } catch { toast({ title: 'خطأ', description: 'فشل تحميل الشكاوى', variant: 'destructive' }) }
        finally { setComplaintsLoading(false) }
      } else if (activeTab === 'sub-admins') {
        // Use adminId for sub-admins (parent admin ID) or own ID for main admin
        const isSub = (user as any)?.role === 'sub-admin'
        const fetchAdminId = isSub ? (user as any)?.adminId : (user as any)?.id
        const saRes = await fetch(`/api/admin/sub-admins?adminId=${fetchAdminId}`)
        if (saRes.ok) setSubAdmins(await saRes.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل المسؤولين الفرعيين', variant: 'destructive' })
      } else if (activeTab === 'settings') {
        const settingsUrl = isSubAdmin ? `/api/admin/settings?subAdminId=${(user as any)?.id}` : '/api/admin/settings'
        const setRes = await fetch(settingsUrl)
        if (setRes.ok) setSettings(await setRes.json())
        else toast({ title: 'خطأ', description: 'فشل تحميل الإعدادات', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, toast, ratingsNurseFilter, user])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLogout = () => { logout(); setView('landing') }

  // ─── Show map preview helper ──────────────────────────────────
  const showMapPreview = (location: string, label?: string) => {
    if (!location || location === 'غير محدد') return
    setMapPreviewLocation(location)
    setMapPreviewLabel(label || getDisplayLocation(location))
    setMapPreviewDialog(true)
  }

  // ─── Update admin profile ──────────────────────────────────
  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: (user as any)?.id, name: editName.trim(), phone: editPhone.trim(), email: editEmail.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data, 'admin')
        setEditNameDialog(false)
        toast({ title: 'تم تحديث البيانات بنجاح' })
        logActivity('admin_update', `تم تحديث بيانات المدير`)
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // ─── Service CRUD ───────────────────────────────────────────
  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.description || !serviceForm.price) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services'
      const method = editingService ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...serviceForm, price: Number(serviceForm.price) || 0 }) })
      if (res.ok) {
        toast({ title: editingService ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة' })
        logActivity(editingService ? 'service_update' : 'service_create', `${editingService ? 'تم تحديث' : 'تم إضافة'} خدمة: ${serviceForm.name}`)
        setServiceDialog(false); setEditingService(null); setServiceForm({ name: '', description: '', price: '', category: 'عام', isActive: true }); fetchData()
      } else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'تم حذف الخدمة' }); logActivity('service_delete', 'تم حذف خدمة'); fetchData() }
      else { const data = await res.json().catch(() => ({})); toast({ title: 'خطأ', description: data.error || 'فشل حذف الخدمة', variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'فشل حذف الخدمة', variant: 'destructive' }) }
  }

  // ─── Seed default services ────────────────────────────────────
  const handleSeedServices = async (overwrite: boolean) => {
    setSeedServicesLoading(true)
    try {
      const res = await fetch('/api/admin/services/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'تم بنجاح', description: data.message || `تم إضافة ${data.count} خدمة` })
        logActivity('services_seed', `تم إضافة ${data.count} خدمة افتراضية`)
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'فشل إضافة الخدمات', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSeedServicesLoading(false)
    }
  }

  // ─── Nurse actions ─────────────────────────────────────────
  const handleNurseAction = async (id: string, status: string) => {
    if (status === 'rejected') {
      setRejectingId(id); setRejectType('nurse'); setAdminNotes(''); setRejectDialog(true); return
    }
    try {
      const res = await fetch(`/api/admin/nurses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) {
        const labels: Record<string, string> = { approved: 'تم قبول الممرض', blocked: 'تم حظر الممرض' }
        toast({ title: labels[status] || 'تم التحديث' }); fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'خطأ', description: data.error || 'فشل التحديث', variant: 'destructive' })
      }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteNurse = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/nurses/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'تم حذف الممرض' }); logActivity('nurse_delete', 'تم حذف ممرض'); setDeleteDialog(false); fetchData() }
      else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Beneficiary actions ───────────────────────────────────
  const handleBeneficiaryAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/beneficiaries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) {
        toast({ title: status === 'blocked' ? 'تم حظر المستفيد' : 'تم تفعيل المستفيد' }); fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'خطأ', description: data.error || 'فشل التحديث', variant: 'destructive' })
      }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteBeneficiary = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/beneficiaries/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'تم حذف المستفيد' }); logActivity('beneficiary_delete', 'تم حذف مستفيد'); setDeleteDialog(false); fetchData() }
      else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Request actions ───────────────────────────────────────
  const handleOpenApproveDialog = async (req: any) => {
    setSelectedRequest(req); setApproveMode('assign'); setSelectedNurseId(''); setNurseDistances({});
    setPaymentConfirmed(false); setPaymentConfirmStep(true); setApproveDialog(true)
    // Fetch nurses from API if not already loaded (e.g. when on requests tab)
    let currentNurses = nurses
    if (nurses.length === 0) {
      try {
        const res = await fetch('/api/admin/nurses')
        if (res.ok) {
          currentNurses = await res.json()
          setNurses(currentNurses)
        }
      } catch { /* silently fail */ }
    }
    // Fetch distances for nearby nurses
    const benefLoc = req.beneficiary?.location || req.address || req.location || ''
    if (benefLoc) fetchNurseDistancesWithNurses(benefLoc, currentNurses)
  }

  const handleConfirmApprove = async () => {
    // Step 1: Confirm payment first if not yet confirmed
    if (!paymentConfirmed) {
      // First confirm payment, then proceed
      try {
        const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', paymentStatus: 'paid' }),
        })
        if (res.ok) {
          setPaymentConfirmed(true)
          setPaymentConfirmStep(false)
          toast({ title: 'تم تأكيد الدفع وقبول الطلب', description: 'الآن يمكنك تعيين ممرض أو التنفيذ المباشر' })
          fetchData()
        } else {
          const data = await res.json()
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
        }
      } catch {
        toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
      }
      return
    }

    // Step 2: Assign nurse or direct execute (payment already confirmed)
    if (approveMode === 'assign') {
      if (!selectedNurseId) { toast({ title: 'خطأ', description: 'يرجى اختيار ممرض', variant: 'destructive' }); return }
      try {
        if ((selectedRequest as any)?.isEmergency) {
          // Assign nurse to emergency request
          const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedRequest.id, nurseId: selectedNurseId, status: 'in_progress' }) })
          if (res.ok) { toast({ title: 'تم تعيين الممرض لطلب الطوارئ' }); logActivity('nurse_assign_emergency', 'تم تعيين ممرض لطلب طوارئ', { requestId: selectedRequest.id, nurseId: selectedNurseId }); setApproveDialog(false); fetchData() }
          else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
        } else {
          const res = await fetch('/api/admin/assign-nurse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: selectedRequest.id, nurseId: selectedNurseId }) })
          if (res.ok) { toast({ title: 'تم تعيين الممرض بنجاح' }); logActivity('nurse_assign', 'تم تعيين ممرض لطلب', { requestId: selectedRequest.id, nurseId: selectedNurseId }); setApproveDialog(false); fetchData() }
          else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
        }
      } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    } else {
      try {
        if ((selectedRequest as any)?.isEmergency) {
          const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedRequest.id, status: 'in_progress', adminNotes: 'تم التنفيذ من قبل الإدارة', handledBy: 'admin' }) })
          if (res.ok) { toast({ title: 'تم بدء معالجة طلب الطوارئ' }); logActivity('emergency_direct_execute', 'تم بدء معالجة طلب طوارئ مباشرة', { requestId: selectedRequest.id }); setApproveDialog(false); fetchData() }
        } else {
          const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_progress', adminNotes: 'تم التنفيذ من قبل الإدارة', handledBy: 'admin' }) })
          if (res.ok) { toast({ title: 'تم تنفيذ الطلب مباشرة' }); logActivity('request_direct_execute', 'تم تنفيذ طلب مباشرة من الإدارة', { requestId: selectedRequest.id }); setApproveDialog(false); fetchData() }
        }
      } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    }
  }

  const handleRequestAction = async (id: string, status: string) => {
    if (status === 'rejected') { setRejectingId(id); setRejectType('request'); setAdminNotes(''); setRejectDialog(true); return }
    if (status === 'approved') { const req = requests.find((r: any) => r.id === id); if (req) handleOpenApproveDialog(req); return }
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) { toast({ title: 'تم التحديث' }); fetchData() }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleRejectConfirm = async () => {
    try {
      const url = rejectType === 'nurse' ? `/api/admin/nurses/${rejectingId}` : `/api/admin/requests/${rejectingId}`
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected', adminNotes }) })
      if (res.ok) { toast({ title: 'تم الرفض' }); logActivity(`${rejectType}_reject`, `تم رفض ${rejectType === 'nurse' ? 'ممرض' : 'طلب'}`, { id: rejectingId }); setRejectDialog(false); fetchData() }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) { toast({ title: 'خطأ', description: 'يرجى تحديد طلبات أولاً', variant: 'destructive' }); return }
    showConfirmDialog('قبول جماعي', `هل أنت متأكد من قبول ${selectedRequestIds.length} طلب؟`, CheckCircle, 'text-emerald-500', async () => {
      try {
        let successCount = 0
        for (const id of selectedRequestIds) {
          const res = await fetch(`/api/admin/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) })
          if (res.ok) successCount++
        }
        toast({ title: `تم قبول ${successCount} طلب بنجاح` }); logActivity('bulk_approve', `تم قبول ${successCount} طلب دفعة واحدة`); setSelectedRequestIds([]); fetchData()
      } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    })
  }

  // ─── Payment CRUD ───────────────────────────────────────────
  const getWalletTypeLabel = (wt: string) => {
    const labels: Record<string, string> = {
      'one-cash': 'ون كاش', 'cash-wallet': 'محفظة كاش', 'jawali': 'جوالي', 'yemen-wallet': 'يمن والت',
      'saba-cash': 'سبأكاش', 'mahfathati': 'محفظتي', 'pyes': 'بيس', 'floosak': 'فلوسك',
      'jaib': 'جيب', 'shamil-money': 'شامل مالي', 'em-pay': 'إم باي', 'bin-dowal-pay': 'بن دول باي',
      'national-wallet': 'المحفظة الوطنية', 'other': 'أخرى',
    }
    return labels[wt] || wt
  }

  const handleSavePayment = async () => {
    if (!paymentForm.type) { toast({ title: 'خطأ', description: 'يرجى اختيار النوع', variant: 'destructive' }); return }
    if (paymentForm.type === 'wallet-deposit' && !paymentForm.walletType) { toast({ title: 'خطأ', description: 'يرجى اختيار نوع المحفظة', variant: 'destructive' }); return }
    if (paymentForm.type === 'wallet-deposit' && !paymentForm.accountName) { toast({ title: 'خطأ', description: 'يرجى إدخال اسم صاحب المحفظة', variant: 'destructive' }); return }
    if (paymentForm.type === 'wallet-deposit' && !paymentForm.accountNumber) { toast({ title: 'خطأ', description: 'يرجى إدخال رقم المحفظة', variant: 'destructive' }); return }
    if (paymentForm.type === 'exchange-transfer' && !paymentForm.exchangeName) { toast({ title: 'خطأ', description: 'يرجى إدخال اسم الصراف', variant: 'destructive' }); return }
    if (paymentForm.type === 'bank-transfer' && !paymentForm.accountNumber) { toast({ title: 'خطأ', description: 'يرجى إدخال رقم الحساب البنكي', variant: 'destructive' }); return }
    // Auto-generate name from walletType, bankName, or exchangeName
    let autoName = paymentForm.name
    if (!autoName) {
      if (paymentForm.type === 'wallet-deposit') autoName = getWalletTypeLabel(paymentForm.walletType)
      else if (paymentForm.type === 'exchange-transfer') autoName = `صراف ${paymentForm.exchangeName}`
      else if (paymentForm.type === 'bank-transfer') autoName = paymentForm.bankName
      else if (paymentForm.type === 'cash') autoName = 'نقدي'
      else autoName = 'طريقة دفع'
    }
    try {
      const url = editingPayment ? `/api/admin/payments/${editingPayment.id}` : '/api/admin/payments'
      const method = editingPayment ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...paymentForm, name: autoName }) })
      if (res.ok) { toast({ title: editingPayment ? 'تم تحديث طريقة الدفع' : 'تم إضافة طريقة الدفع' }); setPaymentDialog(false); setEditingPayment(null); setPaymentForm({ type: 'wallet-deposit', name: '', accountName: '', accountNumber: '', bankName: '', exchangeName: '', walletType: '', instructions: '', isActive: true }); fetchData() }
      else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeletePayment = async (id: string) => {
    showConfirmDialog('حذف طريقة الدفع', 'هل أنت متأكد من حذف طريقة الدفع هذه؟', Trash2, 'text-red-500', async () => {
      try { const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف طريقة الدفع' }); fetchData() } else { const data = await res.json().catch(() => ({})); toast({ title: 'خطأ', description: data.error || 'فشل الحذف', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    })
  }

  // Confirm payment transaction
  const handleConfirmPayment = async (transactionId: string) => {
    try {
      const res = await fetch('/api/payments/process', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action: 'confirm', adminId }),
      })
      if (res.ok) {
        toast({ title: 'تم تأكيد الدفع', description: 'يمكن الآن تنفيذ الطلب وتعيين ممرض' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Confirm payment directly on a pending_payment request (when beneficiary paid via WhatsApp)
  const handleConfirmRequestPayment = async (requestId: string) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_confirmation', paymentStatus: 'paid' }),
      })
      if (res.ok) {
        toast({ title: 'تم تأكيد الدفع', description: 'تم تأكيد استلام الدفع، يمكن الآن قبول الطلب وتعيين ممرض' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Reject payment transaction
  const handleRejectPayment = async (transactionId: string) => {
    showConfirmDialog('رفض الدفع', 'هل أنت متأكد من رفض هذا الدفع؟ سيتم إعلام المستفيد بذلك.', XCircle, 'text-red-500', async () => {
      try {
        const res = await fetch('/api/payments/process', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId, action: 'reject', adminId }),
        })
        if (res.ok) {
          toast({ title: 'تم رفض الدفع' })
          fetchData()
        } else {
          const data = await res.json().catch(() => ({}))
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
        }
      } catch {
        toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
      }
    })
  }

  // ─── Coupon CRUD ───────────────────────────────────────────
  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discountPercent || !couponForm.maxUses || !couponForm.expiresAt) { toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' }); return }
    const discountVal = Number(couponForm.discountPercent)
    const maxUsesVal = Number(couponForm.maxUses)
    if (discountVal <= 0 || discountVal > 100) { toast({ title: 'خطأ', description: 'نسبة الخصم يجب أن تكون بين 1 و 100', variant: 'destructive' }); return }
    if (maxUsesVal <= 0) { toast({ title: 'خطأ', description: 'عدد مرات الاستخدام يجب أن يكون أكبر من صفر', variant: 'destructive' }); return }
    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...couponForm, discountPercent: discountVal, maxUses: maxUsesVal }) })
      if (res.ok) { toast({ title: editingCoupon ? 'تم تحديث الكوبون' : 'تم إضافة الكوبون' }); setCouponDialog(false); setEditingCoupon(null); setCouponForm({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true }); fetchData() }
      else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteCoupon = async (id: string) => {
    showConfirmDialog('حذف الكوبون', 'هل أنت متأكد من حذف هذا الكوبون؟', Trash2, 'text-red-500', async () => {
      try { const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف الكوبون' }); fetchData() } else { const data = await res.json().catch(() => ({})); toast({ title: 'خطأ', description: data.error || 'فشل الحذف', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    })
  }

  const handleToggleCouponStatus = async (coupon: any) => {
    try { const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !coupon.isActive }) }); if (res.ok) { toast({ title: coupon.isActive ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون' }); fetchData() } else { const data = await res.json().catch(() => ({})); toast({ title: 'خطأ', description: data.error || 'فشل التحديث', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Settings save ──────────────────────────────────────────
  const handleSaveSettings = async (data: any) => {
    try {
      const body = isSubAdmin ? { ...data, subAdminId: (user as any)?.id } : data
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast({ title: 'تم حفظ الإعدادات' }); fetchData() }
      else { const d = await res.json(); toast({ title: 'خطأ', description: d.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleSaveSubAdmin = async () => {
    if (!subAdminForm.name || !subAdminForm.phone || (!editingSubAdmin && !subAdminForm.password)) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' }); return
    }
    try {
      if (editingSubAdmin) {
        const body: any = { name: subAdminForm.name, phone: subAdminForm.phone, permissions: subAdminForm.permissions }
        if (subAdminForm.password) body.password = subAdminForm.password
        const res = await fetch(`/api/admin/sub-admins/${editingSubAdmin.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) { toast({ title: 'تم تحديث المسؤول الفرعي' }); setSubAdminDialog(false); fetchData() }
      } else {
        const res = await fetch('/api/admin/sub-admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: isSubAdmin ? (user as any)?.adminId : (user as any)?.id, ...subAdminForm }) })
        if (res.ok) { toast({ title: 'تم إضافة المسؤول الفرعي' }); setSubAdminDialog(false); fetchData() }
        else { const d = await res.json(); toast({ title: 'خطأ', description: d.error, variant: 'destructive' }) }
      }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteSubAdmin = async (id: string) => {
    showConfirmDialog('حذف المسؤول الفرعي', 'هل أنت متأكد من حذف هذا المسؤول الفرعي؟', Trash2, 'text-red-500', async () => {
      try { const res = await fetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف المسؤول الفرعي' }); fetchData() } else { const data = await res.json().catch(() => ({})); toast({ title: 'خطأ', description: data.error || 'فشل الحذف', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
    })
  }

  const handleBlockUnblockSubAdmin = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked'
    try {
      const res = await fetch(`/api/admin/sub-admins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      if (res.ok) { toast({ title: newStatus === 'blocked' ? 'تم حظر المسؤول الفرعي' : 'تم تفعيل المسؤول الفرعي' }); fetchData() }
      else { const d = await res.json(); toast({ title: 'خطأ', description: d.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Reset All Data ──────────────────────────────────────────
  const handleResetData = async () => {
    if (resetConfirmText !== 'حذف') { toast({ title: 'خطأ', description: 'يرجى كتابة "حذف" للتأكيد', variant: 'destructive' }); return }
    setResetLoading(true)
    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: (user as any)?.id, password: resetPassword }),
      })
      if (res.ok) {
        toast({ title: 'تم حذف جميع البيانات بنجاح', description: 'تم الاحتفاظ بحساب المدير فقط' })
        setResetDataDialog(false); setResetPassword(''); setResetConfirmText('')
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'فشل حذف البيانات', variant: 'destructive' })
      }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' }) }
    finally { setResetLoading(false) }
  }

  // ─── Geocoding & Haversine for Nearby Nurses ────────────────
  const geocodeWithTimeout = useCallback(async (address: string, timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> => {
    if (!address || address === 'غير محدد') return null
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=ar&limit=1`,
        { signal: controller.signal }
      )
      clearTimeout(timer)
      const data = await res.json()
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { /* silently fail - timeout or network error */ }
    return null
  }, [])

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Fetch nurse distances with a nurses array parameter (so it works even when nurses state is stale)
  const fetchNurseDistancesWithNurses = useCallback(async (beneficiaryLocation: string, nursesList: any[]) => {
    if (!beneficiaryLocation || beneficiaryLocation === 'غير محدد') { setNurseDistances({}); return }
    setGeocodingLoading(true)
    try {
      // First try to extract coordinates from the location string directly
      let benefCoords = extractCoordinates(beneficiaryLocation)
      // If no coordinates embedded, try geocoding the address with timeout
      if (!benefCoords) {
        benefCoords = await geocodeWithTimeout(beneficiaryLocation, 6000)
      }
      if (!benefCoords) { setNurseDistances({}); setGeocodingLoading(false); return }
      const distances: Record<string, number> = {}
      const approved = nursesList.filter((n: any) => n.status === 'approved')
      // Process nurses sequentially with rate limiting to avoid Nominatim blocking
      // First pass: quickly handle nurses that have embedded coordinates
      const needGeocoding: any[] = []
      for (const n of approved.slice(0, 20)) {
        const loc = n.location || ''
        const nurseCoords = extractCoordinates(loc)
        if (nurseCoords) {
          distances[n.id] = haversine(benefCoords.lat, benefCoords.lng, nurseCoords.lat, nurseCoords.lng)
        } else if (loc && loc !== 'غير محدد') {
          needGeocoding.push(n)
        }
      }
      // Update distances immediately for nurses with embedded coords
      if (Object.keys(distances).length > 0) {
        setNurseDistances(prev => ({ ...prev, ...distances }))
      }
      // Second pass: geocode remaining nurses one by one with delay (respect Nominatim rate limit)
      for (let i = 0; i < Math.min(needGeocoding.length, 8); i++) {
        const n = needGeocoding[i]
        if (i > 0) await new Promise(r => setTimeout(r, 1200)) // 1.2s delay between requests
        const geocodedCoords = await geocodeWithTimeout(n.location, 4000)
        if (geocodedCoords) {
          const dist = haversine(benefCoords.lat, benefCoords.lng, geocodedCoords.lat, geocodedCoords.lng)
          setNurseDistances(prev => ({ ...prev, [n.id]: dist }))
        }
      }
    } catch { setNurseDistances({}) }
    finally { setGeocodingLoading(false) }
  }, [geocodeWithTimeout])

  // Legacy wrapper that uses nurses state
  const fetchNurseDistances = useCallback(async (beneficiaryLocation: string) => {
    return fetchNurseDistancesWithNurses(beneficiaryLocation, nurses)
  }, [nurses, fetchNurseDistancesWithNurses])

  // Sorted nurses by proximity for the approve dialog
  const sortedNursesByProximity = useMemo(() => {
    const approved = nurses.filter(n => n.status === 'approved')
    if (Object.keys(nurseDistances).length === 0) return approved
    return [...approved].sort((a, b) => {
      const distA = nurseDistances[a.id] ?? Infinity
      const distB = nurseDistances[b.id] ?? Infinity
      return distA - distB
    })
  }, [nurses, nurseDistances])

  // ─── Computed data ──────────────────────────────────────────
  const approvedNurses = nurses.filter(n => n.status === 'approved')

  const filteredNurses = useMemo(() => nurses.filter(n => {
    const matchSearch = nurseSearch === '' || `${n.firstName} ${n.secondName} ${n.thirdName} ${n.lastName}`.includes(nurseSearch) || n.phone?.includes(nurseSearch) || n.nationalId?.includes(nurseSearch)
    const matchFilter = nurseFilter === 'all' || n.status === nurseFilter
    return matchSearch && matchFilter
  }), [nurses, nurseSearch, nurseFilter])

  const filteredBeneficiaries = useMemo(() => beneficiaries.filter((b: any) => beneficiarySearch === '' || b.name?.includes(beneficiarySearch) || b.phone?.includes(beneficiarySearch) || b.location?.includes(beneficiarySearch)), [beneficiaries, beneficiarySearch])

  const filteredRequests = useMemo(() => requests.filter((r: any) => {
    const matchSearch = requestSearch === '' || r.service?.name?.includes(requestSearch) || r.beneficiary?.name?.includes(requestSearch) || r.beneficiary?.phone?.includes(requestSearch) || r.notes?.includes(requestSearch)
    const matchStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter
    const matchService = requestServiceFilter === 'all' || r.serviceId === requestServiceFilter
    // Action filter: categorize requests by what action they need
    let matchAction = true
    if (requestActionFilter === 'needs_action') {
      matchAction = ['pending', 'pending_confirmation', 'pending_payment', 'approved'].includes(r.status)
    } else if (requestActionFilter === 'confirm_payment') {
      matchAction = r.status === 'pending_payment'
    } else if (requestActionFilter === 'accept') {
      matchAction = r.status === 'pending' || r.status === 'pending_confirmation'
    } else if (requestActionFilter === 'assign_nurse') {
      matchAction = r.status === 'approved'
    } else if (requestActionFilter === 'in_progress') {
      matchAction = r.status === 'in_progress'
    } else if (requestActionFilter === 'completed') {
      matchAction = r.status === 'completed'
    } else if (requestActionFilter === 'cancelled') {
      matchAction = r.status === 'cancelled' || r.status === 'rejected'
    }
    // 'all' shows everything
    return matchSearch && matchStatus && matchService && matchAction
  }), [requests, requestSearch, requestStatusFilter, requestServiceFilter, requestActionFilter])

  // Charts data - use real data from requests, not random
  const revenueChartData = useMemo(() => {
    if (!stats || requests.length === 0) {
      // Fallback: estimate distribution based on total revenue
      if (!stats) return []
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
      const base = stats.totalRevenue / 6
      return months.map((name, i) => ({ name, revenue: Math.round(base) }))
    }
    // Calculate actual monthly revenue from completed requests
    const monthMap: Record<string, number> = {}
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const now = new Date()
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const monthIdx = d.getMonth()
      monthMap[key] = 0
    }
    // Sum revenue per month from completed requests
    for (const r of requests) {
      if (r.status !== 'completed' && r.status !== 'paid') continue
      const d = parseTimestamp(r.createdAt || r.updatedAt)
      if (!d) continue
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key in monthMap) {
        monthMap[key] += r.dynamicPrice || r.price || r.service?.price || 0
      }
    }
    // Build chart data for last 6 months
    const result: Array<{ name: string; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      result.push({ name: monthNames[d.getMonth()], revenue: Math.round(monthMap[key] || 0) })
    }
    return result
  }, [stats, requests])

  const requestsByStatusData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'قيد الانتظار', value: stats.pendingRequests, color: '#f59e0b' },
      { name: 'مقبولة', value: stats.approvedRequests, color: '#10b981' },
      { name: 'مكتملة', value: stats.completedRequests, color: '#3b82f6' },
      { name: 'مرفوضة', value: Math.max(0, stats.totalRequests - stats.pendingRequests - stats.approvedRequests - stats.completedRequests), color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [stats])

  // Ratings computed
  const generalAverage = useMemo(() => {
    if (ratings.length === 0) return 0
    return ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length
  }, [ratings])

  const filteredNurseAverage = useMemo(() => {
    if (ratingsNurseFilter === 'all' || ratings.length === 0) return null
    const filtered = ratings.filter((r: any) => r.nurseId === ratingsNurseFilter)
    if (filtered.length === 0) return 0
    return filtered.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / filtered.length
  }, [ratings, ratingsNurseFilter])

  // ─── Tabs definition ───────────────────────────────────────
  const allTabs: { key: Tab; label: string; icon: any; badge?: number; perm?: string }[] = [
    { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, badge: emergencyRequests.filter((e: any) => e.status === 'pending').length || undefined },
    { key: 'services', label: 'الخدمات', icon: Wrench, perm: 'services' },
    { key: 'nurses', label: 'الممرضين', icon: Users, perm: 'nurses' },
    { key: 'beneficiaries', label: 'المستفيدين', icon: Heart, perm: 'beneficiaries' },
    { key: 'requests', label: 'الطلبات', icon: ClipboardList, perm: 'requests' },
    { key: 'emergency', label: 'الطوارئ', icon: AlertTriangle, badge: emergencyRequests.filter((e: any) => e.status === 'pending').length || undefined, perm: 'emergency' },
    { key: 'payments', label: 'المدفوعات', icon: CreditCard, perm: 'payments' },
    { key: 'coupons', label: 'الكوبونات', icon: Tag, perm: 'coupons' },
    { key: 'ratings', label: 'التقييمات', icon: Star, perm: 'ratings' },
    { key: 'complaints', label: 'الشكاوى', icon: FileWarning, perm: 'reports' },
    { key: 'activity', label: 'النشاط', icon: Activity, perm: 'reports' },
    { key: 'sub-admins', label: 'المدراء الفرعيين', icon: UserCog, perm: '__sub_admins__' },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  // Filter tabs based on sub-admin permissions
  const tabs = allTabs.filter(tab => {
    if (!isSubAdmin) return true // Main admin sees everything
    if (!tab.perm) return true // Always show dashboard, settings
    if (tab.perm === '__sub_admins__') return false // Sub-admins cannot see sub-admins tab
    return hasPermission(tab.perm)
  })

  const handleTabChange = (tab: Tab) => { setActiveTab(tab); setMobileMenuOpen(false) }
  const toggleRequestSelection = (id: string) => setSelectedRequestIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // ─── Render Stars ───────────────────────────────────────────
  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
    </div>
  )

  // ─── JSX ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-bl from-slate-50 via-amber-50/20 to-orange-50/10 flex relative overflow-hidden" dir="rtl">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="w-72 bg-white/70 backdrop-blur-xl border-l border-amber-100/50 shadow-xl shadow-amber-900/5 hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        <div className="p-6 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-amber-100 text-xs">{isSubAdmin ? 'لوحة تحكم المدير الفرعي' : 'لوحة تحكم الإدارة'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.key ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25' : 'text-gray-600 hover:bg-amber-50/80 hover:text-amber-700'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{tab.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-amber-100/50 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-amber-50/80 cursor-pointer transition-all duration-200" onClick={() => { setEditName((user as any)?.name || ''); setEditPhone((user as any)?.phone || ''); setEditEmail((user as any)?.email || ''); setEditNameDialog(true) }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25"><Shield className="w-5 h-5 text-white" /></div>
            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{(user as any)?.name || 'المدير'}</p><p className="text-gray-400 text-xs">{isSubAdmin ? 'مدير فرعي' : 'مدير النظام'}</p></div>
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={handleLogout}><LogOut className="w-4 h-4 ml-2" />تسجيل الخروج</Button>
        </div>
      </aside>

      {/* ─── Mobile Menu Overlay ─── */}
      {mobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setMobileMenuOpen(false)} />}

      {/* ─── Mobile Sidebar ─── */}
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-white/90 backdrop-blur-xl z-50 transform transition-transform duration-300 shadow-2xl ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 flex items-center justify-between">
          <div className="flex items-center gap-2"><Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" /><h2 className="text-lg font-bold text-white">عافيتك</h2></div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.key ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25' : 'text-gray-600 hover:bg-amber-50/80'}`}>
              <tab.icon className="w-5 h-5" />{tab.label}
              {tab.badge && tab.badge > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-auto">{tab.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-100/50 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 p-2 cursor-pointer" onClick={() => { setEditName((user as any)?.name || ''); setEditPhone((user as any)?.phone || ''); setEditEmail((user as any)?.email || ''); setEditNameDialog(true); setMobileMenuOpen(false) }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <div><p className="font-medium text-sm">{(user as any)?.name || 'المدير'}</p><p className="text-gray-400 text-xs">مدير النظام</p></div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50" onClick={handleLogout}><LogOut className="w-4 h-4 ml-2" />تسجيل الخروج</Button>
        </div>
      </div>

      {/* ─── Mobile Header ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-amber-100/50 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">عافيتك</span>
        </div>
        <div className="flex items-center gap-2">
          {emergencyRequests.filter((e: any) => e.status === 'pending').length > 0 && (
            <Button variant="ghost" size="sm" className="relative" onClick={() => setActiveTab('emergency')}><AlertTriangle className="w-4 h-4 text-red-500" /><span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{emergencyRequests.filter((e: any) => e.status === 'pending').length}</span></Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 text-red-500" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}><Menu className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <main className="flex-1 lg:mr-72 overflow-y-auto relative z-10">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /><div className="absolute inset-0 w-10 h-10 animate-ping opacity-20"><Loader2 className="w-10 h-10 text-orange-500" /></div></div>
              </div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

                {/* ═══════════════════════════════════════════════════
                    TAB 1: الرئيسية (Dashboard)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">لوحة التحكم</h1>
                      <p className="text-gray-500 text-sm mt-1">نظرة عامة على النظام</p>
                    </div>

                    {/* Pending Actions Banner */}
                    {(() => {
                      const pendingItems = [
                        { key: 'emergency', count: stats.pendingEmergency || emergencyRequests.filter((e: any) => e.status === 'pending').length, label: 'طلب طوارئ', plural: 'طلبات طوارئ', gradient: 'from-red-500 to-rose-600', icon: AlertTriangle, tab: 'emergency' as Tab },
                        { key: 'unverified', count: stats.unverifiedNurses || 0, label: 'توثيق ممرض', plural: 'توثيق ممرضين', gradient: 'from-amber-500 to-orange-500', icon: BadgeCheck, tab: 'nurses' as Tab },
                        { key: 'pendingNurses', count: stats.pendingNurses || 0, label: 'موافقة ممرض', plural: 'موافقة ممرضين', gradient: 'from-yellow-500 to-amber-500', icon: UserPlus, tab: 'nurses' as Tab },
                        { key: 'pendingRequests', count: stats.allPendingRequests || stats.pendingRequests || 0, label: 'طلب خدمة', plural: 'طلبات خدمات', gradient: 'from-blue-500 to-indigo-500', icon: ClipboardList, tab: 'requests' as Tab },
                        { key: 'paymentConfirm', count: stats.pendingPaymentConfirmations || 0, label: 'تأكيد دفع', plural: 'تأكيدات دفع', gradient: 'from-emerald-500 to-teal-500', icon: Receipt, tab: 'requests' as Tab },
                        { key: 'complaints', count: stats.pendingComplaints || 0, label: 'شكوى/بلاغ', plural: 'شكاوى وبلاغات', gradient: 'from-purple-500 to-fuchsia-500', icon: MessageSquare, tab: 'complaints' as Tab },
                      ].filter(item => item.count > 0)
                      const totalPending = pendingItems.reduce((sum, item) => sum + item.count, 0)

                      if (totalPending === 0) return (
                        <motion.div variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg shadow-emerald-500/15 bg-gradient-to-l from-emerald-50 via-green-50 to-teal-50 ring-1 ring-emerald-200/50">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-emerald-700">لا توجد إجراءات معلقة</p>
                                <p className="text-emerald-600/60 text-xs">جميع المهام مكتملة</p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )

                      return (
                        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-3">
                          {/* Summary Banner */}
                          <Card className="border-0 shadow-xl shadow-amber-500/15 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-28 h-28 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
                            <CardContent className="p-5 relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse shadow-lg">
                                  <Bell className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-xl">{totalPending} إجراء معلق</p>
                                  <p className="text-amber-100 text-sm">يتطلب اهتمامك ومراجعتك</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Action Cards Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {pendingItems.map((item) => {
                              const Icon = item.icon
                              return (
                                <motion.button
                                  key={item.key}
                                  whileHover={{ y: -3, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setActiveTab(item.tab)}
                                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 text-right"
                                >
                                  {/* Top gradient accent */}
                                  <div className={`h-1.5 bg-gradient-to-l ${item.gradient}`} />
                                  <div className="p-3.5">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md mb-2.5 group-hover:scale-110 transition-transform`}>
                                      <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-800 mb-0.5">{item.count}</p>
                                    <p className="text-[11px] font-bold text-gray-500 leading-tight">
                                      {item.count === 1 ? item.label : item.plural}
                                    </p>
                                  </div>
                                  {/* Hover overlay */}
                                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الممرضين', value: stats.totalNurses, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20', icon: Users },
                        { label: 'ممرضين معتمدين', value: stats.approvedNurses, gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20', icon: CheckCircle },
                        { label: 'بانتظار الموافقة', value: stats.pendingNurses, gradient: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/20', icon: Loader2 },
                        { label: 'المستفيدون', value: stats.totalBeneficiaries, gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20', icon: Heart },
                        { label: 'الخدمات', value: stats.totalServices, gradient: 'from-purple-400 to-fuchsia-500', shadow: 'shadow-purple-500/20', icon: Wrench },
                        { label: 'خدمات نشطة', value: stats.activeServices, gradient: 'from-green-400 to-emerald-500', shadow: 'shadow-green-500/20', icon: CheckCircle },
                        { label: 'طلبات بانتظار المراجعة', value: stats.pendingRequests, gradient: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/20', icon: ClipboardList },
                        { label: 'طلبات مكتملة', value: stats.completedRequests, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20', icon: CheckCircle },
                      ].map((item, i) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05, duration: 0.4 }} whileHover={{ y: -4 }}>
                          <Card className={`border-0 shadow-lg ${item.shadow} hover:shadow-xl transition-all duration-300 overflow-hidden relative group`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                            <CardContent className="p-4 relative z-10">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}><item.icon className="w-5 h-5 text-white" /></div>
                                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                              </div>
                              <p className={`text-3xl font-black bg-gradient-to-l ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Revenue Card */}
                    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4, duration: 0.4 }}>
                      <Card className="border-0 shadow-xl shadow-amber-500/25 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center gap-3 mb-1"><Sparkles className="w-5 h-5 text-amber-200" /><p className="text-amber-100 text-sm">إجمالي الإيرادات</p></div>
                          <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5, duration: 0.4 }}>
                        <Card className="border-0 shadow-lg shadow-amber-500/10 overflow-hidden">
                          <CardHeader className="pb-2"><CardTitle className="text-lg">الإيرادات الشهرية</CardTitle></CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
                                  <XAxis dataKey="name" fontSize={12} />
                                  <YAxis fontSize={12} />
                                  <RTooltip formatter={(value: number) => formatPrice(value)} />
                                  <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient></defs>
                                  <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6, duration: 0.4 }}>
                        <Card className="border-0 shadow-lg shadow-amber-500/10 overflow-hidden">
                          <CardHeader className="pb-2"><CardTitle className="text-lg">الطلبات حسب الحالة</CardTitle></CardHeader>
                          <CardContent>
                            <div className="h-64 flex items-center justify-center">
                              {requestsByStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <defs>{requestsByStatusData.map((_, index) => (<linearGradient key={index} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={1} /><stop offset="100%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={0.7} /></linearGradient>))}</defs>
                                    <Pie data={requestsByStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                                      {requestsByStatusData.map((_, index) => <Cell key={index} fill={`url(#pieGrad${index})`} />)}
                                    </Pie>
                                    <RTooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : <p className="text-gray-400 text-sm">لا توجد بيانات</p>}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Recent Activity */}
                    {activityLogs.length > 0 && (
                      <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7, duration: 0.4 }}>
                        <Card className="border-0 shadow-lg shadow-amber-500/10 overflow-hidden">
                          <CardHeader className="pb-2"><CardTitle className="text-lg">آخر النشاطات</CardTitle></CardHeader>
                          <CardContent className="max-h-64 overflow-y-auto">
                            {activityLogs.map((log: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 py-2 border-b border-amber-50 last:border-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0"><Activity className="w-4 h-4 text-white" /></div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{log.description}</p><p className="text-xs text-gray-400">{log.userName} • {formatDateTime(log.createdAt)}</p></div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 2: الخدمات (Services)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'services' && (() => {
                  const categories = [...new Set(services.map((s: any) => s.category).filter(Boolean))]
                  const filteredServices = serviceCategoryFilter === 'all' ? services : services.filter((s: any) => s.category === serviceCategoryFilter)
                  const categoryIcons: Record<string, string> = {
                    'قياسات وتحاليل': '🩺', 'حقن وإبر': '💉', 'عناية بالجروح': '🩹',
                    'تمريض منزلي': '🏠', 'إسعافات أولية': '🚑', 'عناية بالمريض': '💊',
                    'صحة المرأة': '👩‍⚕️', 'استشارات ومتابعة': '📋', 'رعاية الأطفال': '👶',
                    'عام': '⚙️',
                  }
                  return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الخدمات</h1><p className="text-gray-500 text-sm mt-1">إضافة وتعديل وحذف الخدمات ({services.length} خدمة)</p></div>
                      <div className="flex gap-2 flex-wrap">
                        {services.length === 0 && (
                          <Button className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300" disabled={seedServicesLoading} onClick={() => handleSeedServices(false)}>
                            {seedServicesLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                            إضافة خدمات افتراضية
                          </Button>
                        )}
                        {services.length > 0 && (
                          <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50" disabled={seedServicesLoading} onClick={() => showConfirmDialog('إعادة تعبئة الخدمات', 'سيتم حذف جميع الخدمات الحالية وإضافة الخدمات الافتراضية بدلاً عنها. هل أنت متأكد؟', Sparkles, 'text-emerald-500', () => handleSeedServices(true))}>
                            {seedServicesLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                            إعادة تعبئة الخدمات
                          </Button>
                        )}
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300" onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', category: 'قياسات وتحاليل', isActive: true }); setServiceDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة خدمة</Button>
                      </div>
                    </div>
                    {/* Category filter */}
                    {categories.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setServiceCategoryFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${serviceCategoryFilter === 'all' ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25' : 'bg-white/70 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'}`}>الكل ({services.length})</button>
                        {categories.map(cat => (
                          <button key={cat} onClick={() => setServiceCategoryFilter(cat)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${serviceCategoryFilter === cat ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25' : 'bg-white/70 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'}`}>
                            {categoryIcons[cat] || ''} {cat} ({services.filter((s: any) => s.category === cat).length})
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredServices.map((svc: any) => (
                        <motion.div key={svc.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                            <CardContent className="p-4 relative z-10">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md text-lg">{categoryIcons[svc.category] || <Wrench className="w-5 h-5 text-white" />}</div><div><p className="font-bold">{svc.name}</p><Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 border mt-0.5">{svc.category}</Badge></div></div>
                                <Badge className={`${getStatusColor(svc.isActive ? 'active' : 'suspended')} border text-xs`}>{svc.isActive ? 'نشطة' : 'معطلة'}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{svc.description}</p>
                              <p className="text-lg font-bold bg-gradient-to-l from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">{formatPrice(svc.price)}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingService(svc); setServiceForm({ name: svc.name, description: svc.description, price: String(svc.price), category: svc.category || 'عام', isActive: svc.isActive }); setServiceDialog(true) }}><Pencil className="w-3.5 h-3.5 ml-1" />تعديل</Button>
                                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteService(svc.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {services.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                          <Wrench className="w-10 h-10 text-amber-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-600 mb-2">لا توجد خدمات</p>
                        <p className="text-sm text-gray-400 mb-4">اضغط على زر "إضافة خدمات افتراضية" لإضافة أكثر من 55 خدمة صحية جاهزة</p>
                      </div>
                    )}
                    {services.length > 0 && filteredServices.length === 0 && (
                      <div className="text-center py-8"><p className="text-gray-400">لا توجد خدمات في هذا التصنيف</p></div>
                    )}
                  </div>
                  )
                })()}

                {/* ═══════════════════════════════════════════════════
                    TAB 3: الممرضين (Nurses)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'nurses' && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الممرضين</h1><p className="text-gray-500 text-sm mt-1">قبول ورفض وحظر وإدارة الممرضين</p></div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الممرضين', value: nurses.length, gradient: 'from-amber-400 to-orange-500', icon: Users },
                        { label: 'بانتظار الموافقة', value: nurses.filter((n: any) => n.status === 'pending').length, gradient: 'from-yellow-400 to-amber-500', icon: Clock },
                        { label: 'معتمدين', value: nurses.filter((n: any) => n.status === 'approved').length, gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                        { label: 'محظورين', value: nurses.filter((n: any) => n.status === 'blocked').length, gradient: 'from-red-400 to-rose-500', icon: Ban },
                      ].map((item, i) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05, duration: 0.4 }}>
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}><item.icon className="w-5 h-5 text-white" /></div>
                                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                              </div>
                              <p className={`text-2xl font-bold bg-gradient-to-l ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="بحث بالاسم أو الهاتف أو الرقم الوطني..." value={nurseSearch} onChange={e => setNurseSearch(e.target.value)} className="pr-9 border-amber-200 rounded-xl" /></div>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { key: 'all', label: 'الكل', count: nurses.length },
                          { key: 'pending', label: 'بانتظار الموافقة', count: nurses.filter((n: any) => n.status === 'pending').length },
                          { key: 'approved', label: 'معتمد', count: nurses.filter((n: any) => n.status === 'approved').length },
                          { key: 'rejected', label: 'مرفوض', count: nurses.filter((n: any) => n.status === 'rejected').length },
                          { key: 'blocked', label: 'محظور', count: nurses.filter((n: any) => n.status === 'blocked').length },
                        ].map(filter => (
                          <button key={filter.key} onClick={() => setNurseFilter(filter.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                              nurseFilter === filter.key
                                ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25'
                                : 'bg-white/70 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'
                            }`}
                          >
                            {filter.label} {filter.count > 0 && <span className="opacity-75">({filter.count})</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nurse Cards */}
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                      {filteredNurses.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-amber-400" />
                          </div>
                          <p className="text-lg font-bold text-gray-600 mb-2">لا يوجد ممرضين</p>
                          <p className="text-sm text-gray-400">لا توجد نتائج مطابقة للبحث</p>
                        </div>
                      ) : (
                        filteredNurses.map((n: any, index: number) => {
                          const statusConfig: Record<string, { gradient: string; border: string; bg: string; shadow: string; label: string }> = {
                            pending: { gradient: 'from-yellow-500 to-amber-500', border: 'border-r-yellow-400', bg: 'from-yellow-50/50 to-amber-50/50', shadow: 'shadow-yellow-500/10', label: 'بانتظار الموافقة' },
                            approved: { gradient: 'from-emerald-500 to-teal-500', border: 'border-r-emerald-400', bg: 'from-emerald-50/30 to-teal-50/30', shadow: 'shadow-emerald-500/10', label: 'معتمد' },
                            rejected: { gradient: 'from-red-500 to-rose-500', border: 'border-r-red-400', bg: 'from-red-50/30 to-rose-50/30', shadow: 'shadow-red-500/10', label: 'مرفوض' },
                            blocked: { gradient: 'from-gray-500 to-slate-500', border: 'border-r-gray-400', bg: 'from-gray-50/50 to-slate-50/50', shadow: 'shadow-gray-500/10', label: 'محظور' },
                          }
                          const cfg = statusConfig[n.status] || statusConfig.pending
                          const isExpired = n.licenseExpiryDate && new Date(n.licenseExpiryDate) < new Date()

                          return (
                            <motion.div key={n.id} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.03 }}>
                              <Card className={`border-0 shadow-lg ${cfg.shadow} hover:shadow-xl transition-all duration-300 border-r-4 ${cfg.border} overflow-hidden`}>
                                <CardContent className="p-0">
                                  {/* Top Section: Name + Status + Actions */}
                                  <div className="p-4 pb-3">
                                    <div className="flex items-start gap-4">
                                      {/* Avatar */}
                                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                                        <span className="text-white font-bold text-xl">{(n.firstName || '?').charAt(0)}</span>
                                      </div>
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-bold text-lg truncate">{n.firstName} {n.secondName} {n.thirdName} {n.lastName}</h3>
                                          <Badge className={`bg-gradient-to-l ${cfg.gradient} text-white border-0 text-[10px] font-bold px-2 py-0.5`}>{cfg.label}</Badge>
                                          {n.isVerified ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />موثّق</Badge>
                                          ) : (
                                            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />غير موثّق</Badge>
                                          )}
                                          {isExpired && <Badge className="bg-gradient-to-l from-red-500 to-rose-500 text-white border-0 text-[10px] font-bold px-2 py-0.5"><AlertTriangle className="w-3 h-3 ml-0.5" />ترخيص منتهي</Badge>}
                                        </div>
                                        {/* Quick Info Row */}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{n.phone}</span>
                                          {n.location && n.location !== 'غير محدد' ? (
                                            <button onClick={() => showMapPreview(n.location)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate max-w-[150px]">{getDisplayLocation(n.location)}</span></button>
                                          ) : (
                                            <span className="flex items-center gap-1 text-gray-400"><MapPin className="w-3.5 h-3.5" />غير محدد</span>
                                          )}
                                        </div>
                                      </div>
                                      {/* Actions */}
                                      <div className="flex gap-2 shrink-0 flex-wrap">
                                        <Button size="sm" variant="outline" className="rounded-xl border-amber-200 hover:bg-amber-50" onClick={() => setNurseDetail(n)}><Eye className="w-3.5 h-3.5 ml-1" />التفاصيل</Button>
                                        {n.status === 'pending' && (
                                          <>
                                            <Button size="sm" className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleNurseAction(n.id, 'approved')}><CheckCircle className="w-3.5 h-3.5 ml-1" />قبول</Button>
                                            <Button size="sm" className="bg-gradient-to-l from-red-500 to-rose-500 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => handleNurseAction(n.id, 'rejected')}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button>
                                          </>
                                        )}
                                        {n.status === 'approved' && <Button size="sm" variant="outline" className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleNurseAction(n.id, 'blocked')}><Ban className="w-3.5 h-3.5 ml-1" />حظر</Button>}
                                        {n.status === 'blocked' && <Button size="sm" className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25" onClick={() => handleNurseAction(n.id, 'approved')}><Unlock className="w-3.5 h-3.5 ml-1" />إلغاء الحظر</Button>}
                                        <Button size="sm" variant="ghost" className="rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ type: 'nurse', id: n.id, name: `${n.firstName} ${n.lastName}` })}><Trash2 className="w-3.5 h-3.5" /></Button>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Bottom Section: License Info */}
                                  <div className={`px-4 py-3 bg-gradient-to-l ${cfg.bg} border-t border-gray-100/50`}>
                                    <div className="flex items-center gap-6 text-xs text-gray-500 flex-wrap">
                                      <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-500" />ترخيص: <span className="font-semibold text-gray-700">{n.licenseNumber || 'غير محدد'}</span></span>
                                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-500" />الرقم الوطني: <span className="font-semibold text-gray-700">{n.nationalId || 'غير محدد'}</span></span>
                                      <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500 font-bold' : ''}`}><Calendar className="w-3.5 h-3.5" />انتهاء الترخيص: <span className={isExpired ? 'text-red-600 font-bold' : 'font-semibold text-gray-700'}>{formatDate(n.licenseExpiryDate)}</span></span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 4: المستفيدين (Beneficiaries)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'beneficiaries' && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة المستفيدين</h1><p className="text-gray-500 text-sm mt-1">عرض وإدارة حسابات المستفيدين</p></div>
                    <div className="relative"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="بحث بالاسم أو الهاتف أو الموقع..." value={beneficiarySearch} onChange={e => setBeneficiarySearch(e.target.value)} className="pr-9 border-amber-200" /></div>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                      {filteredBeneficiaries.map((b: any) => (
                        <motion.div key={b.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md shrink-0"><Heart className="w-6 h-6 text-white" /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap"><p className="font-bold">{b.name}</p><Badge className={`${getStatusColor(b.status || 'active')} border text-xs`}>{getStatusLabel(b.status || 'active')}</Badge></div>
                                  <p className="text-sm text-gray-500 mt-1">{b.phone} • {b.location && b.location !== 'غير محدد' ? <button onClick={() => showMapPreview(b.location)} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors inline-flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{getDisplayLocation(b.location)}</button> : 'غير محدد'}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button size="sm" variant="outline" onClick={() => { setBeneficiaryDetail(b); setBeneficiaryRequests(requests.filter((r: any) => r.beneficiaryId === b.id)) }}><Eye className="w-3.5 h-3.5" /></Button>
                                  {b.status !== 'blocked' ? (
                                    <Button size="sm" variant="outline" className="text-orange-500 hover:bg-orange-50" onClick={() => handleBeneficiaryAction(b.id, 'blocked')}><Ban className="w-3.5 h-3.5 ml-1" />حظر</Button>
                                  ) : (
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleBeneficiaryAction(b.id, 'active')}><Unlock className="w-3.5 h-3.5 ml-1" />إلغاء الحظر</Button>
                                  )}
                                  <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget({ type: 'beneficiary', id: b.id, name: b.name })}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {filteredBeneficiaries.length === 0 && <div className="text-center py-16"><Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا يوجد مستفيدين</p></div>}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 5: الطلبات (Requests) - REDESIGNED
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الطلبات</h1><p className="text-gray-500 text-sm mt-1">مراجعة ومعالجة الطلبات</p></div>
                      <div className="flex gap-2 items-center">
                        {selectedRequestIds.length > 0 && <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={handleBulkApprove}><CheckCircle className="w-4 h-4 ml-2" />قبول المحدد ({selectedRequestIds.length})</Button>}
                      </div>
                    </div>

                    {/* ===== ACTION TABS - Smart Classification ===== */}
                    {(() => {
                      const pendingConfirm = requests.filter((r: any) => r.status === 'pending_payment').length
                      const pendingAccept = requests.filter((r: any) => r.status === 'pending' || r.status === 'pending_confirmation').length
                      const pendingAssign = requests.filter((r: any) => r.status === 'approved').length
                      const inProgressCount = requests.filter((r: any) => r.status === 'in_progress').length
                      const completedCount = requests.filter((r: any) => r.status === 'completed').length
                      const cancelledCount = requests.filter((r: any) => r.status === 'cancelled' || r.status === 'rejected').length
                      const totalNeedsAction = pendingConfirm + pendingAccept + pendingAssign

                      const actionTabs = [
                        { key: 'needs_action', label: 'يحتاج إجراء', count: totalNeedsAction, icon: AlertTriangle, gradient: 'from-amber-500 to-orange-500', activeBg: 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500' },
                        { key: 'confirm_payment', label: 'تأكيد دفع', count: pendingConfirm, icon: CreditCard, gradient: 'from-emerald-500 to-teal-500', activeBg: 'bg-gradient-to-l from-emerald-500 to-teal-500' },
                        { key: 'accept', label: 'بانتظار القبول', count: pendingAccept, icon: CheckCircle, gradient: 'from-amber-400 to-orange-500', activeBg: 'bg-gradient-to-l from-amber-400 via-orange-500 to-rose-500' },
                        { key: 'assign_nurse', label: 'تعيين ممرض', count: pendingAssign, icon: UserPlus, gradient: 'from-blue-500 to-indigo-500', activeBg: 'bg-gradient-to-l from-blue-500 to-indigo-500' },
                        { key: 'in_progress', label: 'قيد التنفيذ', count: inProgressCount, icon: Clock, gradient: 'from-cyan-500 to-teal-500', activeBg: 'bg-gradient-to-l from-cyan-500 to-teal-500' },
                        { key: 'completed', label: 'مكتمل', count: completedCount, icon: CheckCircle, gradient: 'from-emerald-400 to-green-500', activeBg: 'bg-gradient-to-l from-emerald-400 to-green-500' },
                        { key: 'cancelled', label: 'ملغي/مرفوض', count: cancelledCount, icon: XCircle, gradient: 'from-gray-400 to-gray-500', activeBg: 'bg-gradient-to-l from-gray-400 to-gray-500' },
                        { key: 'all', label: 'الكل', count: requests.length, icon: ClipboardList, gradient: 'from-violet-400 to-fuchsia-500', activeBg: 'bg-gradient-to-l from-violet-400 to-fuchsia-500' },
                      ]

                      return (
                        <div className="space-y-4">
                          {/* Urgent Summary Bar */}
                          {totalNeedsAction > 0 && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                              <Card className="border-0 shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-l from-red-500 via-orange-500 to-amber-500 p-4 text-white relative">
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12)_0%,transparent_50%)]" />
                                  <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse shadow-lg">
                                      <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-lg">{totalNeedsAction} طلب يحتاج إجراء</p>
                                      <p className="text-red-100 text-sm">
                                        {pendingConfirm > 0 && `${pendingConfirm} تأكيد دفع • `}
                                        {pendingAccept > 0 && `${pendingAccept} بانتظار القبول • `}
                                        {pendingAssign > 0 && `${pendingAssign} تعيين ممرض`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {/* Quick Action Cards */}
                                <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
                                  {[
                                    { count: pendingConfirm, label: 'تأكيد دفع', icon: CreditCard, gradient: 'from-emerald-500 to-teal-500', filter: 'confirm_payment' },
                                    { count: pendingAccept, label: 'قبول طلب', icon: CheckCircle, gradient: 'from-amber-500 to-orange-500', filter: 'accept' },
                                    { count: pendingAssign, label: 'تعيين ممرض', icon: UserPlus, gradient: 'from-blue-500 to-indigo-500', filter: 'assign_nurse' },
                                  ].map(item => (
                                    <button
                                      key={item.filter}
                                      onClick={() => setRequestActionFilter(item.filter)}
                                      className={`p-4 hover:bg-gray-50 transition-colors ${requestActionFilter === item.filter ? 'bg-violet-50/50' : ''}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md shrink-0`}>
                                          <item.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-right">
                                          <p className="text-2xl font-black text-gray-800">{item.count}</p>
                                          <p className="text-xs font-bold text-gray-500">{item.label}</p>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </Card>
                            </motion.div>
                          )}

                          {/* Tab Pills */}
                          <div className="flex gap-2 flex-wrap">
                            {actionTabs.map(tab => {
                              const Icon = tab.icon
                              const isActive = requestActionFilter === tab.key
                              return (
                                <button
                                  key={tab.key}
                                  onClick={() => setRequestActionFilter(tab.key)}
                                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                    isActive
                                      ? `${tab.activeBg} text-white shadow-lg`
                                      : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  {tab.label}
                                  {tab.count > 0 && (
                                    <span className={`min-w-[18px] h-4 px-1 rounded-full text-[10px] flex items-center justify-center font-black ${
                                      isActive ? 'bg-white/25' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {tab.count}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Search & Service Filter */}
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="بحث بالاسم أو الخدمة..." value={requestSearch} onChange={e => setRequestSearch(e.target.value)} className="pr-9 border-amber-200 rounded-xl" /></div>
                      <Select value={requestServiceFilter} onValueChange={setRequestServiceFilter}><SelectTrigger className="w-40 border-amber-200 rounded-xl"><SelectValue placeholder="الخدمة" /></SelectTrigger><SelectContent><SelectItem value="all">كل الخدمات</SelectItem>{services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {filteredRequests.map((r: any) => (
                        <motion.div key={r.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${r.isEmergency ? 'ring-2 ring-red-400' : ''}`}>
                            {/* Status gradient left border */}
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${
                              r.status === 'pending' || r.status === 'pending_confirmation' ? 'bg-gradient-to-b from-amber-400 to-orange-500' :
                              r.status === 'pending_payment' ? 'bg-gradient-to-b from-orange-400 to-red-500' :
                              r.status === 'approved' ? 'bg-gradient-to-b from-blue-400 to-indigo-500' :
                              r.status === 'in_progress' ? 'bg-gradient-to-b from-cyan-400 to-teal-500' :
                              r.status === 'completed' ? 'bg-gradient-to-b from-emerald-400 to-green-500' :
                              r.status === 'rejected' || r.status === 'cancelled' ? 'bg-gradient-to-b from-red-400 to-rose-500' :
                              'bg-gray-300'
                            }`} />
                            <CardContent className="p-4 relative">
                              <div className="flex items-start gap-3">
                                {(r.status === 'pending' || r.status === 'pending_confirmation') && (
                                  <button onClick={() => toggleRequestSelection(r.id)} className="mt-1 shrink-0">
                                    {selectedRequestIds.includes(r.id) ? <CheckCircle className="w-5 h-5 text-amber-500" /> : <div className="w-5 h-5 rounded border-2 border-gray-300" />}
                                  </button>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold">{r.isMultiService && r.services ? r.services.map((s: any) => s.name).join(' + ') : (r.service?.name || 'خدمة غير محددة')}</p>
                                    {r.isMultiService && r.services && r.services.length > 1 && (
                                      <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] px-1.5 py-0">{r.services.length} خدمات</Badge>
                                    )}
                                    <Badge className={`${getStatusColor(r.status)} border text-xs font-bold px-2.5 py-0.5`}>{getStatusLabel(r.status)}</Badge>
                                    {r.isEmergency && <Badge className="bg-red-500 text-white border-0 text-xs animate-pulse"><AlertTriangle className="w-3 h-3 ml-1" />طوارئ</Badge>}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">المستفيد: {r.beneficiary?.name || 'غير محدد'} {r.beneficiary?.phone && `• ${r.beneficiary.phone}`}</p>
                                  {(r.address || r.beneficiary?.location) && (
                                    <button onClick={() => showMapPreview(r.address || r.beneficiary?.location || '')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 transition-colors">
                                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{getDisplayLocation(r.address || r.beneficiary?.location || '')}</span>
                                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">فتح الخريطة</span>
                                    </button>
                                  )}
                                  {r.assignment?.nurse && <p className="text-sm text-emerald-600">الممرض: {r.assignment.nurse.firstName} {r.assignment.nurse.lastName}</p>}
                                  {r.paymentMethod && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    {r.paymentMethod === 'wallet-deposit' ? 'إيداع محفظة' : r.paymentMethod === 'exchange-transfer' ? 'تحويل صراف' : r.paymentMethod === 'bank-transfer' ? 'تحويل بنكي' : r.paymentMethod === 'cash' ? 'نقدي عند الاستلام' : r.paymentMethod}
                                    {r.paymentStatus && <Badge className={`text-[10px] px-1 py-0 border-0 ${r.paymentStatus === 'cash_on_delivery' ? 'bg-amber-100 text-amber-700' : r.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{getStatusLabel(r.paymentStatus)}</Badge>}
                                  </p>}
                                  {r.notes && <p className="text-sm text-gray-400 mt-1">{r.notes}</p>}
                                  {/* Time & Date Info */}
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDateTime(r.createdAt)}
                                    </span>
                                    {r.updatedAt && (() => {
                                      const getSec = (t: any) => typeof t === 'object' && t !== null ? (t.seconds ?? t._seconds ?? 0) : 0
                                      return getSec(r.updatedAt) !== getSec(r.createdAt) || ((r.updatedAt?.nanoseconds ?? 0) !== (r.createdAt?.nanoseconds ?? 0))
                                    })() && (
                                      <span className="text-xs text-blue-400 flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        آخر تحديث: {formatDateTime(r.updatedAt)}
                                      </span>
                                    )}
                                    {(r.dynamicPrice || r.service?.price) && (
                                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {formatPrice(r.dynamicPrice || r.service?.price || 0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {r.status === 'pending' && (<><Button size="sm" className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={() => handleRequestAction(r.id, 'approved')}><CheckCircle className="w-3.5 h-3.5 ml-1" />قبول</Button><Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleRequestAction(r.id, 'rejected')}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button></>)}
                                  {r.status === 'pending_confirmation' && (<><Button size="sm" className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={() => handleRequestAction(r.id, 'approved')}><CheckCircle className="w-3.5 h-3.5 ml-1" />قبول</Button><Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleRequestAction(r.id, 'rejected')}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button></>)}
                                  {r.status === 'pending_payment' && (<>
                                    <div className="flex flex-col gap-2">
                                      <Badge className="bg-orange-100 text-orange-700 border border-orange-300 text-xs w-fit">بانتظار الدفع</Badge>
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-gray-500">المبلغ:</span>
                                        <span className="font-bold text-emerald-600">{formatPrice(r.dynamicPrice || r.service?.price || r.totalPrice || 0)}</span>
                                      </div>
                                    </div>
                                    <Button size="sm" className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25" onClick={() => showConfirmDialog('تأكيد الدفع', `هل أنت متأكد من تأكيد استلام الدفع لهذا الطلب بمبلغ ${formatPrice(r.dynamicPrice || r.service?.price || r.totalPrice || 0)}؟ سيتم تحويل حالة الطلب إلى "بانتظار القبول" ويمكن بعدها قبول الطلب وتعيين ممرض.`, CheckCircle, 'text-emerald-500', () => handleConfirmRequestPayment(r.id))}><CheckCircle className="w-3.5 h-3.5 ml-1" />تأكيد الدفع</Button>
                                  </>)}
                                  {r.status === 'approved' && <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOpenApproveDialog(r)}><UserPlus className="w-3.5 h-3.5 ml-1" />تعيين ممرض</Button>}
                                  {r.status === 'in_progress' && <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={async () => { try { const res = await fetch(`/api/admin/requests/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }); if (res.ok) { try { await fetch(`/api/chat?requestId=${r.id}`, { method: 'DELETE' }) } catch {} toast({ title: 'تم إكمال الطلب' }); fetchData() } else { toast({ title: 'خطأ', description: 'فشل إكمال الطلب', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) } }}><CheckCircle className="w-3.5 h-3.5 ml-1" />إكمال</Button>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {filteredRequests.length === 0 && <div className="text-center py-16"><ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا توجد طلبات</p></div>}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 5.5: الطوارئ (Emergency)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'emergency' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-l from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">طلبات الطوارئ</h1>
                      <p className="text-gray-500 text-sm mt-1">الطلبات العاجلة التي تتطلب اهتمام فوري</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الطلبات', value: emergencyRequests.length, gradient: 'from-red-400 to-orange-500', icon: AlertTriangle },
                        { label: 'بانتظار المعالجة', value: emergencyRequests.filter((e: any) => e.status === 'pending').length, gradient: 'from-amber-400 to-yellow-500', icon: Clock },
                        { label: 'قيد التنفيذ', value: emergencyRequests.filter((e: any) => e.status === 'in_progress').length, gradient: 'from-blue-400 to-indigo-500', icon: Activity },
                        { label: 'تم المعالجة', value: emergencyRequests.filter((e: any) => e.status === 'completed').length, gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                      ].map((item, i) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05, duration: 0.4 }}>
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}><item.icon className="w-5 h-5 text-white" /></div>
                                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                              </div>
                              <p className={`text-2xl font-bold bg-gradient-to-l ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Emergency Requests List */}
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                      {emergencyRequests.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                          </div>
                          <p className="text-lg font-bold text-gray-600 mb-2">لا توجد طلبات طوارئ</p>
                          <p className="text-sm text-gray-400">جميع الطلبات العاجلة تم معالجتها</p>
                        </div>
                      ) : (
                        emergencyRequests.map((req: any) => (
                          <motion.div key={req.id} variants={cardVariants} initial="hidden" animate="visible">
                            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${req.status === 'pending' ? 'ring-2 ring-red-400' : req.status === 'in_progress' ? 'ring-2 ring-blue-400' : ''}`}>
                              {/* Emergency gradient left border */}
                              <div className={`absolute top-0 right-0 w-2 h-full ${
                                req.status === 'pending' ? 'bg-gradient-to-b from-red-400 via-red-500 to-orange-500 animate-pulse' :
                                req.status === 'in_progress' ? 'bg-gradient-to-b from-blue-400 to-cyan-500' :
                                req.status === 'completed' ? 'bg-gradient-to-b from-emerald-400 to-green-500' :
                                'bg-gradient-to-b from-gray-300 to-gray-400'
                              }`} />
                              <CardContent className="p-4 relative">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/25 relative">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                    {req.status === 'pending' && (
                                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-lg">{req.serviceType || 'طلب طوارئ'}</p>
                                      <Badge className={`${req.status === 'pending' ? 'bg-red-100 text-red-700 border-red-300' : req.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'} border text-xs font-bold px-2.5 py-0.5`}>
                                        {req.status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1 animate-pulse" />}
                                        {req.status === 'pending' ? 'بانتظار المعالجة' : req.status === 'in_progress' ? 'قيد التنفيذ' : req.status === 'completed' ? 'تم المعالجة' : req.status === 'rejected' ? 'مرفوض' : req.status}
                                      </Badge>
                                      <Badge className="bg-gradient-to-l from-red-500 to-orange-500 text-white border-0 text-xs"><AlertTriangle className="w-3 h-3 ml-1" />طوارئ</Badge>
                                    </div>
                                    <div className="mt-2 space-y-1 text-sm">
                                      <p className="text-gray-600"><span className="font-medium">المستفيد:</span> {req.beneficiaryName || 'غير معروف'}</p>
                                      {req.address && (
                                        <button onClick={() => showMapPreview(req.address)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                                          <span className="truncate">{getDisplayLocation(req.address)}</span>
                                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">فتح الخريطة</span>
                                        </button>
                                      )}
                                      {req.notes && <p className="text-gray-500"><span className="font-medium">ملاحظات:</span> {req.notes}</p>}
                                      {req.nurseName && <p className="text-blue-600"><span className="font-medium">الممرض المعين:</span> {req.nurseName}</p>}
                                      {(req.dynamicPrice || req.price) && (
                                        <p className="text-emerald-600 font-semibold"><span className="font-medium">السعر:</span> {formatPrice(req.dynamicPrice || req.price || 0)}</p>
                                      )}
                                      <p className="text-gray-400 text-xs">{formatDateTime(req.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 shrink-0">
                                    {req.status === 'pending' && (
                                      <>
                                        <Button size="sm" className="bg-gradient-to-l from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25" onClick={() => handleOpenApproveDialog({ ...req, isEmergency: true })}><UserPlus className="w-3.5 h-3.5 ml-1" />تعيين ممرض</Button>
                                        <Button size="sm" className="bg-gradient-to-l from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25" onClick={async () => {
                                          try { const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'in_progress' }) }); if (res.ok) { toast({ title: 'تم بدء المعالجة' }); fetchData() } else { toast({ title: 'خطأ', description: 'فشل بدء المعالجة', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
                                        }}><Activity className="w-3.5 h-3.5 ml-1" />بدء المعالجة</Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={async () => {
                                          try { const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'rejected' }) }); if (res.ok) { toast({ title: 'تم رفض الطلب' }); fetchData() } else { toast({ title: 'خطأ', description: 'فشل رفض الطلب', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
                                        }}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button>
                                      </>
                                    )}
                                    {req.status === 'in_progress' && (
                                      <Button size="sm" className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25" onClick={async () => {
                                        try { const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'completed' }) }); if (res.ok) { try { await fetch(`/api/chat?requestId=${req.id}`, { method: 'DELETE' }) } catch {} toast({ title: 'تم إكمال المعالجة' }); fetchData() } else { toast({ title: 'خطأ', description: 'فشل إكمال المعالجة', variant: 'destructive' }) } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
                                      }}><CheckCircle className="w-3.5 h-3.5 ml-1" />تم المعالجة</Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 6: المدفوعات (Payments)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    {/* Header with gradient background */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 p-6 text-white shadow-xl shadow-amber-500/20">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold">المالية والمدفوعات</h1>
                          <p className="text-amber-100 text-sm mt-0.5">إدارة طرق الدفع والمعاملات والإعدادات المالية</p>
                        </div>
                      </div>
                    </div>

                    {/* Finance Sub-Tabs - Professional Pill Design */}
                    <div className={`grid ${isSubAdmin ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-1 p-1.5 bg-gradient-to-l from-gray-100 to-gray-50 rounded-2xl shadow-inner border border-gray-200/50`}>
                      {[
                        { key: 'methods' as FinanceSubTab, label: 'طرق الدفع', icon: Wallet, count: payments.length, activeGradient: 'from-blue-500 to-indigo-600', activeShadow: 'shadow-blue-500/25' },
                        { key: 'transactions' as FinanceSubTab, label: 'المعاملات', icon: CreditCard, count: transactions.filter((t: any) => t.status === 'pending_confirmation' || t.status === 'pending').length, countColor: true, activeGradient: 'from-amber-500 to-orange-600', activeShadow: 'shadow-amber-500/25' },
                        ...(!isSubAdmin ? [
                          { key: 'settings' as FinanceSubTab, label: 'الإعدادات', icon: Settings, activeGradient: 'from-emerald-500 to-teal-600', activeShadow: 'shadow-emerald-500/25' },
                          { key: 'pricing' as FinanceSubTab, label: 'التسعير', icon: TrendingUp, activeGradient: 'from-violet-500 to-purple-600', activeShadow: 'shadow-violet-500/25' },
                        ] : []),
                      ].map(({ key, label, icon: Icon, count, countColor, activeGradient, activeShadow }) => (
                        <button
                          key={key}
                          onClick={() => setFinanceSubTab(key)}
                          className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 justify-center whitespace-nowrap ${
                            financeSubTab === key
                              ? `bg-gradient-to-l ${activeGradient} text-white shadow-lg ${activeShadow} scale-[1.02]`
                              : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {label}
                          {count !== undefined && count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              financeSubTab === key
                                ? 'bg-white/25 text-white'
                                : countColor
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-amber-100 text-amber-700'
                            }`}>{count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ═══ Sub-Tab: طرق الدفع ═══ */}
                    {financeSubTab === 'methods' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md"><Wallet className="w-5 h-5 text-white" /></div>
                            <div>
                              <h2 className="text-lg font-bold">طرق الدفع المتاحة</h2>
                              <p className="text-xs text-gray-400">الطرق التي تظهر للمستفيدين عند الدفع إلكترونياً</p>
                            </div>
                          </div>
                          <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => { setEditingPayment(null); setPaymentForm({ type: 'wallet-deposit', name: '', accountName: '', accountNumber: '', bankName: '', exchangeName: '', walletType: '', instructions: '', isActive: true }); setPaymentDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة طريقة دفع</Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'إجمالي الطرق', value: payments.length, gradient: 'from-blue-400 to-indigo-500', icon: CreditCard },
                            { label: 'المحافظ', value: payments.filter((p: any) => p.type === 'wallet-deposit').length, gradient: 'from-blue-400 to-cyan-500', icon: Wallet },
                            { label: 'الصرافين', value: payments.filter((p: any) => p.type === 'exchange-transfer').length, gradient: 'from-amber-400 to-orange-500', icon: Send },
                            { label: 'البنوك', value: payments.filter((p: any) => p.type === 'bank-transfer').length, gradient: 'from-emerald-400 to-teal-500', icon: Building },
                          ].map((item, i) => (
                            <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                              <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                                <CardContent className="p-3 flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}><item.icon className="w-4 h-4 text-white" /></div>
                                  <div><p className="text-xl font-bold">{item.value}</p><p className="text-[10px] text-gray-400">{item.label}</p></div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        {/* Payment Methods Grid */}
                        {payments.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payments.map((p: any, i: number) => {
                              const typeIcon = p.type === 'wallet-deposit' ? Wallet : p.type === 'exchange-transfer' ? Send : p.type === 'bank-transfer' ? Building : DollarSign
                              const typeColor = p.type === 'wallet-deposit' ? 'from-blue-400 to-indigo-500' : p.type === 'exchange-transfer' ? 'from-amber-400 to-orange-500' : p.type === 'bank-transfer' ? 'from-emerald-400 to-teal-500' : 'from-gray-400 to-gray-500'
                              const typeLabel = p.type === 'wallet-deposit' ? 'إيداع محفظة' : p.type === 'exchange-transfer' ? 'تحويل صراف' : p.type === 'bank-transfer' ? 'تحويل بنكي' : 'نقدي'
                              const TypeIcon = typeIcon
                              return (
                                <motion.div key={p.id} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                                  <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${!p.isActive ? 'opacity-60' : ''}`}>
                                    {/* Gradient Header */}
                                    <div className={`bg-gradient-to-l ${typeColor} p-3 text-white flex items-center justify-between`}>
                                      <div className="flex items-center gap-2">
                                        <TypeIcon className="w-5 h-5" />
                                        <span className="font-bold text-sm">{p.name || typeLabel}</span>
                                      </div>
                                      <Badge className={`text-[10px] px-2 py-0.5 ${p.isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/70'}`}>{p.isActive ? 'نشطة' : 'معطلة'}</Badge>
                                    </div>
                                    {/* Details */}
                                    <CardContent className="p-3 space-y-2">
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                        <TypeIcon className="w-3 h-3" />
                                        <span>{typeLabel}</span>
                                      </div>
                                      {p.accountName && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                          <div><p className="text-[10px] text-gray-400">{p.type === 'wallet-deposit' ? 'اسم صاحب المحفظة' : 'اسم صاحب الحساب'}</p><p className="text-xs font-bold text-gray-800">{p.accountName}</p></div>
                                          <button onClick={() => { navigator.clipboard.writeText(p.accountName); toast({ title: 'تم النسخ' }) }} className="p-1 rounded hover:bg-gray-200"><Copy className="w-3 h-3 text-gray-400" /></button>
                                        </div>
                                      )}
                                      {p.accountNumber && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                          <div><p className="text-[10px] text-gray-400">{p.type === 'wallet-deposit' ? 'رقم المحفظة' : p.type === 'exchange-transfer' ? 'رقم الصراف' : 'رقم الحساب'}</p><p className="text-xs font-bold font-mono text-gray-800" dir="ltr">{p.accountNumber}</p></div>
                                          <button onClick={() => { navigator.clipboard.writeText(p.accountNumber); toast({ title: 'تم النسخ' }) }} className="p-1 rounded hover:bg-gray-200"><Copy className="w-3 h-3 text-gray-400" /></button>
                                        </div>
                                      )}
                                      {p.bankName && <p className="text-xs text-gray-600"><span className="text-gray-400">البنك:</span> {p.bankName}</p>}
                                      {p.exchangeName && <p className="text-xs text-gray-600"><span className="text-gray-400">الصراف:</span> {p.exchangeName}</p>}
                                      {p.instructions && <p className="text-xs text-gray-500 bg-amber-50/50 p-1.5 rounded-lg">{p.instructions}</p>}
                                      <div className="flex gap-2 pt-1">
                                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => { setEditingPayment(p); setPaymentForm({ type: p.type || 'wallet-deposit', name: p.name || '', accountName: p.accountName || '', accountNumber: p.accountNumber || '', bankName: p.bankName || '', exchangeName: p.exchangeName || '', walletType: p.walletType || '', instructions: p.instructions || '', isActive: p.isActive }); setPaymentDialog(true) }}><Pencil className="w-3 h-3 ml-1" />تعديل</Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 text-xs h-7" onClick={() => showConfirmDialog('حذف طريقة الدفع', `هل أنت متأكد من حذف "${p.name}"؟ لا يمكن التراجع عن هذا الإجراء.`, Trash2, 'text-red-500', () => handleDeletePayment(p.id))}><Trash2 className="w-3 h-3" /></Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4"><CreditCard className="w-10 h-10 text-blue-300" /></div>
                            <p className="text-lg font-bold text-gray-500">لا توجد طرق دفع</p>
                            <p className="text-sm text-gray-400 mt-1">أضف طرق الدفع لتظهر للمستفيدين عند الدفع إلكترونياً</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ Sub-Tab: المعاملات ═══ */}
                    {financeSubTab === 'transactions' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md"><CreditCard className="w-5 h-5 text-white" /></div>
                          <div>
                            <h2 className="text-lg font-bold">المعاملات المالية</h2>
                            <p className="text-xs text-gray-400">متابعة وتأكيد المدفوعات</p>
                          </div>
                        </div>

                        {/* Transaction Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'بانتظار التأكيد', value: transactions.filter((t: any) => t.status === 'pending_confirmation' || t.status === 'pending').length, gradient: 'from-amber-400 to-orange-500', icon: Clock },
                            { label: 'مكتملة', value: transactions.filter((t: any) => t.status === 'paid').length, gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                            { label: 'مرفوضة', value: transactions.filter((t: any) => t.status === 'rejected').length, gradient: 'from-red-400 to-rose-500', icon: XCircle },
                            { label: 'إجمالي المعاملات', value: transactions.length, gradient: 'from-blue-400 to-indigo-500', icon: CreditCard },
                          ].map((item, i) => (
                            <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                              <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                                <CardContent className="p-3 flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}><item.icon className="w-4 h-4 text-white" /></div>
                                  <div><p className="text-xl font-bold">{item.value}</p><p className="text-[10px] text-gray-400">{item.label}</p></div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        {/* Pending Payments */}
                        {transactions.filter((t: any) => t.status === 'pending_confirmation' || t.status === 'pending').length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-base font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4 animate-pulse" />مدفوعات بانتظار التأكيد</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {transactions.filter((t: any) => t.status === 'pending_confirmation' || t.status === 'pending').map((t: any, i: number) => {
                                const typeColor = t.paymentMethod === 'wallet-deposit' ? 'from-blue-400 to-indigo-500' : t.paymentMethod === 'exchange-transfer' ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'
                                const typeLabel = t.paymentMethod === 'wallet-deposit' ? 'إيداع محفظة' : t.paymentMethod === 'exchange-transfer' ? 'تحويل صراف' : t.paymentMethod === 'bank-transfer' ? 'تحويل بنكي' : 'نقدي'
                                return (
                                <motion.div key={t.id} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
                                  <Card className="border-2 border-amber-200 shadow-lg overflow-hidden">
                                    <div className={`bg-gradient-to-l ${typeColor} p-3 text-white flex items-center justify-between`}>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 animate-pulse" />
                                        <span className="font-bold text-sm">{t.beneficiaryName || 'مستفيد'}</span>
                                      </div>
                                      <Badge className="bg-white/20 text-white border-0 text-[10px]">بانتظار التأكيد</Badge>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-2 bg-emerald-50 rounded-lg"><p className="text-[10px] text-gray-400">المبلغ</p><p className="font-bold text-emerald-600">{t.amount} ر.ي</p></div>
                                        <div className="p-2 bg-blue-50 rounded-lg"><p className="text-[10px] text-gray-400">الطريقة</p><p className="font-medium text-blue-600">{typeLabel}</p></div>
                                      </div>
                                      {t.transactionRef && <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400">رقم العملية</p><p className="font-mono text-xs">{t.transactionRef}</p></div>}
                                      {t.senderName && <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400">المرسل</p><p className="text-xs font-medium">{t.senderName}</p></div>}
                                      {t.senderPhone && <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-400">هاتف المرسل</p><p className="text-xs font-mono" dir="ltr">{t.senderPhone}</p></div>}
                                      {t.exchangeName && <div className="p-2 bg-amber-50 rounded-lg"><p className="text-[10px] text-gray-400">الصراف</p><p className="text-xs font-medium">{t.exchangeName}</p></div>}
                                      <p className="text-[10px] text-gray-400">{formatDate(t.createdAt)}</p>
                                      <div className="flex gap-2 pt-2 border-t">
                                        <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => showConfirmDialog('تأكيد الدفع', `هل أنت متأكد من تأكيد استلام دفع "${t.beneficiaryName || 'مستفيد'}" بمبلغ ${t.amount} ر.ي؟`, CheckCircle, 'text-emerald-500', () => handleConfirmPayment(t.id))}><CheckCircle className="w-3.5 h-3.5 ml-1" />تأكيد الدفع</Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => showConfirmDialog('رفض الدفع', `هل أنت متأكد من رفض دفع "${t.beneficiaryName || 'مستفيد'}"؟ سيتم إشعار المستفيد بالرفض.`, XCircle, 'text-red-500', () => handleRejectPayment(t.id))}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )})}
                            </div>
                          </div>
                        )}

                        {/* Confirmed Transactions */}
                        <div className="space-y-3">
                          <h3 className="text-base font-bold text-emerald-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" />المعاملات المكتملة</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {transactions.filter((t: any) => t.status === 'paid').slice(0, 20).map((t: any) => {
                              const typeLabel = t.paymentMethod === 'wallet-deposit' ? 'محفظة' : t.paymentMethod === 'exchange-transfer' ? 'صراف' : t.paymentMethod === 'bank-transfer' ? 'بنكي' : 'نقدي'
                              return (
                              <Card key={t.id} className="border-0 shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-sm">{t.beneficiaryName || 'مستفيد'}</p>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0">مدفوع</Badge>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">المبلغ:</span><span className="font-bold">{t.amount} ر.ي</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">الطريقة:</span><span>{typeLabel}</span></div>
                                    <p className="text-xs text-gray-400">{formatDate(t.confirmedAt || t.createdAt)}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            )})}
                            {transactions.filter((t: any) => t.status === 'paid').length === 0 && (
                              <div className="col-span-full text-center py-8"><CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">لا توجد معاملات مكتملة</p></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ Sub-Tab: إعدادات الدفع ═══ — Main admin only */}
                    {!isSubAdmin && financeSubTab === 'settings' && settings && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md"><Settings className="w-5 h-5 text-white" /></div>
                          <div>
                            <h2 className="text-lg font-bold">إعدادات الدفع</h2>
                            <p className="text-xs text-gray-400">إعدادات واتساب الدفع والإعدادات العامة</p>
                          </div>
                        </div>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-emerald-500 to-teal-600 p-4 text-white">
                            <div className="flex items-center gap-2"><CreditCard className="w-5 h-5" /><span className="font-bold">إعدادات إثبات الدفع</span></div>
                            <p className="text-emerald-100 text-xs mt-1">عندما يختار المستفيد الدفع إلكترونياً، يتم عرض بيانات الحساب كاملة مع أزرار "إثبات الدفع" لكل رقم واتساب</p>
                          </div>
                          <CardContent className="p-4 space-y-4">
                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <p className="text-sm text-emerald-700">أرقام واتساب الإدارة هي الأرقام التي سيتواصل معها المستفيد لإرسال إثبات الدفع (إيصال التحويل). يمكنك إضافة عدة أرقام.</p>
                            </div>
                            {/* Multiple WhatsApp Numbers */}
                            <div>
                              <Label className="font-medium">أرقام واتساب الإدارة (لإثبات الدفع)</Label>
                              <div className="space-y-2 mt-2">
                                {(settings.whatsappNumbers || []).length > 0 && (settings.whatsappNumbers || []).map((num: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-sm font-mono" dir="ltr">{num}</div>
                                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 shrink-0" onClick={() => {
                                      const updated = [...(settings.whatsappNumbers || [])]
                                      updated.splice(idx, 1)
                                      setSettings({ ...settings, whatsappNumbers: updated })
                                    }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="newWhatsappNumber"
                                    placeholder="مثال: 967771234567"
                                    className="border-emerald-200 flex-1"
                                    dir="ltr"
                                  />
                                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0" onClick={() => {
                                    const input = document.getElementById('newWhatsappNumber') as HTMLInputElement
                                    const val = input?.value?.trim()
                                    if (val) {
                                      const updated = [...(settings.whatsappNumbers || []), val]
                                      setSettings({ ...settings, whatsappNumbers: updated, whatsappNumber: updated[0] })
                                      input.value = ''
                                    }
                                  }}><Plus className="w-4 h-4" /></Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">أدخل الرقم بالصيغة الدولية بدون + (مثال: 967771234567) ثم اضغط زر الإضافة</p>
                            </div>
                            {/* Legacy single number field (kept for backward compat) */}
                            <div className="border-t pt-3">
                              <Label className="font-medium text-xs text-gray-500">الرقم الأساسي (قديم)</Label>
                              <Input value={settings.whatsappNumber || ''} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="مثال: 967771234567" className="border-amber-200 mt-1" dir="ltr" />
                            </div>
                            <Button className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg w-full" onClick={() => showConfirmDialog('حفظ أرقام الواتساب', 'سيتم تحديث أرقام واتساب الإدارة لإثبات الدفع. هل أنت متأكد؟', MessageSquare, 'text-emerald-500', () => handleSaveSettings({ whatsappNumbers: settings.whatsappNumbers || [], whatsappNumber: settings.whatsappNumber }))}><Save className="w-4 h-4 ml-2" />حفظ أرقام الواتساب</Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* ═══ Sub-Tab: التسعير الديناميكي ═══ — Main admin only */}
                    {!isSubAdmin && financeSubTab === 'pricing' && settings && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md"><TrendingUp className="w-5 h-5 text-white" /></div>
                          <div>
                            <h2 className="text-lg font-bold">إعدادات التسعير الديناميكي</h2>
                            <p className="text-xs text-gray-400">تحكم في نسب الرسوم الإضافية للخدمات</p>
                          </div>
                        </div>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-indigo-500 to-purple-600 p-4 text-white">
                            <div className="flex items-center gap-2"><Clock className="w-5 h-5" /><span className="font-bold">رسوم الوقت (الليل)</span></div>
                            <p className="text-indigo-100 text-xs mt-1">تُطبق من الساعة 10 مساءً إلى 6 صباحاً</p>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div><Label className="font-medium">نسبة رسوم الليل (%)</Label><Input type="number" value={settings.nightSurchargePercent ?? 50} onChange={e => setSettings({ ...settings, nightSurchargePercent: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} max={200} /><p className="text-[10px] text-gray-400 mt-1">النسبة المئوية المضافة على السعر الأساسي خلال أوقات الليل</p></div>
                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                              <p className="text-sm text-indigo-700">مثال: إذا كان السعر الأساسي 5,000 ر.ي ورسوم الليل 50%، سيصبح السعر 7,500 ر.ي</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-amber-500 to-orange-600 p-4 text-white">
                            <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /><span className="font-bold">رسوم يوم الجمعة</span></div>
                            <p className="text-amber-100 text-xs mt-1">رسوم إضافية تُطبق في يوم الجمعة</p>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div><Label className="font-medium">نسبة رسوم الجمعة (%)</Label><Input type="number" value={settings.fridaySurchargePercent ?? 25} onChange={e => setSettings({ ...settings, fridaySurchargePercent: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} max={200} /><p className="text-[10px] text-gray-400 mt-1">النسبة المئوية المضافة على السعر الأساسي في يوم الجمعة</p></div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-emerald-500 to-teal-600 p-4 text-white">
                            <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /><span className="font-bold">رسوم المسافة</span></div>
                            <p className="text-emerald-100 text-xs mt-1">رسوم إضافية حسب المسافة بين الممرض والمستفيد</p>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <div><p className="font-medium text-sm">تفعيل رسوم المسافة</p><p className="text-xs text-gray-500">تطبيق رسوم إضافية حسب المسافة</p></div>
                              <Switch checked={settings.distanceFeesEnabled ?? true} onCheckedChange={v => setSettings({ ...settings, distanceFeesEnabled: v })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50"><Label className="font-medium text-sm">المسافة المجانية (كم)</Label><Input type="number" value={settings.distanceFreeKm ?? 5} onChange={e => setSettings({ ...settings, distanceFreeKm: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} /><p className="text-[10px] text-gray-400 mt-1">أول X كم بدون رسوم</p></div>
                              <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50"><Label className="font-medium text-sm">رسوم الكلم (5-15 كم) ر.ي</Label><Input type="number" value={settings.distanceFeePerKm5to15 ?? 100} onChange={e => setSettings({ ...settings, distanceFeePerKm5to15: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} /></div>
                              <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50"><Label className="font-medium text-sm">رسوم الكلم (15-30 كم) ر.ي</Label><Input type="number" value={settings.distanceFeePerKm15to30 ?? 150} onChange={e => setSettings({ ...settings, distanceFeePerKm15to30: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} /></div>
                              <div className="p-3 bg-red-50/30 rounded-xl border border-red-100/50"><Label className="font-medium text-sm">رسوم الكلم (أكثر من 30 كم) ر.ي</Label><Input type="number" value={settings.distanceFeePerKmOver30 ?? 200} onChange={e => setSettings({ ...settings, distanceFeePerKmOver30: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} /></div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-rose-500 to-pink-600 p-4 text-white">
                            <div className="flex items-center gap-2"><DollarSign className="w-5 h-5" /><span className="font-bold">عمولة المنصة</span></div>
                            <p className="text-rose-100 text-xs mt-1">النسبة التي تأخذها المنصة من كل طلب</p>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div><Label className="font-medium">نسبة العمولة (%)</Label><Input type="number" value={settings.commissionPercent ?? 15} onChange={e => setSettings({ ...settings, commissionPercent: Number(e.target.value) })} className="border-amber-200 mt-1" min={0} max={100} /><p className="text-[10px] text-gray-400 mt-1">مثال: 15% تعني أن المنصة تأخذ 15% من كل طلب والممرض يحصل على 85%</p></div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-l from-red-500 to-red-600 p-4 text-white">
                            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /><span className="font-bold">أسعار خدمات الطوارئ</span></div>
                            <p className="text-red-100 text-xs mt-1">تحديد السعر الأساسي لكل نوع من خدمات الطوارئ</p>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            {[
                              { key: 'تمريض منزلي عاجل', label: 'تمريض منزلي عاجل' },
                              { key: 'إسعافات أولية', label: 'إسعافات أولية' },
                              { key: 'حقن وريدي', label: 'حقن وريدي' },
                              { key: 'قياس الضغط والسكر', label: 'قياس الضغط والسكر' },
                              { key: 'عناية بالجروح', label: 'عناية بالجروح' },
                              { key: 'أخرى', label: 'أخرى (الافتراضي)' },
                            ].map(item => (
                              <div key={item.key} className="flex items-center gap-3">
                                <Label className="font-medium text-sm min-w-[140px]">{item.label}</Label>
                                <div className="flex-1 flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={(settings.emergencyServicePrices as Record<string, number>)?.[item.key] ?? (item.key === 'أخرى' ? 3000 : 0)}
                                    onChange={e => {
                                      const currentPrices = (settings.emergencyServicePrices as Record<string, number>) || {}
                                      setSettings({
                                        ...settings,
                                        emergencyServicePrices: {
                                          ...currentPrices,
                                          [item.key]: Number(e.target.value),
                                        }
                                      })
                                    }}
                                    className="border-amber-200"
                                    min={0}
                                  />
                                  <span className="text-xs text-gray-500 shrink-0">ر.ي</span>
                                </div>
                              </div>
                            ))}
                            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                              <p className="text-xs text-red-600">يتم تطبيق التسعير الديناميكي (رسوم الليل، الجمعة) على هذه الأسعار تلقائياً عند إنشاء طلب الطوارئ</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Button className="w-full bg-gradient-to-l from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 h-12 text-base" onClick={() => showConfirmDialog('حفظ إعدادات التسعير', 'سيتم تحديث جميع إعدادات التسعير الديناميكي. هل أنت متأكد؟', TrendingUp, 'text-violet-500', () => handleSaveSettings({
                          nightSurchargePercent: settings.nightSurchargePercent,
                          fridaySurchargePercent: settings.fridaySurchargePercent,
                          distanceFeesEnabled: settings.distanceFeesEnabled,
                          distanceFeePerKm5to15: settings.distanceFeePerKm5to15,
                          distanceFeePerKm15to30: settings.distanceFeePerKm15to30,
                          distanceFeePerKmOver30: settings.distanceFeePerKmOver30,
                          distanceFreeKm: settings.distanceFreeKm,
                          commissionPercent: settings.commissionPercent,
                          emergencyServicePrices: settings.emergencyServicePrices,
                        }))}><Save className="w-5 h-5 ml-2" />حفظ جميع إعدادات التسعير</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 7: الكوبونات (Coupons)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'coupons' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الكوبونات</h1><p className="text-gray-500 text-sm mt-1">إنشاء وإدارة أكواد الخصم</p></div>
                      <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true }); setCouponDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة كوبون</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coupons.map((c: any) => (
                        <motion.div key={c.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center shadow-md"><Tag className="w-5 h-5 text-white" /></div><p className="font-bold font-mono">{c.code}</p></div>
                                <Badge className={`${getStatusColor(c.isActive ? 'active' : 'suspended')} border text-xs`}>{c.isActive ? 'نشط' : 'معطل'}</Badge>
                              </div>
                              <div className="space-y-1 mb-3">
                                <p className="text-sm text-gray-600">الخصم: <span className="font-bold text-amber-600">{c.discountPercent}%</span></p>
                                <p className="text-sm text-gray-600">الاستخدامات: <span className="font-bold">{c.currentUses || 0}/{c.maxUses}</span></p>
                                <p className="text-sm text-gray-600">تاريخ الانتهاء: <span className="font-bold">{formatDate(c.expiresAt)}</span></p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleToggleCouponStatus(c)}>{c.isActive ? 'تعطيل' : 'تفعيل'}</Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditingCoupon(c); setCouponForm({ code: c.code, discountPercent: String(c.discountPercent), maxUses: String(c.maxUses), expiresAt: c.expiresAt ? new Date(typeof c.expiresAt === 'object' && c.expiresAt?.seconds ? c.expiresAt.seconds * 1000 : c.expiresAt).toISOString().split('T')[0] : '', isActive: c.isActive }); setCouponDialog(true) }}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCoupon(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {coupons.length === 0 && <div className="text-center py-16"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا توجد كوبونات</p></div>}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 8: التقييمات (Ratings) — NEW
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'ratings' && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">التقييمات</h1><p className="text-gray-500 text-sm mt-1">عرض وتحليل تقييمات المستفيدين</p></div>

                    {/* General Average */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div variants={cardVariants} initial="hidden" animate="visible">
                        <Card className="border-0 shadow-lg shadow-amber-500/10">
                          <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-3"><Star className="w-8 h-8 text-white" /></div>
                            <p className="text-3xl font-bold bg-gradient-to-l from-amber-600 to-orange-600 bg-clip-text text-transparent">{generalAverage.toFixed(1)}</p>
                            <div className="flex justify-center mt-2">{renderStars(Math.round(generalAverage))}</div>
                            <p className="text-sm text-gray-500 mt-1">المعدل العام ({ratings.length} تقييم)</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      {filteredNurseAverage !== null && (
                        <motion.div variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg shadow-amber-500/10">
                            <CardContent className="p-6 text-center">
                              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-3"><Users className="w-8 h-8 text-white" /></div>
                              <p className="text-3xl font-bold bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent">{filteredNurseAverage.toFixed(1)}</p>
                              <div className="flex justify-center mt-2">{renderStars(Math.round(filteredNurseAverage))}</div>
                              <p className="text-sm text-gray-500 mt-1">معدل الممرض المحدد</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>

                    {/* Filter by Nurse */}
                    <div className="flex gap-3 items-center">
                      <Select value={ratingsNurseFilter} onValueChange={setRatingsNurseFilter}>
                        <SelectTrigger className="w-64 border-amber-200"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder="تصفية حسب الممرض" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">جميع الممرضين</SelectItem>{approvedNurses.map((n: any) => <SelectItem key={n.id} value={n.id}>{n.firstName} {n.lastName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* Ratings List */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {ratings.map((r: any, i: number) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.03 }}>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0"><Star className="w-5 h-5 text-white" /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap"><p className="font-bold">{r.nurseName || 'ممرض غير معروف'}</p><span className="text-gray-400">←</span><p className="text-sm text-gray-600">{r.beneficiaryName || 'مستفيد'}</p></div>
                                  {r.serviceName && <p className="text-xs text-gray-500 mt-0.5">الخدمة: {r.serviceName}</p>}
                                  <div className="mt-1">{renderStars(r.rating)}</div>
                                  {r.comment && <p className="text-sm text-gray-600 mt-1 bg-amber-50/50 p-2 rounded-lg">{r.comment}</p>}
                                  <p className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {ratings.length === 0 && <div className="text-center py-16"><Star className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا توجد تقييمات</p></div>}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: الشكاوى (Complaints)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'complaints' && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الشكاوى والبلاغات</h1><p className="text-gray-500 text-sm mt-1">مراجعة ومعالجة الشكاوى المقدمة من المستخدمين</p></div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الشكاوى', value: complaints.length, gradient: 'from-amber-400 to-orange-500', icon: FileWarning },
                        { label: 'بانتظار المراجعة', value: complaints.filter((c: any) => c.status === 'pending' || !c.status).length, gradient: 'from-yellow-400 to-amber-500', icon: Clock },
                        { label: 'تمت المراجعة', value: complaints.filter((c: any) => c.status === 'reviewed').length, gradient: 'from-blue-400 to-cyan-500', icon: Eye },
                        { label: 'تم الحل', value: complaints.filter((c: any) => c.status === 'resolved').length, gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                      ].map((item, i) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05, duration: 0.4 }}>
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}><item.icon className="w-5 h-5 text-white" /></div>
                                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                              </div>
                              <p className={`text-2xl font-bold bg-gradient-to-l ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'all', label: 'الكل', count: complaints.length },
                        { key: 'pending', label: 'بانتظار المراجعة', count: complaints.filter((c: any) => c.status === 'pending' || !c.status).length },
                        { key: 'reviewed', label: 'تمت المراجعة', count: complaints.filter((c: any) => c.status === 'reviewed').length },
                        { key: 'resolved', label: 'تم الحل', count: complaints.filter((c: any) => c.status === 'resolved').length },
                        { key: 'rejected', label: 'مرفوضة', count: complaints.filter((c: any) => c.status === 'rejected').length },
                      ].map(filter => (
                        <button key={filter.key} onClick={() => setComplaintFilter(filter.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                            complaintFilter === filter.key
                              ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25'
                              : 'bg-white/70 backdrop-blur-sm text-gray-500 hover:text-gray-700 hover:bg-white ring-1 ring-gray-200/50'
                          }`}
                        >
                          {filter.label} {filter.count > 0 && <span className="opacity-75">({filter.count})</span>}
                        </button>
                      ))}
                    </div>

                    {/* Complaints List */}
                    {complaintsLoading ? (
                      <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
                    ) : (
                      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        {complaints.filter((c: any) => complaintFilter === 'all' || (c.status || 'pending') === complaintFilter).length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                              <FileWarning className="w-10 h-10 text-amber-400" />
                            </div>
                            <p className="text-lg font-bold text-gray-600 mb-2">لا توجد شكاوى</p>
                            <p className="text-sm text-gray-400">لا توجد شكاوى مطابقة للفلتر المحدد</p>
                          </div>
                        ) : (
                          complaints.filter((c: any) => complaintFilter === 'all' || (c.status || 'pending') === complaintFilter).map((c: any, index: number) => {
                            const statusColors: Record<string, string> = {
                              pending: 'bg-amber-100 text-amber-700 border-amber-200',
                              reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
                              resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                              rejected: 'bg-red-100 text-red-700 border-red-200',
                            }
                            const statusLabels: Record<string, string> = {
                              pending: 'بانتظار المراجعة',
                              reviewed: 'تمت المراجعة',
                              resolved: 'تم الحل',
                              rejected: 'مرفوضة',
                            }
                            const cStatus = c.status || 'pending'
                            const badgeClass = statusColors[cStatus] || statusColors.pending
                            const statusLabel = statusLabels[cStatus] || statusLabels.pending

                            return (
                              <motion.div key={c.id || index} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.03 }}>
                                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => { setComplaintDetail(c); setComplaintNotes(c.adminNotes || '') }}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                                        <FileWarning className="w-6 h-6 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-bold">{c.reporterName || c.userName || c.beneficiaryName || 'مجهول'}</h3>
                                          <Badge className={`${badgeClass} border text-[10px] font-bold`}>{statusLabel}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{c.type || c.reportType || 'شكوى عامة'}</p>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description || c.message || c.notes || ''}</p>
                                        <p className="text-xs text-gray-400 mt-2">{formatDateTime(c.createdAt)}</p>
                                      </div>
                                      <Button size="sm" variant="outline" className="rounded-xl border-amber-200 hover:bg-amber-50 shrink-0"><Eye className="w-3.5 h-3.5 ml-1" />عرض</Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 10: النشاط (Activity)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">سجل النشاط</h1><p className="text-gray-500 text-sm mt-1">جميع العمليات المسجلة في النظام</p></div>
                    <div className="space-y-3 max-h-[75vh] overflow-y-auto">
                      {activityLogs.map((log: any, i: number) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.02 }}>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0"><Activity className="w-5 h-5 text-white" /></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{log.description}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">{log.type}</Badge>
                                    <span className="text-xs text-gray-400">{log.userName}</span>
                                    <span className="text-xs text-gray-400">• {formatDateTime(log.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {activityLogs.length === 0 && <div className="text-center py-16"><Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا يوجد نشاط</p></div>}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 11: المدراء الفرعيين (Sub-Admins)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'sub-admins' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">المدراء الفرعيين</h1><p className="text-gray-500 text-sm mt-1">إدارة المسؤولين الفرعيين وصلاحياتهم</p></div>
                      <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => { setEditingSubAdmin(null); setSubAdminForm({ name: '', phone: '', password: '', permissions: { services: false, nurses: false, beneficiaries: false, requests: false, payments: false, coupons: false, reports: false, emergency: false, ratings: false } }); setSubAdminDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة مدير فرعي</Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'إجمالي المدراء', value: subAdmins.length, gradient: 'from-amber-400 to-orange-500', icon: UsersRound },
                        { label: 'نشطين', value: subAdmins.filter((s: any) => s.status !== 'blocked').length, gradient: 'from-emerald-400 to-teal-500', icon: CheckCircle },
                        { label: 'محظورين', value: subAdmins.filter((s: any) => s.status === 'blocked').length, gradient: 'from-red-400 to-rose-500', icon: Ban },
                      ].map((item, i) => (
                        <motion.div key={i} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05, duration: 0.4 }}>
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}><item.icon className="w-5 h-5 text-white" /></div>
                                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                              </div>
                              <p className={`text-2xl font-bold bg-gradient-to-l ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Sub-Admins Cards */}
                    {subAdmins.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subAdmins.map((sa: any, index: number) => (
                          <motion.div key={sa.id} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.05, duration: 0.4 }}>
                            <Card className={`border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden ${sa.status === 'blocked' ? 'opacity-60' : ''}`}>
                              {/* Card Header */}
                              <div className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 p-4 relative">
                                <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                <div className="flex items-center gap-3 relative">
                                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md ring-2 ring-white/30"><UserCog className="w-6 h-6 text-white" /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white truncate">{sa.name}</p>
                                    <p className="text-amber-100 text-xs">{sa.phone}</p>
                                  </div>
                                  <Badge className={`${sa.status === 'blocked' ? 'bg-red-500/80 text-white' : 'bg-emerald-500/80 text-white'} border-0 text-xs`}>{sa.status === 'blocked' ? 'محظور' : 'نشط'}</Badge>
                                </div>
                              </div>
                              <CardContent className="p-4 space-y-3">
                                {/* Permission Badges */}
                                <div>
                                  <p className="text-xs text-gray-500 mb-2 font-medium">الصلاحيات</p>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {Object.entries(sa.permissions || {}).filter(([, v]) => v).map(([k]) => {
                                      const permLabels: Record<string, string> = { services: 'الخدمات', nurses: 'الممرضين', beneficiaries: 'المستفيدين', requests: 'الطلبات', payments: 'المدفوعات', coupons: 'الكوبونات', reports: 'التقارير', emergency: 'الطوارئ', ratings: 'التقييمات' }
                                      return <Badge key={k} variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-50/50 border-amber-200/50 text-amber-700">{permLabels[k] || k}</Badge>
                                    })}
                                    {Object.entries(sa.permissions || {}).filter(([, v]) => v).length === 0 && <span className="text-xs text-gray-400">لا توجد صلاحيات</span>}
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                  <Button size="sm" variant="outline" className="flex-1 hover:bg-amber-50" onClick={() => { setEditingSubAdmin(sa); setSubAdminForm({ name: sa.name, phone: sa.phone, password: '', permissions: { ...(sa.permissions || {}) } }); setSubAdminDialog(true) }}><Pencil className="w-3.5 h-3.5 ml-1" />تعديل</Button>
                                  <Button size="sm" variant="outline" className={`flex-1 ${sa.status === 'blocked' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-orange-500 hover:bg-orange-50'}`} onClick={() => handleBlockUnblockSubAdmin(sa.id, sa.status || 'active')}>{sa.status === 'blocked' ? <><Unlock className="w-3.5 h-3.5 ml-1" />تفعيل</> : <><Ban className="w-3.5 h-3.5 ml-1" />حظر</>}</Button>
                                  <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteSubAdmin(sa.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <UserCog className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">لا يوجد مدراء فرعيين</p>
                        <p className="text-gray-300 text-sm mt-1">اضغط على "إضافة مدير فرعي" لإضافة مدير جديد</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB 12: الإعدادات (Settings) — REDESIGNED
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'settings' && settings && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">الإعدادات</h1><p className="text-gray-500 text-sm mt-1">إعدادات النظام والحساب</p></div>

                    {/* Admin Info Section */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" />معلومات المدير</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div><Label>الاسم</Label><Input value={(user as any)?.name || ''} disabled className="border-amber-200 bg-gray-50" /></div>
                          <div><Label>الهاتف</Label><Input value={(user as any)?.phone || 'غير محدد'} disabled className="border-amber-200 bg-gray-50" /></div>
                          <div><Label>البريد الإلكتروني</Label><Input value={(user as any)?.email || 'غير محدد'} disabled className="border-amber-200 bg-gray-50" /></div>
                        </div>
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => { setEditName((user as any)?.name || ''); setEditPhone((user as any)?.phone || ''); setEditEmail((user as any)?.email || ''); setEditNameDialog(true) }}><Pencil className="w-4 h-4 ml-2" />تعديل البيانات</Button>
                      </CardContent>
                    </Card>

                    {/* Emergency Settings - Only main admin */}
                    {!isSubAdmin && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-red-500" />إعدادات الطوارئ</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div><Label>رقم هاتف الطوارئ</Label><Input value={settings.emergencyPhone || ''} onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })} placeholder="أدخل رقم الطوارئ" className="border-amber-200 mt-1" /></div>
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => showConfirmDialog('حفظ رقم الطوارئ', 'سيتم تحديث رقم هاتف الطوارئ. هل أنت متأكد؟', Phone, 'text-red-500', () => handleSaveSettings({ emergencyPhone: settings.emergencyPhone }))}>حفظ رقم الطوارئ</Button>
                      </CardContent>
                    </Card>
                    )}

                    {/* Referral Settings - Only main admin */}
                    {!isSubAdmin && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Gift className="w-5 h-5 text-purple-500" />إعدادات الإحالة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
                          <div><p className="font-medium">تفعيل نظام الإحالة</p><p className="text-xs text-gray-500">السماح بالمستفيدين بإحالة أصدقائهم</p></div>
                          <Switch checked={settings.referralEnabled ?? true} onCheckedChange={v => setSettings({ ...settings, referralEnabled: v })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><Label>مكافأة المُحيل (نقاط)</Label><Input type="number" value={settings.referralBonusPoints ?? 50} onChange={e => setSettings({ ...settings, referralBonusPoints: Number(e.target.value) })} className="border-amber-200 mt-1" /></div>
                          <div><Label>مكافأة المُحال (نقاط)</Label><Input type="number" value={settings.referralBonusPointsReceiver ?? 25} onChange={e => setSettings({ ...settings, referralBonusPointsReceiver: Number(e.target.value) })} className="border-amber-200 mt-1" /></div>
                        </div>
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => showConfirmDialog('حفظ إعدادات الإحالة', 'سيتم تحديث إعدادات نظام الإحالة. هل أنت متأكد؟', Gift, 'text-purple-500', () => handleSaveSettings({ referralEnabled: settings.referralEnabled, referralBonusPoints: settings.referralBonusPoints, referralBonusPointsReceiver: settings.referralBonusPointsReceiver }))}>حفظ إعدادات الإحالة</Button>
                      </CardContent>
                    </Card>
                    )}

                    {/* Shortcut to Finance Tab - Main admin only */}
                    {!isSubAdmin && (
                    <Card className="border-0 shadow-lg bg-gradient-to-l from-blue-50/50 to-indigo-50/50 border border-blue-200/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md"><CreditCard className="w-5 h-5 text-white" /></div>
                            <div>
                              <p className="font-bold">إعدادات المدفوعات والتسعير</p>
                              <p className="text-xs text-gray-500">إدارة طرق الدفع، إعدادات الدفع، والتسعير الديناميكي في قسم المالية</p>
                            </div>
                          </div>
                          <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50" onClick={() => setActiveTab('payments')}>الانتقال للمالية <ChevronDown className="w-4 h-4 mr-1 rotate-[-90deg]" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                    )}

                    {/* Sub-admin info banner */}
                    {isSubAdmin && (
                    <Card className="border-0 shadow-lg bg-gradient-to-l from-violet-50/50 to-purple-50/50 border border-violet-200/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md"><Shield className="w-5 h-5 text-white" /></div>
                          <div>
                            <p className="font-bold text-violet-700">حساب مدير فرعي</p>
                            <p className="text-xs text-gray-500">إعدادات الطوارئ، الإحالة، والمدفوعات والتسعير يديرها المدير الرئيسي فقط</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    )}

                    {/* Dangerous Zone - Only main admin */}
                    {!isSubAdmin && (
                    <Card className="border-2 border-red-200 shadow-lg bg-red-50/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />منطقة خطرة</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-red-50/80 rounded-xl border border-red-200/50">
                          <p className="text-sm text-red-700 font-medium mb-3">تحذير: حذف جميع البيانات لا يمكن التراجع عنه. سيتم حذف جميع الممرضين، المستفيدين، الطلبات، الخدمات، المدفوعات، الكوبونات، التقييمات، سجل النشاط، طلبات الطوارئ، الشكاوى، والمدراء الفرعيين. سيتم الاحتفاظ بحساب المدير فقط.</p>
                          <Button className="bg-gradient-to-l from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => showConfirmDialog('حذف جميع البيانات', 'هذا الإجراء لا يمكن التراجع عنه! سيتم حذف جميع البيانات نهائياً.', Trash2, 'text-red-500', () => { setResetPassword(''); setResetConfirmText(''); setResetDataDialog(true) })}><Trash2 className="w-4 h-4 ml-2" />حذف جميع البيانات</Button>
                        </div>
                      </CardContent>
                    </Card>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          DIALOGS
      ═══════════════════════════════════════════════════════════ */}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl" dir="rtl">
          {confirmAction && (
            <>
              <div className="flex flex-col items-center py-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                  confirmAction.iconColor === 'text-red-500' ? 'from-red-400 to-rose-500' :
                  confirmAction.iconColor === 'text-emerald-500' ? 'from-emerald-400 to-teal-500' :
                  confirmAction.iconColor === 'text-violet-500' ? 'from-violet-400 to-purple-500' :
                  'from-amber-400 to-orange-500'
                } flex items-center justify-center shadow-lg mb-4`}>
                  <confirmAction.icon className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold text-center">{confirmAction.title}</DialogTitle>
                <p className="text-sm text-gray-500 text-center mt-2">{confirmAction.description}</p>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(false)}>إلغاء</Button>
                <Button className={`flex-1 ${
                  confirmAction.iconColor === 'text-red-500' ? 'bg-gradient-to-l from-red-500 to-rose-500' :
                  confirmAction.iconColor === 'text-emerald-500' ? 'bg-gradient-to-l from-emerald-500 to-teal-500' :
                  confirmAction.iconColor === 'text-violet-500' ? 'bg-gradient-to-l from-violet-500 to-purple-500' :
                  'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500'
                } text-white shadow-lg`} onClick={() => { confirmAction.onConfirm(); setConfirmDialog(false) }}>تأكيد</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Admin Profile Dialog */}
      <Dialog open={editNameDialog} onOpenChange={setEditNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تعديل بيانات المدير</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>الاسم</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="border-amber-200 mt-1" /></div>
            <div><Label>الهاتف</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="رقم الهاتف" className="border-amber-200 mt-1" /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="البريد الإلكتروني" className="border-amber-200 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditNameDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleUpdateProfile}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingService ? 'تعديل خدمة' : 'إضافة خدمة'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>اسم الخدمة *</Label><Input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>الوصف *</Label><Textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>السعر *</Label><Input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} className="border-amber-200 mt-1" /></div>
              <div><Label>الفئة</Label><Select value={serviceForm.category} onValueChange={v => setServiceForm({ ...serviceForm, category: v })}><SelectTrigger className="border-amber-200 mt-1"><SelectValue placeholder="اختر الفئة" /></SelectTrigger><SelectContent><SelectItem value="قياسات وتحاليل">قياسات وتحاليل</SelectItem><SelectItem value="حقن وإبر">حقن وإبر</SelectItem><SelectItem value="عناية بالجروح">عناية بالجروح</SelectItem><SelectItem value="تمريض منزلي">تمريض منزلي</SelectItem><SelectItem value="إسعافات أولية">إسعافات أولية</SelectItem><SelectItem value="عناية بالمريض">عناية بالمريض</SelectItem><SelectItem value="صحة المرأة">صحة المرأة</SelectItem><SelectItem value="استشارات ومتابعة">استشارات ومتابعة</SelectItem><SelectItem value="رعاية الأطفال">رعاية الأطفال</SelectItem><SelectItem value="عام">عام</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl"><Label>خدمة نشطة</Label><Switch checked={serviceForm.isActive} onCheckedChange={v => setServiceForm({ ...serviceForm, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setServiceDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSaveService}>{editingService ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingPayment ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type Selection */}
            <div>
              <Label className="text-sm font-medium">نوع طريقة الدفع *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { key: 'wallet-deposit', label: 'إيداع محفظة', icon: Wallet, color: 'from-blue-400 to-indigo-500' },
                  { key: 'exchange-transfer', label: 'تحويل صراف', icon: Send, color: 'from-amber-400 to-orange-500' },
                  { key: 'bank-transfer', label: 'تحويل بنكي', icon: Building, color: 'from-emerald-400 to-teal-500' },
                  { key: 'cash', label: 'نقدي', icon: DollarSign, color: 'from-gray-400 to-gray-500' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentForm(prev => ({ ...prev, type: key }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-right ${
                      paymentForm.type === key
                        ? 'border-amber-400 bg-amber-50 shadow-md'
                        : 'border-gray-200 hover:border-amber-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${paymentForm.type === key ? 'text-amber-700' : 'text-gray-500'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name is auto-generated from walletType/bankName/exchangeName - hidden */}

            {/* Wallet-specific fields */}
            {paymentForm.type === 'wallet-deposit' && (
              <>
                <div>
                  <Label className="text-sm font-medium">نوع المحفظة *</Label>
                  <Select value={paymentForm.walletType} onValueChange={v => setPaymentForm(prev => ({ ...prev, walletType: v }))}>
                    <SelectTrigger className="border-amber-200 mt-1"><SelectValue placeholder="اختر نوع المحفظة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-cash">ون كاش</SelectItem>
                      <SelectItem value="cash-wallet">محفظة كاش</SelectItem>
                      <SelectItem value="jawali">جوالي</SelectItem>
                      <SelectItem value="yemen-wallet">يمن والت</SelectItem>
                      <SelectItem value="saba-cash">سبأكاش</SelectItem>
                      <SelectItem value="mahfathati">محفظتي</SelectItem>
                      <SelectItem value="pyes">بيس</SelectItem>
                      <SelectItem value="floosak">فلوسك</SelectItem>
                      <SelectItem value="jaib">جيب</SelectItem>
                      <SelectItem value="shamil-money">شامل مالي</SelectItem>
                      <SelectItem value="em-pay">إم باي</SelectItem>
                      <SelectItem value="bin-dowal-pay">بن دول باي</SelectItem>
                      <SelectItem value="national-wallet">المحفظة الوطنية</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm font-medium">اسم صاحب المحفظة *</Label><Input value={paymentForm.accountName} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} placeholder="الاسم المسجل في المحفظة" className="border-amber-200 mt-1" /></div>
                <div><Label className="text-sm font-medium">رقم المحفظة *</Label><Input value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} placeholder="رقم هاتف المحفظة" className="border-amber-200 mt-1" dir="ltr" /></div>
              </>
            )}

            {/* Exchange-specific fields */}
            {paymentForm.type === 'exchange-transfer' && (
              <>
                <div><Label className="text-sm font-medium">اسم الصراف / المحل *</Label><Input value={paymentForm.exchangeName} onChange={e => setPaymentForm({ ...paymentForm, exchangeName: e.target.value })} placeholder="مثال: صراف النور" className="border-amber-200 mt-1" /></div>
                <div><Label className="text-sm font-medium">رقم هاتف الصراف *</Label><Input value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} placeholder="رقم هاتف الصراف" className="border-amber-200 mt-1" dir="ltr" /></div>
                <div><Label className="text-sm font-medium">اسم صاحب الحساب</Label><Input value={paymentForm.accountName} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} placeholder="الاسم المسجل عند الصراف" className="border-amber-200 mt-1" /></div>
              </>
            )}

            {/* Bank-specific fields */}
            {paymentForm.type === 'bank-transfer' && (
              <>
                <div><Label className="text-sm font-medium">اسم البنك *</Label><Input value={paymentForm.bankName} onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })} placeholder="مثال: بنك اليمن والكويت" className="border-amber-200 mt-1" /></div>
                <div><Label className="text-sm font-medium">رقم الحساب / IBAN *</Label><Input value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} placeholder="رقم الحساب البنكي" className="border-amber-200 mt-1" dir="ltr" /></div>
                <div><Label className="text-sm font-medium">اسم صاحب الحساب *</Label><Input value={paymentForm.accountName} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} placeholder="الاسم المسجل في البنك" className="border-amber-200 mt-1" /></div>
              </>
            )}

            {/* Instructions */}
            <div><Label className="text-sm font-medium">تعليمات الدفع (اختياري)</Label><Textarea value={paymentForm.instructions} onChange={e => setPaymentForm({ ...paymentForm, instructions: e.target.value })} placeholder="تعليمات إضافية للمستفيد مثل: يرجى إرسال إيصال التحويل عبر الواتساب" className="border-amber-200 mt-1" rows={2} /></div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl"><Label>نشطة</Label><Switch checked={paymentForm.isActive} onCheckedChange={v => setPaymentForm({ ...paymentForm, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPaymentDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSavePayment}>{editingPayment ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingCoupon ? 'تعديل كوبون' : 'إضافة كوبون'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>كود الكوبون *</Label><Input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="border-amber-200 mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>نسبة الخصم % *</Label><Input type="number" value={couponForm.discountPercent} onChange={e => setCouponForm({ ...couponForm, discountPercent: e.target.value })} className="border-amber-200 mt-1" /></div>
              <div><Label>الحد الأقصى للاستخدام *</Label><Input type="number" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} className="border-amber-200 mt-1" /></div>
            </div>
            <div><Label>تاريخ الانتهاء *</Label><Input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl"><Label>نشط</Label><Switch checked={couponForm.isActive} onCheckedChange={v => setCouponForm({ ...couponForm, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCouponDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSaveCoupon}>{editingCoupon ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog — Professional Design with Nurse Fee */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${paymentConfirmed ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                {paymentConfirmed ? <CheckCircle className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{paymentConfirmed ? 'تعيين الممرض' : 'تأكيد الدفع وقبول الطلب'}</DialogTitle>
                <p className="text-xs text-gray-400">{paymentConfirmed ? 'اختر طريقة التنفيذ' : 'تأكيد استلام المبلغ من المستفيد'}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedRequest && (() => {
              const reqTotalPrice = selectedRequest.dynamicPrice || selectedRequest.service?.price || selectedRequest.totalPrice || 0
              const commissionPercent = settings?.commissionPercent ?? 15
              const commissionAmount = Math.round(reqTotalPrice * commissionPercent / 100)
              const nurseFee = reqTotalPrice - commissionAmount
              return (
                <div className="space-y-3">
                  {/* Request Info Card */}
                  <div className="p-4 bg-gradient-to-l from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-gray-800">{selectedRequest.isMultiService && selectedRequest.services ? selectedRequest.services.map((s: any) => s.name).join(' + ') : (selectedRequest.service?.name || 'خدمة')}</p>
                    </div>
                    {/* Multi-service details */}
                    {selectedRequest.isMultiService && selectedRequest.services && selectedRequest.services.length > 1 && (
                      <div className="mt-2 p-2.5 bg-white/60 rounded-lg border border-amber-100 space-y-1.5">
                        <p className="text-xs font-bold text-amber-700">الخدمات المطلوبة ({selectedRequest.services.length})</p>
                        {selectedRequest.services.map((s: any, idx: number) => (
                          <div key={s.id || idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{idx + 1}. {s.name}</span>
                            <span className="text-amber-600 font-medium">{formatPrice(s.price)}</span>
                          </div>
                        ))}
                        <div className="border-t border-amber-200 pt-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-700">مجموع الخدمات</span>
                          <span className="text-xs font-bold text-amber-700">{formatPrice(selectedRequest.services.reduce((sum: number, s: any) => sum + (s.price || 0), 0))}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">المستفيد: {selectedRequest.beneficiary?.name || 'غير محدد'}</p>
                    {(selectedRequest.beneficiary?.location || selectedRequest.address || selectedRequest.location) && (
                      <button
                        onClick={() => showMapPreview(selectedRequest.beneficiary?.location || selectedRequest.address || selectedRequest.location)}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{getDisplayLocation(selectedRequest.beneficiary?.location || selectedRequest.address || selectedRequest.location)}</span>
                      </button>
                    )}
                  </div>

                  {/* Price Breakdown Card */}
                  <div className="p-4 bg-gradient-to-l from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200/50 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <p className="font-bold text-emerald-700 text-sm">تفاصيل التسعير</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">إجمالي الطلب</span>
                        <span className="font-bold text-gray-800">{formatPrice(reqTotalPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">عمولة المنصة ({commissionPercent}%)</span>
                        <span className="font-medium text-rose-600">- {formatPrice(commissionAmount)}</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-2 flex justify-between items-center">
                        <span className="font-bold text-emerald-700">رسوم الممرض</span>
                        <span className="text-xl font-black text-emerald-600">{formatPrice(nurseFee)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600/70">الممرض سيستلم {formatPrice(nurseFee)} بعد خصم عمولة المنصة {formatPrice(commissionAmount)}</p>
                  </div>

                  {/* ══════════ STEP 1: Payment Confirmation ══════════ */}
                  {!paymentConfirmed && (
                    <div className="p-4 bg-gradient-to-l from-amber-50/80 via-yellow-50/50 to-orange-50/50 rounded-xl ring-2 ring-amber-300/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                          <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-bold text-amber-800">تأكيد الدفع</p>
                      </div>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        هل قام المستفيد <span className="font-bold">{selectedRequest.beneficiary?.name || ''}</span> بإرسال المبلغ الإجمالي <span className="font-bold text-emerald-700">{formatPrice(reqTotalPrice)}</span>؟
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-amber-200/50">
                        <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-700">طريقة الدفع: {selectedRequest.paymentMethod === 'cash' ? 'نقدي (عند الاستلام)' : selectedRequest.paymentMethod === 'electronic' ? 'إلكتروني' : selectedRequest.paymentMethod || 'غير محددة'}</span>
                      </div>
                    </div>
                  )}

                  {/* ══════════ STEP 2: Payment Confirmed Badge ══════════ */}
                  {paymentConfirmed && (
                    <div className="p-3 bg-gradient-to-l from-emerald-50 to-teal-50/50 rounded-xl ring-1 ring-emerald-200/50 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-emerald-700 text-sm">تم تأكيد الدفع وقبول الطلب</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ══════════ Assign/Execute Options (only after payment confirmed) ══════════ */}
            {paymentConfirmed && (
              <>
                {/* Option A: Assign Nurse */}
                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${approveMode === 'assign' ? 'border-amber-400 bg-gradient-to-l from-amber-50 to-orange-50/30 shadow-md shadow-amber-500/10' : 'border-gray-200 hover:border-amber-200'}`} onClick={() => setApproveMode('assign')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${approveMode === 'assign' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md' : 'bg-gray-100'}`}>
                      <UserPlus className={`w-4.5 h-4.5 ${approveMode === 'assign' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-bold">تعيين ممرض</p>
                      <p className="text-xs text-gray-400">اختيار ممرض معتمد وتعيينه للطلب</p>
                    </div>
                  </div>
                  {approveMode === 'assign' && (
                    <div className="mt-3 space-y-3">
                      {/* Nearby Nurses Suggestions */}
                      {geocodingLoading && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-blue-600">جارٍ حساب المسافات للممرضين القريبين...</span>
                        </div>
                      )}
                      {Object.keys(nurseDistances).length > 0 && (
                        <div className="p-3 bg-gradient-to-l from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-200/50">
                          <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />مقترحات الممرضين القريبين ({Object.keys(nurseDistances).length} ممرض){geocodingLoading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}</p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {sortedNursesByProximity.filter((n: any) => nurseDistances[n.id] !== undefined).slice(0, 5).map((n: any) => (
                              <button key={n.id} onClick={() => setSelectedNurseId(n.id)} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${selectedNurseId === n.id ? 'bg-emerald-500 text-white' : 'bg-white/80 hover:bg-emerald-50'}`}>
                                <span className="font-medium">{n.firstName} {n.lastName}</span>
                                <Badge className={`${selectedNurseId === n.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'} border-0 text-xs`}>{nurseDistances[n.id]?.toFixed(1)} كم</Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>اختر الممرض ({sortedNursesByProximity.length} ممرض معتمد)</Label>
                        <Select value={selectedNurseId} onValueChange={setSelectedNurseId}>
                          <SelectTrigger className="border-amber-200 mt-1"><SelectValue placeholder={sortedNursesByProximity.length === 0 ? 'لا يوجد ممرضين معتمدين' : 'اختر ممرض'} /></SelectTrigger>
                          <SelectContent>
                            {sortedNursesByProximity.map((n: any) => (
                              <SelectItem key={n.id} value={n.id}>
                                {n.firstName} {n.lastName}{nurseDistances[n.id] !== undefined ? ` (${nurseDistances[n.id].toFixed(1)} كم)` : n.location ? ` - ${getDisplayLocation(n.location)}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {sortedNursesByProximity.length === 0 && !geocodingLoading && (
                          <p className="text-xs text-red-500 mt-1">لا يوجد ممرضين معتمدين حالياً. يرجى إضافة وقبول ممرضين أولاً.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option B: Direct Execution */}
                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${approveMode === 'direct' ? 'border-rose-400 bg-gradient-to-l from-rose-50 to-pink-50/30 shadow-md shadow-rose-500/10' : 'border-gray-200 hover:border-rose-200'}`} onClick={() => setApproveMode('direct')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${approveMode === 'direct' ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-md' : 'bg-gray-100'}`}>
                      <AlertCircle className={`w-4.5 h-4.5 ${approveMode === 'direct' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-bold">تنفيذ مباشر</p>
                      <p className="text-xs text-gray-400">تنفيذ الطلب مباشرة من قبل الإدارة بدون تعيين ممرض</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setApproveDialog(false); setPaymentConfirmed(false); setPaymentConfirmStep(false) }}>إلغاء</Button>
            <Button className={`flex-1 text-white shadow-lg ${
              !paymentConfirmed
                ? 'bg-gradient-to-l from-emerald-500 to-teal-500 shadow-emerald-500/25'
                : approveMode === 'assign' 
                  ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/25' 
                  : 'bg-gradient-to-l from-rose-500 via-pink-500 to-red-500 shadow-rose-500/25'
            }`} onClick={handleConfirmApprove}>
              {!paymentConfirmed ? 'تأكيد الدفع وقبول الطلب' : approveMode === 'assign' ? 'تعيين وتأكيد' : 'تنفيذ مباشر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تأكيد الرفض</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-red-50/50 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /><p className="text-sm">هل أنت متأكد من رفض {rejectType === 'nurse' ? 'هذا الممرض' : 'هذا الطلب'}؟</p></div>
            <div><Label>ملاحظات الإدارة (اختياري)</Label><Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="سبب الرفض..." className="border-amber-200 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRejectDialog(false)}>إلغاء</Button><Button variant="destructive" onClick={handleRejectConfirm}>تأكيد الرفض</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-red-50/50 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /><p className="text-sm">هل أنت متأكد من حذف {deleteTarget?.type === 'nurse' ? 'الممرض' : 'المستفيد'} &quot;{deleteTarget?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget?.type === 'nurse') handleDeleteNurse(deleteTarget.id); else if (deleteTarget?.type === 'beneficiary') handleDeleteBeneficiary(deleteTarget.id) }}>تأكيد الحذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nurse Detail Dialog */}
      <Dialog open={!!nurseDetail} onOpenChange={() => setNurseDetail(null)}>
        <DialogContent className="sm:max-w-xl p-0 max-h-[90vh] overflow-y-auto">
          {nurseDetail && (() => {
            const isExpired = nurseDetail.licenseExpiryDate && new Date(nurseDetail.licenseExpiryDate) < new Date()
            const statusConfig: Record<string, { gradient: string; label: string }> = {
              pending: { gradient: 'from-yellow-500 to-amber-500', label: 'بانتظار الموافقة' },
              approved: { gradient: 'from-emerald-500 to-teal-500', label: 'معتمد' },
              rejected: { gradient: 'from-red-500 to-rose-500', label: 'مرفوض' },
              blocked: { gradient: 'from-gray-500 to-slate-500', label: 'محظور' },
            }
            const cfg = statusConfig[nurseDetail.status] || statusConfig.pending
            return (
              <>
                {/* Header with gradient */}
                <div className={`bg-gradient-to-l ${cfg.gradient} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
                      <span className="text-white font-bold text-2xl">{(nurseDetail.firstName || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{nurseDetail.firstName} {nurseDetail.secondName} {nurseDetail.thirdName} {nurseDetail.lastName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">{cfg.label}</Badge>
                        {isExpired && <Badge className="bg-red-500/80 text-white border-0 text-xs backdrop-blur-sm"><AlertTriangle className="w-3 h-3 ml-0.5" />ترخيص منتهي</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Phone className="w-4 h-4" />معلومات الاتصال</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">الهاتف</p>
                        <p className="font-semibold text-sm" dir="ltr">{nurseDetail.phone || '-'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">الموقع</p>
                        <p className="font-semibold text-sm">{nurseDetail.location || '-'}</p>
                      </div>
                    </div>
                  </div>
                  {/* License Info */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />معلومات الترخيص</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                        <p className="text-xs text-amber-500 mb-1">رقم الترخيص</p>
                        <p className="font-semibold text-sm">{nurseDetail.licenseNumber || '-'}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${isExpired ? 'bg-red-50/80 border-red-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
                        <p className={`text-xs mb-1 ${isExpired ? 'text-red-500' : 'text-emerald-500'}`}>انتهاء الترخيص</p>
                        <p className={`font-semibold text-sm ${isExpired ? 'text-red-600' : ''}`}>{formatDate(nurseDetail.licenseExpiryDate)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100">
                        <p className="text-xs text-blue-500 mb-1">الرقم الوطني</p>
                        <p className="font-semibold text-sm" dir="ltr">{nurseDetail.nationalId || '-'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Verification Status */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />حالة التحقق من الهوية</h3>
                    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {nurseDetail.isVerified ? (
                            <><ShieldCheck className="w-5 h-5 text-emerald-500" /><span className="font-semibold text-sm text-emerald-700">تم التحقق من الهوية</span></>
                          ) : (
                            <><ShieldAlert className="w-5 h-5 text-orange-500" /><span className="font-semibold text-sm text-orange-700">لم يتم التحقق من الهوية</span></>
                          )}
                        </div>
                        <Badge className={nurseDetail.isVerified ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border' : 'bg-orange-100 text-orange-700 border-orange-200 border'}>
                          {nurseDetail.isVerified ? 'موثّق' : 'غير موثّق'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Verification Photos */}
                  {(nurseDetail.nationalIdPhotoUrl || nurseDetail.licensePhotoUrl) && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" />وثائق التحقق</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {nurseDetail.nationalIdPhotoUrl && (
                          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-200/50 shadow-sm">
                            <div className="p-3 bg-gradient-to-l from-blue-500 to-indigo-500 text-white flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="font-bold text-xs">البطاقة الوطنية</span>
                              </div>
                              <button
                                onClick={() => setViewingImage({url: nurseDetail.nationalIdPhotoUrl, title: 'صورة البطاقة الوطنية'})}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="عرض بالحجم الكامل"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-3">
                              <div
                                className="w-full h-36 rounded-xl overflow-hidden border-2 border-blue-200/50 bg-white cursor-pointer hover:shadow-lg transition-all duration-300 group relative"
                                onClick={() => setViewingImage({url: nurseDetail.nationalIdPhotoUrl, title: 'صورة البطاقة الوطنية'})}
                              >
                                <img src={nurseDetail.nationalIdPhotoUrl} alt="البطاقة الوطنية" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <ZoomIn className="w-4 h-4" />
                                      <span className="text-xs font-bold">عرض بالحجم الكامل</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {nurseDetail.licensePhotoUrl && (
                          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-200/50 shadow-sm">
                            <div className="p-3 bg-gradient-to-l from-amber-500 to-orange-500 text-white flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="font-bold text-xs">رخصة المزاولة</span>
                              </div>
                              <button
                                onClick={() => setViewingImage({url: nurseDetail.licensePhotoUrl, title: 'صورة رخصة المزاولة'})}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="عرض بالحجم الكامل"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-3">
                              <div
                                className="w-full h-36 rounded-xl overflow-hidden border-2 border-amber-200/50 bg-white cursor-pointer hover:shadow-lg transition-all duration-300 group relative"
                                onClick={() => setViewingImage({url: nurseDetail.licensePhotoUrl, title: 'صورة رخصة المزاولة'})}
                              >
                                <img src={nurseDetail.licensePhotoUrl} alt="رخصة المزاولة" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                                    <div className="flex items-center gap-2 text-amber-600">
                                      <ZoomIn className="w-4 h-4" />
                                      <span className="text-xs font-bold">عرض بالحجم الكامل</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Registration Date */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>تاريخ التسجيل: {formatDate(nurseDetail.createdAt)}</span>
                    <span>آخر تحديث: {formatDate(nurseDetail.updatedAt)}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-2 flex-wrap">
                    {nurseDetail.status === 'pending' && (
                      <>
                        <Button className="flex-1 bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25" onClick={() => { handleNurseAction(nurseDetail.id, 'approved'); setNurseDetail(null) }}><CheckCircle className="w-4 h-4 ml-2" />قبول الممرض</Button>
                        <Button className="flex-1 bg-gradient-to-l from-red-500 to-rose-500 text-white rounded-xl shadow-lg shadow-red-500/25" onClick={() => { handleNurseAction(nurseDetail.id, 'rejected'); setNurseDetail(null) }}><XCircle className="w-4 h-4 ml-2" />رفض الممرض</Button>
                      </>
                    )}
                    {nurseDetail.status === 'approved' && (
                      <Button className="flex-1 bg-gradient-to-l from-orange-500 to-amber-500 text-white rounded-xl shadow-lg shadow-orange-500/25" onClick={() => { handleNurseAction(nurseDetail.id, 'blocked'); setNurseDetail(null) }}><Ban className="w-4 h-4 ml-2" />حظر الممرض</Button>
                    )}
                    {nurseDetail.status === 'blocked' && (
                      <Button className="flex-1 bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25" onClick={() => { handleNurseAction(nurseDetail.id, 'approved'); setNurseDetail(null) }}><Unlock className="w-4 h-4 ml-2" />إلغاء الحظر</Button>
                    )}
                    {/* Verification Actions */}
                    {nurseDetail.status === 'approved' && !nurseDetail.isVerified && (
                      <Button className="flex-1 bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25" onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/nurses/${nurseDetail.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified: true }) })
                          if (res.ok) { toast({ title: 'تم التحقق من الهوية' }); logActivity('nurse_verify', 'تم التحقق من هوية ممرض', { nurseId: nurseDetail.id }); setNurseDetail(null); fetchData() }
                          else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
                        } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
                      }}><ShieldCheck className="w-4 h-4 ml-2" />تحقق من الهوية</Button>
                    )}
                    {nurseDetail.status === 'approved' && nurseDetail.isVerified && (
                      <Button className="flex-1 bg-gradient-to-l from-red-500 to-rose-500 text-white rounded-xl shadow-lg shadow-red-500/25" onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/nurses/${nurseDetail.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified: false }) })
                          if (res.ok) { toast({ title: 'تم رفض التحقق' }); logActivity('nurse_unverify', 'تم رفض التحقق من هوية ممرض', { nurseId: nurseDetail.id }); setNurseDetail(null); fetchData() }
                          else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
                        } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
                      }}><ShieldAlert className="w-4 h-4 ml-2" />رفض التحقق</Button>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black/95 border-white/10">
          {viewingImage && (
            <div className="relative">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-bold text-sm">{viewingImage.title}</span>
                  </div>
                  <button
                    onClick={() => setViewingImage(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Full Image */}
              <div className="flex items-center justify-center min-h-[60vh] max-h-[80vh] p-4 pt-16">
                <img
                  src={viewingImage.url}
                  alt={viewingImage.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Beneficiary Detail Dialog */}
      <Dialog open={!!beneficiaryDetail} onOpenChange={() => { setBeneficiaryDetail(null); setBeneficiaryRequests([]) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>تفاصيل المستفيد</DialogTitle></DialogHeader>
          {beneficiaryDetail && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"><Heart className="w-7 h-7 text-white" /></div>
                <div><p className="text-lg font-bold">{beneficiaryDetail.name}</p><Badge className={`${getStatusColor(beneficiaryDetail.status || 'active')} border`}>{getStatusLabel(beneficiaryDetail.status || 'active')}</Badge></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">الهاتف:</span><p className="font-medium">{beneficiaryDetail.phone}</p></div>
                <div>
                  <span className="text-gray-500">الموقع:</span>
                  {beneficiaryDetail.location && beneficiaryDetail.location !== 'غير محدد' ? (
                    <button onClick={() => showMapPreview(beneficiaryDetail.location)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{getDisplayLocation(beneficiaryDetail.location)}</span>
                    </button>
                  ) : (
                    <p className="font-medium text-gray-400">غير محدد</p>
                  )}
                </div>
              </div>
              {beneficiaryRequests.length > 0 && (
                <div>
                  <Separator className="my-3" />
                  <p className="font-medium mb-2">سجل الطلبات ({beneficiaryRequests.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {beneficiaryRequests.map((r: any, i: number) => (
                      <div key={i} className="p-2 bg-amber-50/50 rounded-lg text-sm">
                        <div className="flex justify-between"><span className="font-medium">{r.service?.name || 'خدمة'}</span><Badge className={`${getStatusColor(r.status)} border text-[10px]`}>{getStatusLabel(r.status)}</Badge></div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-Admin Dialog — Enhanced */}
      <Dialog open={subAdminDialog} onOpenChange={setSubAdminDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingSubAdmin ? 'تعديل مدير فرعي' : 'إضافة مدير فرعي'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>الاسم *</Label><Input value={subAdminForm.name} onChange={e => setSubAdminForm({ ...subAdminForm, name: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>الهاتف *</Label><Input value={subAdminForm.phone} onChange={e => setSubAdminForm({ ...subAdminForm, phone: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>{editingSubAdmin ? 'كلمة المرور (اتركه فارغاً للإبقاء)' : 'كلمة المرور *'}</Label><Input type="password" value={subAdminForm.password} onChange={e => setSubAdminForm({ ...subAdminForm, password: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>الصلاحيات</Label>
                <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => {
                  const allPerms = ['services', 'nurses', 'beneficiaries', 'requests', 'payments', 'coupons', 'reports', 'emergency', 'ratings'] as const
                  const allChecked = allPerms.every(k => subAdminForm.permissions[k as keyof typeof subAdminForm.permissions])
                  const newPerms = { ...subAdminForm.permissions }
                  allPerms.forEach(k => { newPerms[k as keyof typeof subAdminForm.permissions] = !allChecked })
                  setSubAdminForm({ ...subAdminForm, permissions: newPerms })
                }}>
                  {['services', 'nurses', 'beneficiaries', 'requests', 'payments', 'coupons', 'reports', 'emergency', 'ratings'].every(k => subAdminForm.permissions[k as keyof typeof subAdminForm.permissions]) ? 'إلغاء الكل' : 'تحديد الكل'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'services', label: 'الخدمات', icon: Wrench },
                  { key: 'nurses', label: 'الممرضين', icon: Users },
                  { key: 'beneficiaries', label: 'المستفيدين', icon: Heart },
                  { key: 'requests', label: 'الطلبات', icon: ClipboardList },
                  { key: 'payments', label: 'المدفوعات', icon: CreditCard },
                  { key: 'coupons', label: 'الكوبونات', icon: Tag },
                  { key: 'reports', label: 'التقارير', icon: BarChart3 },
                  { key: 'emergency', label: 'الطوارئ', icon: AlertTriangle },
                  { key: 'ratings', label: 'التقييمات', icon: Star },
                ].map(p => (
                  <label key={p.key} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${!!subAdminForm.permissions[p.key as keyof typeof subAdminForm.permissions] ? 'bg-amber-50/80 border-amber-300 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <Switch checked={!!subAdminForm.permissions[p.key as keyof typeof subAdminForm.permissions]} onCheckedChange={checked => setSubAdminForm({ ...subAdminForm, permissions: { ...subAdminForm.permissions, [p.key]: checked } })} className="scale-75" />
                    <div className="flex items-center gap-1.5">
                      <p.icon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium">{p.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSubAdminDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSaveSubAdmin}>{editingSubAdmin ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Data Confirmation Dialog */}
      <Dialog open={resetDataDialog} onOpenChange={setResetDataDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />حذف جميع البيانات</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-red-50/80 rounded-xl border border-red-200/50">
              <p className="text-sm text-red-700 font-bold mb-2">⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
              <p className="text-xs text-red-600">سيتم حذف جميع البيانات نهائياً مع الاحتفاظ بحساب المدير فقط.</p>
            </div>
            <div><Label>كلمة مرور المدير *</Label><Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="أدخل كلمة المرور الحالية" className="border-red-200 mt-1 focus:border-red-400 focus:ring-red-400/20" /></div>
            <div>
              <Label>اكتب &quot;حذف&quot; للتأكيد *</Label>
              <Input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} placeholder='اكتب "حذف" هنا' className="border-red-200 mt-1 focus:border-red-400 focus:ring-red-400/20" />
              {resetConfirmText && resetConfirmText !== 'حذف' && <p className="text-xs text-red-500 mt-1">يرجى كتابة "حذف" بالضبط</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDataDialog(false); setResetPassword(''); setResetConfirmText('') }}>إلغاء</Button>
            <Button variant="destructive" disabled={!resetPassword || resetConfirmText !== 'حذف' || resetLoading} onClick={handleResetData}>
              {resetLoading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الحذف...</> : 'حذف جميع البيانات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Detail Dialog */}
      <Dialog open={!!complaintDetail} onOpenChange={() => setComplaintDetail(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
          {complaintDetail && (() => {
            const statusColors: Record<string, { gradient: string; label: string; badgeClass: string }> = {
              pending: { gradient: 'from-yellow-500 to-amber-500', label: 'بانتظار المراجعة', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
              reviewed: { gradient: 'from-blue-400 to-cyan-500', label: 'تمت المراجعة', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
              resolved: { gradient: 'from-emerald-400 to-teal-500', label: 'تم الحل', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
              rejected: { gradient: 'from-red-400 to-rose-500', label: 'مرفوضة', badgeClass: 'bg-red-100 text-red-700 border-red-200' },
            }
            const cStatus = complaintDetail.status || 'pending'
            const cfg = statusColors[cStatus] || statusColors.pending

            const handleComplaintAction = async (newStatus: string) => {
              try {
                // Update complaint status via API
                const res = await fetch('/api/reports', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reportId: complaintDetail.id, status: newStatus, adminNotes: complaintNotes }),
                })
                if (res.ok) {
                  setComplaints(prev => prev.map((c: any) => c.id === complaintDetail.id ? { ...c, status: newStatus, adminNotes: complaintNotes } : c))
                  setComplaintDetail({ ...complaintDetail, status: newStatus, adminNotes: complaintNotes })
                  const statusLabels: Record<string, string> = { reviewed: 'تمت المراجعة', resolved: 'تم الحل', rejected: 'تم الرفض' }
                  toast({ title: statusLabels[newStatus] || 'تم التحديث' })
                  logActivity('complaint_update', `تم تحديث حالة شكوى إلى: ${statusLabels[newStatus] || newStatus}`, { complaintId: complaintDetail.id, newStatus })
                } else {
                  // If API doesn't exist yet, update locally but warn
                  setComplaints(prev => prev.map((c: any) => c.id === complaintDetail.id ? { ...c, status: newStatus, adminNotes: complaintNotes } : c))
                  setComplaintDetail({ ...complaintDetail, status: newStatus, adminNotes: complaintNotes })
                  const statusLabels: Record<string, string> = { reviewed: 'تمت المراجعة', resolved: 'تم الحل', rejected: 'تم الرفض' }
                  toast({ title: statusLabels[newStatus] || 'تم التحديث', description: 'تم التحديث محلياً - قد لا يتم حفظه في الخادم' })
                }
              } catch {
                // Fallback: update locally
                setComplaints(prev => prev.map((c: any) => c.id === complaintDetail.id ? { ...c, status: newStatus, adminNotes: complaintNotes } : c))
                setComplaintDetail({ ...complaintDetail, status: newStatus, adminNotes: complaintNotes })
                toast({ title: 'تم التحديث محلياً', description: 'لم يتم حفظ التغيير في الخادم', variant: 'destructive' })
              }
            }

            return (
              <>
                {/* Header with gradient */}
                <div className={`bg-gradient-to-l ${cfg.gradient} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
                      <FileWarning className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{complaintDetail.reporterName || complaintDetail.userName || complaintDetail.beneficiaryName || 'مجهول'}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">{cfg.label}</Badge>
                        <span className="text-white/80 text-xs">{complaintDetail.type || complaintDetail.reportType || 'شكوى عامة'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" />تفاصيل الشكوى</h3>
                    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{complaintDetail.description || complaintDetail.message || complaintDetail.notes || 'لا يوجد وصف'}</p>
                    </div>
                  </div>
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                      <p className="text-xs text-amber-500 mb-1">نوع البلاغ</p>
                      <p className="font-semibold text-sm">{complaintDetail.type || complaintDetail.reportType || 'شكوى عامة'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100">
                      <p className="text-xs text-blue-500 mb-1">تاريخ التقديم</p>
                      <p className="font-semibold text-sm">{formatDateTime(complaintDetail.createdAt)}</p>
                    </div>
                  </div>
                  {/* Admin Notes */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />ملاحظات الإدارة</h3>
                    <Textarea value={complaintNotes} onChange={e => setComplaintNotes(e.target.value)} placeholder="أضف ملاحظاتك هنا..." className="border-amber-200 rounded-xl min-h-[80px]" />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {cStatus === 'pending' && (
                      <Button className="flex-1 bg-gradient-to-l from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/25" onClick={() => handleComplaintAction('reviewed')}><Eye className="w-4 h-4 ml-2" />تم المراجعة</Button>
                    )}
                    {(cStatus === 'pending' || cStatus === 'reviewed') && (
                      <Button className="flex-1 bg-gradient-to-l from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25" onClick={() => handleComplaintAction('resolved')}><CheckCircle className="w-4 h-4 ml-2" />تم الحل</Button>
                    )}
                    <Button className="flex-1 bg-gradient-to-l from-red-500 to-rose-500 text-white rounded-xl shadow-lg shadow-red-500/25" onClick={() => handleComplaintAction('rejected')}><XCircle className="w-4 h-4 ml-2" />رفض</Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Map Preview Dialog */}
      <Dialog open={mapPreviewDialog} onOpenChange={setMapPreviewDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              موقع: {mapPreviewLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Embedded Map */}
            {getMapEmbedUrl(mapPreviewLocation) ? (
              <div className="w-full h-[350px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  src={getMapEmbedUrl(mapPreviewLocation)}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="موقع على الخريطة"
                />
              </div>
            ) : (
              <div className="w-full h-[200px] rounded-xl bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">لا تتوفر إحداثيات لهذا الموقع</p>
                </div>
              </div>
            )}
            {/* Location Details */}
            <div className="bg-amber-50/50 rounded-xl p-3">
              <p className="text-sm text-gray-600 truncate">
                <MapPin className="w-3.5 h-3.5 inline ml-1 text-amber-500" />
                {mapPreviewLocation}
              </p>
              {extractCoordinates(mapPreviewLocation) && (
                <p className="text-xs text-gray-400 mt-1">
                  الإحداثيات: {extractCoordinates(mapPreviewLocation)!.lat.toFixed(6)}, {extractCoordinates(mapPreviewLocation)!.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openInMaps(mapPreviewLocation)}
              className="flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              فتح في خرائط Google
            </Button>
            {getDirectionsUrl(mapPreviewLocation) && (
              <Button
                className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white"
                onClick={() => window.open(getDirectionsUrl(mapPreviewLocation)!, '_blank')}
              >
                <Navigation className="w-4 h-4 ml-1.5" />
                الاتجاهات
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
