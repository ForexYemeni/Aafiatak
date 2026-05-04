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
  ChevronDown, AlertCircle, MessageSquare, Clock, MapPin, Calendar
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
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
function formatDate(ts: any): string {
  if (!ts) return 'غير محدد'
  try {
    let d: Date
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) d = new Date(ts.seconds * 1000)
    else if (typeof ts === 'string') d = new Date(ts)
    else return 'غير محدد'
    return isNaN(d.getTime()) ? 'غير محدد' : d.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return 'غير محدد' }
}
function formatDateTime(ts: any): string {
  if (!ts) return 'غير محدد'
  try {
    let d: Date
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) d = new Date(ts.seconds * 1000)
    else if (typeof ts === 'string') d = new Date(ts)
    else return 'غير محدد'
    return isNaN(d.getTime()) ? 'غير محدد' : d.toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return 'غير محدد' }
}

// ─── Types ─────────────────────────────────────────────────────
type Tab = 'dashboard' | 'services' | 'nurses' | 'beneficiaries' | 'requests' | 'emergency' | 'payments' | 'coupons' | 'ratings' | 'reports' | 'activity' | 'settings'

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

  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')

  const [beneficiaryDetail, setBeneficiaryDetail] = useState<any>(null)
  const [beneficiaryRequests, setBeneficiaryRequests] = useState<any[]>([])
  const [nurseDetail, setNurseDetail] = useState<any>(null)

  // Service form
  const [serviceDialog, setServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', category: 'عام', isActive: true })

  // Payment form
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({ name: '', accountInfo: '', isActive: true })

  // Assign nurse / approve request dialog
  const [approveDialog, setApproveDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [approveMode, setApproveMode] = useState<'assign' | 'direct'>('assign')
  const [selectedNurseId, setSelectedNurseId] = useState('')

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

  // Settings
  const [settings, setSettings] = useState<any>(null)
  const [subAdmins, setSubAdmins] = useState<any[]>([])
  const [subAdminDialog, setSubAdminDialog] = useState(false)
  const [editingSubAdmin, setEditingSubAdmin] = useState<any>(null)
  const [subAdminForm, setSubAdminForm] = useState({ name: '', phone: '', password: '', permissions: { services: false, nurses: false, beneficiaries: false, requests: false, payments: false, coupons: false, reports: false } })

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
        if (actRes.ok) setActivityLogs(await actRes.json())
        if (emRes.ok) { const data = await emRes.json(); setEmergencyRequests(Array.isArray(data) ? data : []) }
      } else if (activeTab === 'services') {
        const res = await fetch('/api/admin/services')
        if (res.ok) setServices(await res.json())
      } else if (activeTab === 'nurses') {
        const res = await fetch('/api/admin/nurses')
        if (res.ok) setNurses(await res.json())
      } else if (activeTab === 'beneficiaries') {
        const res = await fetch('/api/admin/beneficiaries')
        if (res.ok) setBeneficiaries(await res.json())
      } else if (activeTab === 'requests') {
        const res = await fetch('/api/admin/requests')
        if (res.ok) setRequests(await res.json())
      } else if (activeTab === 'emergency') {
        const res = await fetch('/api/admin/emergency')
        if (res.ok) { const data = await res.json(); setEmergencyRequests(Array.isArray(data) ? data : []) }
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/admin/payments')
        if (res.ok) setPayments(await res.json())
      } else if (activeTab === 'coupons') {
        const res = await fetch('/api/admin/coupons')
        if (res.ok) setCoupons(await res.json())
      } else if (activeTab === 'ratings') {
        const url = ratingsNurseFilter !== 'all' ? `/api/admin/ratings?nurseId=${ratingsNurseFilter}` : '/api/admin/ratings'
        const res = await fetch(url)
        if (res.ok) setRatings(await res.json())
      } else if (activeTab === 'activity') {
        const res = await fetch('/api/admin/activity-log?limit=50')
        if (res.ok) setActivityLogs(await res.json())
      } else if (activeTab === 'reports') {
        const [dashRes, reqRes, svcRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/requests'),
          fetch('/api/admin/services'),
        ])
        if (dashRes.ok) setStats(await dashRes.json())
        if (reqRes.ok) setRequests(await reqRes.json())
        if (svcRes.ok) setServices(await svcRes.json())
      } else if (activeTab === 'settings') {
        const [setRes, saRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch(`/api/admin/sub-admins?adminId=${(user as any)?.id}`),
        ])
        if (setRes.ok) setSettings(await setRes.json())
        if (saRes.ok) setSubAdmins(await saRes.json())
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, toast, ratingsNurseFilter, user])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLogout = () => { logout(); setView('landing') }

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
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serviceForm) })
      if (res.ok) {
        toast({ title: editingService ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة' })
        logActivity(editingService ? 'service_update' : 'service_create', `${editingService ? 'تم تحديث' : 'تم إضافة'} خدمة: ${serviceForm.name}`)
        setServiceDialog(false); setEditingService(null); setServiceForm({ name: '', description: '', price: '', category: 'عام', isActive: true }); fetchData()
      } else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'تم حذف الخدمة' }); logActivity('service_delete', 'تم حذف خدمة'); fetchData() }
    } catch { toast({ title: 'خطأ', description: 'فشل حذف الخدمة', variant: 'destructive' }) }
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
  const handleOpenApproveDialog = (req: any) => {
    setSelectedRequest(req); setApproveMode('assign'); setSelectedNurseId(''); setApproveDialog(true)
  }

  const handleConfirmApprove = async () => {
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
          const res = await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedRequest.id, status: 'in_progress' }) })
          if (res.ok) { toast({ title: 'تم بدء معالجة طلب الطوارئ' }); logActivity('emergency_direct_execute', 'تم بدء معالجة طلب طوارئ مباشرة', { requestId: selectedRequest.id }); setApproveDialog(false); fetchData() }
        } else {
          const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_progress', adminNotes: 'تم التنفيذ من قبل الإدارة' }) })
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
    if (!confirm(`هل أنت متأكد من قبول ${selectedRequestIds.length} طلب؟`)) return
    try {
      let successCount = 0
      for (const id of selectedRequestIds) {
        const res = await fetch(`/api/admin/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) })
        if (res.ok) successCount++
      }
      toast({ title: `تم قبول ${successCount} طلب بنجاح` }); logActivity('bulk_approve', `تم قبول ${successCount} طلب دفعة واحدة`); setSelectedRequestIds([]); fetchData()
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Payment CRUD ───────────────────────────────────────────
  const handleSavePayment = async () => {
    if (!paymentForm.name || !paymentForm.accountInfo) { toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' }); return }
    try {
      const url = editingPayment ? `/api/admin/payments/${editingPayment.id}` : '/api/admin/payments'
      const method = editingPayment ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentForm) })
      if (res.ok) { toast({ title: editingPayment ? 'تم تحديث طريقة الدفع' : 'تم إضافة طريقة الدفع' }); setPaymentDialog(false); setEditingPayment(null); setPaymentForm({ name: '', accountInfo: '', isActive: true }); fetchData() }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return
    try { const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف طريقة الدفع' }); fetchData() } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Coupon CRUD ───────────────────────────────────────────
  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discountPercent || !couponForm.maxUses || !couponForm.expiresAt) { toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' }); return }
    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(couponForm) })
      if (res.ok) { toast({ title: editingCoupon ? 'تم تحديث الكوبون' : 'تم إضافة الكوبون' }); setCouponDialog(false); setEditingCoupon(null); setCouponForm({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true }); fetchData() }
      else { const data = await res.json(); toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return
    try { const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف الكوبون' }); fetchData() } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleToggleCouponStatus = async (coupon: any) => {
    try { const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !coupon.isActive }) }); if (res.ok) { toast({ title: coupon.isActive ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون' }); fetchData() } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  // ─── Settings save ──────────────────────────────────────────
  const handleSaveSettings = async (data: any) => {
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
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
        const res = await fetch('/api/admin/sub-admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: (user as any)?.id, ...subAdminForm }) })
        if (res.ok) { toast({ title: 'تم إضافة المسؤول الفرعي' }); setSubAdminDialog(false); fetchData() }
        else { const d = await res.json(); toast({ title: 'خطأ', description: d.error, variant: 'destructive' }) }
      }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

  const handleDeleteSubAdmin = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسؤول الفرعي؟')) return
    try { const res = await fetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' }); if (res.ok) { toast({ title: 'تم حذف المسؤول الفرعي' }); fetchData() } } catch { toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' }) }
  }

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
    return matchSearch && matchStatus && matchService
  }), [requests, requestSearch, requestStatusFilter, requestServiceFilter])

  // Charts data
  const revenueChartData = useMemo(() => {
    if (!stats) return []
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const base = stats.totalRevenue / 6
    return months.slice(0, 6).map((name, i) => ({ name, revenue: Math.round(base * (0.4 + Math.random() * 1.2) * (i + 1) / 3) }))
  }, [stats])

  const requestsByStatusData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'قيد الانتظار', value: stats.pendingRequests, color: '#f59e0b' },
      { name: 'مقبولة', value: stats.approvedRequests, color: '#10b981' },
      { name: 'مكتملة', value: stats.completedRequests, color: '#3b82f6' },
      { name: 'مرفوضة', value: Math.max(0, stats.totalRequests - stats.pendingRequests - stats.approvedRequests - stats.completedRequests), color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [stats])

  const servicePopularity = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {}
    requests.forEach((r: any) => { const key = r.serviceId; if (!key) return; if (!counts[key]) counts[key] = { name: r.service?.name || 'غير معروف', count: 0, revenue: 0 }; counts[key].count++; counts[key].revenue += r.service?.price || 0 })
    return Object.values(counts).sort((a, b) => b.count - a.count)
  }, [requests])

  const nursePerformance = useMemo(() => {
    const perf: Record<string, { name: string; assignments: number; completed: number }> = {}
    requests.forEach((r: any) => { if (!r.assignment?.nurseId) return; const nid = r.assignment.nurseId; if (!perf[nid]) { const n = r.assignment.nurse; perf[nid] = { name: `${n?.firstName || ''} ${n?.lastName || ''}`.trim() || 'غير معروف', assignments: 0, completed: 0 } }; perf[nid].assignments++; if (r.status === 'completed') perf[nid].completed++ })
    return Object.values(perf).sort((a, b) => b.assignments - a.assignments)
  }, [requests])

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
  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, badge: emergencyRequests.filter((e: any) => e.status === 'pending').length || undefined },
    { key: 'services', label: 'الخدمات', icon: Wrench },
    { key: 'nurses', label: 'الممرضين', icon: Users },
    { key: 'beneficiaries', label: 'المستفيدين', icon: Heart },
    { key: 'requests', label: 'الطلبات', icon: ClipboardList },
    { key: 'emergency', label: 'الطوارئ', icon: AlertTriangle, badge: emergencyRequests.filter((e: any) => e.status === 'pending').length || undefined },
    { key: 'payments', label: 'المدفوعات', icon: CreditCard },
    { key: 'coupons', label: 'الكوبونات', icon: Tag },
    { key: 'ratings', label: 'التقييمات', icon: Star },
    { key: 'reports', label: 'التقارير', icon: BarChart3 },
    { key: 'activity', label: 'النشاط', icon: Activity },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ]

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
              <p className="text-amber-100 text-xs">لوحة تحكم الإدارة</p>
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
            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{(user as any)?.name || 'المدير'}</p><p className="text-gray-400 text-xs">مدير النظام</p></div>
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

                    {/* Emergency Badge */}
                    {emergencyRequests.filter((e: any) => e.status === 'pending').length > 0 && (
                      <motion.div variants={cardVariants} initial="hidden" animate="visible">
                        <Card className="border-0 shadow-lg shadow-red-500/20 bg-gradient-to-l from-red-500 to-orange-500 text-white overflow-hidden relative">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse"><AlertTriangle className="w-5 h-5 text-white" /></div>
                            <div className="flex-1"><p className="font-bold text-lg">{emergencyRequests.filter((e: any) => e.status === 'pending').length} طلب طوارئ</p><p className="text-red-100 text-xs">طلبات تتطلب اهتمام فوري</p></div>
                            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => setActiveTab('emergency')}>عرض التفاصيل</Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

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
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الخدمات</h1><p className="text-gray-500 text-sm mt-1">إضافة وتعديل وحذف الخدمات</p></div>
                      <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300" onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', category: 'عام', isActive: true }); setServiceDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة خدمة</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.map((svc: any) => (
                        <motion.div key={svc.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                            <CardContent className="p-4 relative z-10">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md"><Wrench className="w-5 h-5 text-white" /></div><div><p className="font-bold">{svc.name}</p><Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 border mt-0.5">{svc.category}</Badge></div></div>
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
                    {services.length === 0 && <div className="text-center py-16"><Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا توجد خدمات</p></div>}
                  </div>
                )}

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
                                          {isExpired && <Badge className="bg-gradient-to-l from-red-500 to-rose-500 text-white border-0 text-[10px] font-bold px-2 py-0.5"><AlertTriangle className="w-3 h-3 ml-0.5" />ترخيص منتهي</Badge>}
                                        </div>
                                        {/* Quick Info Row */}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{n.phone}</span>
                                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{n.location}</span>
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
                                  <p className="text-sm text-gray-500 mt-1">{b.phone} • {b.location}</p>
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
                    TAB 5: الطلبات (Requests)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">إدارة الطلبات</h1><p className="text-gray-500 text-sm mt-1">مراجعة ومعالجة الطلبات</p></div>
                      {selectedRequestIds.length > 0 && <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={handleBulkApprove}><CheckCircle className="w-4 h-4 ml-2" />قبول المحدد ({selectedRequestIds.length})</Button>}
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="بحث..." value={requestSearch} onChange={e => setRequestSearch(e.target.value)} className="pr-9 border-amber-200" /></div>
                      <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}><SelectTrigger className="w-40 border-amber-200"><SelectValue placeholder="الحالة" /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="pending">قيد الانتظار</SelectItem><SelectItem value="approved">مقبول</SelectItem><SelectItem value="in_progress">قيد التنفيذ</SelectItem><SelectItem value="completed">مكتمل</SelectItem><SelectItem value="cancelled">ملغي</SelectItem></SelectContent></Select>
                      <Select value={requestServiceFilter} onValueChange={setRequestServiceFilter}><SelectTrigger className="w-40 border-amber-200"><SelectValue placeholder="الخدمة" /></SelectTrigger><SelectContent><SelectItem value="all">كل الخدمات</SelectItem>{services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                      {filteredRequests.map((r: any) => (
                        <motion.div key={r.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${r.isEmergency ? 'ring-2 ring-red-400' : ''}`}>
                            {/* Status gradient left border */}
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${
                              r.status === 'pending' ? 'bg-gradient-to-b from-amber-400 to-orange-500' :
                              r.status === 'approved' ? 'bg-gradient-to-b from-blue-400 to-indigo-500' :
                              r.status === 'in_progress' ? 'bg-gradient-to-b from-cyan-400 to-teal-500' :
                              r.status === 'completed' ? 'bg-gradient-to-b from-emerald-400 to-green-500' :
                              r.status === 'rejected' || r.status === 'cancelled' ? 'bg-gradient-to-b from-red-400 to-rose-500' :
                              'bg-gray-300'
                            }`} />
                            <CardContent className="p-4 relative">
                              <div className="flex items-start gap-3">
                                {r.status === 'pending' && (
                                  <button onClick={() => toggleRequestSelection(r.id)} className="mt-1 shrink-0">
                                    {selectedRequestIds.includes(r.id) ? <CheckCircle className="w-5 h-5 text-amber-500" /> : <div className="w-5 h-5 rounded border-2 border-gray-300" />}
                                  </button>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold">{r.service?.name || 'خدمة غير محددة'}</p>
                                    <Badge className={`${getStatusColor(r.status)} border text-xs font-bold px-2.5 py-0.5`}>{getStatusLabel(r.status)}</Badge>
                                    {r.isEmergency && <Badge className="bg-red-500 text-white border-0 text-xs animate-pulse"><AlertTriangle className="w-3 h-3 ml-1" />طوارئ</Badge>}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">المستفيد: {r.beneficiary?.name || 'غير محدد'} {r.beneficiary?.phone && `• ${r.beneficiary.phone}`}</p>
                                  {r.assignment?.nurse && <p className="text-sm text-emerald-600">الممرض: {r.assignment.nurse.firstName} {r.assignment.nurse.lastName}</p>}
                                  {r.notes && <p className="text-sm text-gray-400 mt-1">{r.notes}</p>}
                                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.createdAt)}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {r.status === 'pending' && (<><Button size="sm" className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={() => handleRequestAction(r.id, 'approved')}><CheckCircle className="w-3.5 h-3.5 ml-1" />قبول</Button><Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleRequestAction(r.id, 'rejected')}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button></>)}
                                  {r.status === 'approved' && <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleOpenApproveDialog(r)}><UserPlus className="w-3.5 h-3.5 ml-1" />تعيين ممرض</Button>}
                                  {r.status === 'in_progress' && <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={async () => { await fetch(`/api/admin/requests/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }); toast({ title: 'تم إكمال الطلب' }); fetchData() }}><CheckCircle className="w-3.5 h-3.5 ml-1" />إكمال</Button>}
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
                                      {req.address && <p className="text-gray-600"><span className="font-medium">العنوان:</span> {req.address}</p>}
                                      {req.notes && <p className="text-gray-500"><span className="font-medium">ملاحظات:</span> {req.notes}</p>}
                                      {req.nurseName && <p className="text-blue-600"><span className="font-medium">الممرض المعين:</span> {req.nurseName}</p>}
                                      <p className="text-gray-400 text-xs">{formatDateTime(req.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 shrink-0">
                                    {req.status === 'pending' && (
                                      <>
                                        <Button size="sm" className="bg-gradient-to-l from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25" onClick={() => { setSelectedRequest(req); setApproveMode('assign'); setSelectedNurseId(''); setApproveDialog(true) }}><UserPlus className="w-3.5 h-3.5 ml-1" />تعيين ممرض</Button>
                                        <Button size="sm" className="bg-gradient-to-l from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25" onClick={async () => {
                                          await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'in_progress' }) })
                                          toast({ title: 'تم بدء المعالجة' })
                                          fetchData()
                                        }}><Activity className="w-3.5 h-3.5 ml-1" />بدء المعالجة</Button>
                                        <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={async () => {
                                          await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'rejected' }) })
                                          toast({ title: 'تم رفض الطلب' })
                                          fetchData()
                                        }}><XCircle className="w-3.5 h-3.5 ml-1" />رفض</Button>
                                      </>
                                    )}
                                    {req.status === 'in_progress' && (
                                      <Button size="sm" className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25" onClick={async () => {
                                        await fetch('/api/admin/emergency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: req.id, status: 'completed' }) })
                                        toast({ title: 'تم إكمال المعالجة' })
                                        fetchData()
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
                    <div className="flex items-center justify-between">
                      <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">طرق الدفع</h1><p className="text-gray-500 text-sm mt-1">إدارة طرق الدفع المتاحة</p></div>
                      <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => { setEditingPayment(null); setPaymentForm({ name: '', accountInfo: '', isActive: true }); setPaymentDialog(true) }}><Plus className="w-4 h-4 ml-2" />إضافة طريقة دفع</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {payments.map((p: any) => (
                        <motion.div key={p.id} variants={cardVariants} initial="hidden" animate="visible">
                          <Card className="border-0 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md"><CreditCard className="w-5 h-5 text-white" /></div><p className="font-bold">{p.name}</p></div>
                                <Badge className={`${getStatusColor(p.isActive ? 'active' : 'suspended')} border text-xs`}>{p.isActive ? 'نشطة' : 'معطلة'}</Badge>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">{p.accountInfo}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingPayment(p); setPaymentForm({ name: p.name, accountInfo: p.accountInfo, isActive: p.isActive }); setPaymentDialog(true) }}><Pencil className="w-3.5 h-3.5 ml-1" />تعديل</Button>
                                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDeletePayment(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {payments.length === 0 && <div className="text-center py-16"><CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">لا توجد طرق دفع</p></div>}
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
                    TAB 9: التقارير (Reports)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'reports' && stats && (
                  <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">التقارير والإحصائيات</h1><p className="text-gray-500 text-sm mt-1">تحليلات مفصلة عن أداء النظام</p></div>

                    {/* Service Popularity Chart */}
                    {servicePopularity.length > 0 && (
                      <Card className="border-0 shadow-lg shadow-amber-500/10">
                        <CardHeader className="pb-2"><CardTitle className="text-lg">شعبية الخدمات</CardTitle></CardHeader>
                        <CardContent>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={servicePopularity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
                                <XAxis type="number" fontSize={12} />
                                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                                <RTooltip />
                                <defs><linearGradient id="svcGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient></defs>
                                <Bar dataKey="count" fill="url(#svcGrad)" radius={[0, 8, 8, 0]} name="عدد الطلبات" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Nurse Performance Chart */}
                    {nursePerformance.length > 0 && (
                      <Card className="border-0 shadow-lg shadow-amber-500/10">
                        <CardHeader className="pb-2"><CardTitle className="text-lg">أداء الممرضين</CardTitle></CardHeader>
                        <CardContent>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={nursePerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
                                <XAxis dataKey="name" fontSize={11} />
                                <YAxis fontSize={12} />
                                <RTooltip />
                                <defs><linearGradient id="assignGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs>
                                <defs><linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
                                <Bar dataKey="assignments" fill="url(#assignGrad)" radius={[8, 8, 0, 0]} name="التعيينات" />
                                <Bar dataKey="completed" fill="url(#compGrad)" radius={[8, 8, 0, 0]} name="المكتملة" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Revenue Overview */}
                    <Card className="border-0 shadow-lg shadow-amber-500/10">
                      <CardHeader className="pb-2"><CardTitle className="text-lg">نظرة عامة على الإيرادات</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f0eb" />
                              <XAxis dataKey="name" fontSize={12} />
                              <YAxis fontSize={12} />
                              <RTooltip formatter={(value: number) => formatPrice(value)} />
                              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
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
                    TAB 11: الإعدادات (Settings) — REDESIGNED
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

                    {/* Emergency Settings */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-red-500" />إعدادات الطوارئ</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div><Label>رقم هاتف الطوارئ</Label><Input value={settings.emergencyPhone || ''} onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })} placeholder="أدخل رقم الطوارئ" className="border-amber-200 mt-1" /></div>
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => handleSaveSettings({ emergencyPhone: settings.emergencyPhone })}>حفظ رقم الطوارئ</Button>
                      </CardContent>
                    </Card>

                    {/* Referral Settings */}
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
                        <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => handleSaveSettings({ referralEnabled: settings.referralEnabled, referralBonusPoints: settings.referralBonusPoints, referralBonusPointsReceiver: settings.referralBonusPointsReceiver })}>حفظ إعدادات الإحالة</Button>
                      </CardContent>
                    </Card>

                    {/* Sub-Admins Section */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2"><UsersRound className="w-5 h-5 text-amber-500" />المسؤولون الفرعيون</CardTitle>
                          <Button size="sm" className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25" onClick={() => { setEditingSubAdmin(null); setSubAdminForm({ name: '', phone: '', password: '', permissions: { services: false, nurses: false, beneficiaries: false, requests: false, payments: false, coupons: false, reports: false } }); setSubAdminDialog(true) }}><Plus className="w-4 h-4 ml-1" />إضافة</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {subAdmins.length > 0 ? (
                          <div className="space-y-3">
                            {subAdmins.map((sa: any) => (
                              <div key={sa.id} className="flex items-center gap-3 p-3 bg-amber-50/30 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md"><UserCog className="w-5 h-5 text-white" /></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{sa.name}</p>
                                  <p className="text-xs text-gray-500">{sa.phone}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {Object.entries(sa.permissions || {}).filter(([, v]) => v).map(([k]) => (
                                      <Badge key={k} variant="outline" className="text-[10px] px-1.5 py-0">{k === 'services' ? 'الخدمات' : k === 'nurses' ? 'الممرضين' : k === 'beneficiaries' ? 'المستفيدين' : k === 'requests' ? 'الطلبات' : k === 'payments' ? 'المدفوعات' : k === 'coupons' ? 'الكوبونات' : k === 'reports' ? 'التقارير' : k}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => { setEditingSubAdmin(sa); setSubAdminForm({ name: sa.name, phone: sa.phone, password: '', permissions: sa.permissions || {} }); setSubAdminDialog(true) }}><Pencil className="w-3.5 h-3.5" /></Button>
                                  <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteSubAdmin(sa.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-gray-400 text-center py-4">لا يوجد مسؤولون فرعيون</p>}
                      </CardContent>
                    </Card>
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
              <div><Label>الفئة</Label><Select value={serviceForm.category} onValueChange={v => setServiceForm({ ...serviceForm, category: v })}><SelectTrigger className="border-amber-200 mt-1"><SelectValue placeholder="اختر الفئة" /></SelectTrigger><SelectContent><SelectItem value="تمريض منزلي">تمريض منزلي</SelectItem><SelectItem value="رعاية المسنين">رعاية المسنين</SelectItem><SelectItem value="رعاية الأم والطفل">رعاية الأم والطفل</SelectItem><SelectItem value="علاج طبيعي">علاج طبيعي</SelectItem><SelectItem value="إسعافات أولية">إسعافات أولية</SelectItem><SelectItem value="حقن ومحاليل">حقن ومحاليل</SelectItem><SelectItem value="فحوصات مخبرية">فحوصات مخبرية</SelectItem><SelectItem value="قياسات حيوية">قياسات حيوية</SelectItem><SelectItem value="عناية بالجروح">عناية بالجروح</SelectItem><SelectItem value="رعاية نفسية">رعاية نفسية</SelectItem><SelectItem value="عام">عام</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl"><Label>خدمة نشطة</Label><Switch checked={serviceForm.isActive} onCheckedChange={v => setServiceForm({ ...serviceForm, isActive: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setServiceDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSaveService}>{editingService ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingPayment ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>الاسم *</Label><Input value={paymentForm.name} onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>معلومات الحساب *</Label><Textarea value={paymentForm.accountInfo} onChange={e => setPaymentForm({ ...paymentForm, accountInfo: e.target.value })} className="border-amber-200 mt-1" /></div>
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

      {/* Approve Request Dialog — with TWO options */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>قبول الطلب</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {selectedRequest && (
              <div className="p-3 bg-amber-50/50 rounded-xl">
                <p className="font-medium">{selectedRequest.service?.name || 'خدمة'}</p>
                <p className="text-sm text-gray-500">المستفيد: {selectedRequest.beneficiary?.name || 'غير محدد'}</p>
              </div>
            )}

            {/* Option A: Assign Nurse */}
            <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${approveMode === 'assign' ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200'}`} onClick={() => setApproveMode('assign')}>
              <div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-amber-500" /><p className="font-bold">تعيين ممرض</p></div>
              <p className="text-sm text-gray-500">اختيار ممرض معتمد وتعيينه للطلب</p>
              {approveMode === 'assign' && (
                <div className="mt-3">
                  <Label>اختر الممرض</Label>
                  <Select value={selectedNurseId} onValueChange={setSelectedNurseId}>
                    <SelectTrigger className="border-amber-200 mt-1"><SelectValue placeholder="اختر ممرض" /></SelectTrigger>
                    <SelectContent>{approvedNurses.map((n: any) => <SelectItem key={n.id} value={n.id}>{n.firstName} {n.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Option B: Direct Execution */}
            <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${approveMode === 'direct' ? 'border-rose-500 bg-rose-50/50' : 'border-gray-200'}`} onClick={() => setApproveMode('direct')}>
              <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-rose-500" /><p className="font-bold">تنفيذ مباشر</p></div>
              <p className="text-sm text-gray-500">تنفيذ الطلب مباشرة من قبل الإدارة</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>إلغاء</Button>
            <Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleConfirmApprove}>
              {approveMode === 'assign' ? 'تعيين وتأكيد' : 'تنفيذ مباشر'}
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
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
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
                  {/* Registration Date */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>تاريخ التسجيل: {formatDate(nurseDetail.createdAt)}</span>
                    <span>آخر تحديث: {formatDate(nurseDetail.updatedAt)}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
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
                  </div>
                </div>
              </>
            )
          })()}
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
                <div><span className="text-gray-500">الموقع:</span><p className="font-medium">{beneficiaryDetail.location}</p></div>
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

      {/* Sub-Admin Dialog */}
      <Dialog open={subAdminDialog} onOpenChange={setSubAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingSubAdmin ? 'تعديل مسؤول فرعي' : 'إضافة مسؤول فرعي'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>الاسم *</Label><Input value={subAdminForm.name} onChange={e => setSubAdminForm({ ...subAdminForm, name: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>الهاتف *</Label><Input value={subAdminForm.phone} onChange={e => setSubAdminForm({ ...subAdminForm, phone: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div><Label>{editingSubAdmin ? 'كلمة المرور (اتركه فارغاً للإبقاء)' : 'كلمة المرور *'}</Label><Input type="password" value={subAdminForm.password} onChange={e => setSubAdminForm({ ...subAdminForm, password: e.target.value })} className="border-amber-200 mt-1" /></div>
            <div>
              <Label className="mb-2 block">الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'services', label: 'الخدمات' },
                  { key: 'nurses', label: 'الممرضين' },
                  { key: 'beneficiaries', label: 'المستفيدين' },
                  { key: 'requests', label: 'الطلبات' },
                  { key: 'payments', label: 'المدفوعات' },
                  { key: 'coupons', label: 'الكوبونات' },
                  { key: 'reports', label: 'التقارير' },
                ].map(p => (
                  <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50/50 cursor-pointer">
                    <input type="checkbox" checked={!!subAdminForm.permissions[p.key as keyof typeof subAdminForm.permissions]} onChange={e => setSubAdminForm({ ...subAdminForm, permissions: { ...subAdminForm.permissions, [p.key]: e.target.checked } })} className="accent-amber-500" />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSubAdminDialog(false)}>إلغاء</Button><Button className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white" onClick={handleSaveSubAdmin}>{editingSubAdmin ? 'تحديث' : 'إضافة'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
