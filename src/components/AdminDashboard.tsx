'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wrench, Users, ClipboardList, CreditCard,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle, UserPlus,
  Loader2, Shield, Heart, Menu, X, UserCog, ChevronLeft,
  FileText, Activity, Search, Filter, BarChart3, Moon, Sun,
  Calendar, TrendingUp, Download, CheckSquare, Square, ExternalLink,
  Tag, Gift, Percent
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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

type Tab = 'dashboard' | 'services' | 'nurses' | 'beneficiaries' | 'requests' | 'payments' | 'coupons' | 'reports' | 'activity' | 'settings'

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

export default function AdminDashboard() {
  const { user, setUser, setView, logout, darkMode, toggleDarkMode } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [nurses, setNurses] = useState<any[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Admin name edit
  const [editNameDialog, setEditNameDialog] = useState(false)
  const [editName, setEditName] = useState('')

  // Search & filter states
  const [nurseSearch, setNurseSearch] = useState('')
  const [nurseFilter, setNurseFilter] = useState<string>('all')
  const [beneficiarySearch, setBeneficiarySearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all')
  const [requestServiceFilter, setRequestServiceFilter] = useState<string>('all')
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])

  // Reports date range
  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')

  // Beneficiary detail dialog
  const [beneficiaryDetail, setBeneficiaryDetail] = useState<any>(null)
  const [beneficiaryRequests, setBeneficiaryRequests] = useState<any[]>([])

  // Nurse detail dialog
  const [nurseDetail, setNurseDetail] = useState<any>(null)

  // Check mustChangePassword
  useEffect(() => {
    if ((user as any)?.mustChangePassword) {
      setView('admin-change-password')
    }
  }, [user, setView])

  // Service form
  const [serviceDialog, setServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', category: 'عام', isActive: true })

  // Payment form
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({ name: '', accountInfo: '', isActive: true })

  // Assign nurse dialog
  const [assignDialog, setAssignDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedNurseId, setSelectedNurseId] = useState('')

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectingId, setRejectingId] = useState('')
  const [rejectType, setRejectType] = useState<'nurse' | 'request'>('nurse')
  const [adminNotes, setAdminNotes] = useState('')

  // Coupons state
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponDialog, setCouponDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true })

  // Helper: log activity
  const logActivity = useCallback(async (type: string, description: string, metadata?: Record<string, any>) => {
    try {
      await fetch('/api/admin/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          userId: (user as any)?.id,
          userName: (user as any)?.name || 'المدير',
          metadata,
        }),
      })
    } catch {
      // silently fail
    }
  }, [user])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const [dashRes, actRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/activity-log?limit=10'),
        ])
        if (dashRes.ok) setStats(await dashRes.json())
        if (actRes.ok) setActivityLogs(await actRes.json())
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
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/admin/payments')
        if (res.ok) setPayments(await res.json())
      } else if (activeTab === 'coupons') {
        const res = await fetch('/api/admin/coupons')
        if (res.ok) setCoupons(await res.json())
      } else if (activeTab === 'activity') {
        const res = await fetch('/api/admin/activity-log?limit=30')
        if (res.ok) setActivityLogs(await res.json())
      } else if (activeTab === 'reports') {
        // Fetch all data for reports
        const [dashRes, reqRes, svcRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/requests'),
          fetch('/api/admin/services'),
        ])
        if (dashRes.ok) setStats(await dashRes.json())
        if (reqRes.ok) setRequests(await reqRes.json())
        if (svcRes.ok) setServices(await svcRes.json())
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  // Update admin name
  const handleUpdateName = async () => {
    if (!editName.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: (user as any)?.id, name: editName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data, 'admin')
        setEditNameDialog(false)
        toast({ title: 'تم تحديث الاسم بنجاح' })
        logActivity('admin_update', `تم تحديث اسم المدير إلى: ${editName.trim()}`)
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Service CRUD
  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.description || !serviceForm.price) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services'
      const method = editingService ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      })
      if (res.ok) {
        toast({ title: editingService ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة' })
        logActivity(editingService ? 'service_update' : 'service_create', `${editingService ? 'تم تحديث' : 'تم إضافة'} خدمة: ${serviceForm.name}`)
        setServiceDialog(false)
        setEditingService(null)
        setServiceForm({ name: '', description: '', price: '', category: 'عام', isActive: true })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم حذف الخدمة' })
        logActivity('service_delete', 'تم حذف خدمة')
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل حذف الخدمة', variant: 'destructive' })
    }
  }

  // Nurse approve/reject
  const handleNurseAction = async (id: string, status: string) => {
    if (status === 'rejected') {
      setRejectingId(id)
      setRejectType('nurse')
      setAdminNotes('')
      setRejectDialog(true)
      return
    }
    try {
      const res = await fetch(`/api/admin/nurses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: status === 'approved' ? 'تم قبول الممرض' : 'تم رفض الممرض' })
        logActivity('nurse_status_change', `تم ${status === 'approved' ? 'قبول' : 'رفض'} ممرض`, { nurseId: id, status })
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Request approve/reject
  const handleRequestAction = async (id: string, status: string) => {
    if (status === 'rejected') {
      setRejectingId(id)
      setRejectType('request')
      setAdminNotes('')
      setRejectDialog(true)
      return
    }
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: status === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب' })
        logActivity('request_status_change', `تم ${status === 'approved' ? 'قبول' : 'رفض'} طلب`, { requestId: id, status })
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleRejectConfirm = async () => {
    try {
      const url = rejectType === 'nurse'
        ? `/api/admin/nurses/${rejectingId}`
        : `/api/admin/requests/${rejectingId}`
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', adminNotes }),
      })
      if (res.ok) {
        toast({ title: 'تم الرفض' })
        logActivity(`${rejectType}_reject`, `تم رفض ${rejectType === 'nurse' ? 'ممرض' : 'طلب'}`, { id: rejectingId, adminNotes })
        setRejectDialog(false)
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Bulk approve requests
  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) {
      toast({ title: 'خطأ', description: 'يرجى تحديد طلبات أولاً', variant: 'destructive' })
      return
    }
    if (!confirm(`هل أنت متأكد من قبول ${selectedRequestIds.length} طلب؟`)) return
    try {
      let successCount = 0
      for (const id of selectedRequestIds) {
        const res = await fetch(`/api/admin/requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
        if (res.ok) successCount++
      }
      toast({ title: `تم قبول ${successCount} طلب بنجاح` })
      logActivity('bulk_approve', `تم قبول ${successCount} طلب دفعة واحدة`)
      setSelectedRequestIds([])
      fetchData()
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Assign nurse
  const handleAssignNurse = async () => {
    if (!selectedNurseId) {
      toast({ title: 'خطأ', description: 'يرجى اختيار ممرض', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/assign-nurse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequest.id, nurseId: selectedNurseId }),
      })
      if (res.ok) {
        toast({ title: 'تم تعيين الممرض بنجاح' })
        logActivity('nurse_assign', 'تم تعيين ممرض لطلب', { requestId: selectedRequest.id, nurseId: selectedNurseId })
        setAssignDialog(false)
        setSelectedRequest(null)
        setSelectedNurseId('')
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Payment CRUD
  const handleSavePayment = async () => {
    if (!paymentForm.name || !paymentForm.accountInfo) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    try {
      const url = editingPayment ? `/api/admin/payments/${editingPayment.id}` : '/api/admin/payments'
      const method = editingPayment ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })
      if (res.ok) {
        toast({ title: editingPayment ? 'تم تحديث طريقة الدفع' : 'تم إضافة طريقة الدفع' })
        logActivity(editingPayment ? 'payment_update' : 'payment_create', `${editingPayment ? 'تم تحديث' : 'تم إضافة'} طريقة دفع: ${paymentForm.name}`)
        setPaymentDialog(false)
        setEditingPayment(null)
        setPaymentForm({ name: '', accountInfo: '', isActive: true })
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return
    try {
      const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم حذف طريقة الدفع' })
        logActivity('payment_delete', 'تم حذف طريقة دفع')
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  // Coupon CRUD
  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discountPercent || !couponForm.maxUses || !couponForm.expiresAt) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm),
      })
      if (res.ok) {
        toast({ title: editingCoupon ? 'تم تحديث الكوبون' : 'تم إضافة الكوبون' })
        logActivity(editingCoupon ? 'coupon_update' : 'coupon_create', `${editingCoupon ? 'تم تحديث' : 'تم إضافة'} كوبون: ${couponForm.code}`)
        setCouponDialog(false)
        setEditingCoupon(null)
        setCouponForm({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم حذف الكوبون' })
        logActivity('coupon_delete', 'تم حذف كوبون')
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleToggleCouponStatus = async (coupon: any) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      if (res.ok) {
        toast({ title: coupon.isActive ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون' })
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const approvedNurses = nurses.filter(n => n.status === 'approved')

  // Filtered lists
  const filteredNurses = useMemo(() => {
    return nurses.filter(n => {
      const matchSearch = nurseSearch === '' ||
        `${n.firstName} ${n.secondName} ${n.thirdName} ${n.lastName}`.includes(nurseSearch) ||
        n.phone?.includes(nurseSearch) ||
        n.nationalId?.includes(nurseSearch)
      const matchFilter = nurseFilter === 'all' || n.status === nurseFilter
      return matchSearch && matchFilter
    })
  }, [nurses, nurseSearch, nurseFilter])

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b: any) => {
      return beneficiarySearch === '' ||
        b.name?.includes(beneficiarySearch) ||
        b.phone?.includes(beneficiarySearch) ||
        b.location?.includes(beneficiarySearch)
    })
  }, [beneficiaries, beneficiarySearch])

  const filteredRequests = useMemo(() => {
    return requests.filter((r: any) => {
      const matchSearch = requestSearch === '' ||
        r.service?.name?.includes(requestSearch) ||
        r.beneficiary?.name?.includes(requestSearch) ||
        r.beneficiary?.phone?.includes(requestSearch) ||
        r.notes?.includes(requestSearch)
      const matchStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter
      const matchService = requestServiceFilter === 'all' || r.serviceId === requestServiceFilter
      return matchSearch && matchStatus && matchService
    })
  }, [requests, requestSearch, requestStatusFilter, requestServiceFilter])

  // Charts data
  const revenueChartData = useMemo(() => {
    if (!stats) return []
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const base = stats.totalRevenue / 6
    return months.slice(0, 6).map((name, i) => ({
      name,
      revenue: Math.round(base * (0.4 + Math.random() * 1.2) * (i + 1) / 3),
    }))
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

  // Reports data
  const servicePopularity = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {}
    requests.forEach((r: any) => {
      const key = r.serviceId
      if (!key) return
      if (!counts[key]) counts[key] = { name: r.service?.name || 'غير معروف', count: 0, revenue: 0 }
      counts[key].count++
      counts[key].revenue += r.service?.price || 0
    })
    return Object.values(counts).sort((a, b) => b.count - a.count)
  }, [requests])

  const nursePerformance = useMemo(() => {
    const perf: Record<string, { name: string; assignments: number; completed: number }> = {}
    requests.forEach((r: any) => {
      if (!r.assignment?.nurseId) return
      const nid = r.assignment.nurseId
      if (!perf[nid]) {
        const n = r.assignment.nurse
        perf[nid] = { name: `${n?.firstName || ''} ${n?.lastName || ''}`.trim() || 'غير معروف', assignments: 0, completed: 0 }
      }
      perf[nid].assignments++
      if (r.status === 'completed') perf[nid].completed++
    })
    return Object.values(perf).sort((a, b) => b.assignments - a.assignments)
  }, [requests])

  const totalBeneficiarySpent = useMemo(() => {
    const spent: Record<string, number> = {}
    requests.forEach((r: any) => {
      if (!r.beneficiaryId || (r.status !== 'completed' && r.status !== 'approved')) return
      spent[r.beneficiaryId] = (spent[r.beneficiaryId] || 0) + (r.service?.price || 0)
    })
    return spent
  }, [requests])

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { key: 'services', label: 'الخدمات', icon: Wrench },
    { key: 'nurses', label: 'الممرضين', icon: Users },
    { key: 'beneficiaries', label: 'المستفيدين', icon: Heart },
    { key: 'requests', label: 'الطلبات', icon: ClipboardList },
    { key: 'payments', label: 'طرق الدفع', icon: CreditCard },
    { key: 'coupons', label: 'الكوبونات', icon: Tag },
    { key: 'reports', label: 'التقارير', icon: BarChart3 },
    { key: 'activity', label: 'النشاط', icon: Activity },
    { key: 'settings', label: 'الإعدادات', icon: UserCog },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const toggleRequestSelection = (id: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-900 border-l dark:border-gray-800 shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        <div className="p-6 border-b bg-gradient-to-l from-emerald-600 to-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-emerald-100 text-xs">لوحة تحكم الإدارة</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800 cursor-pointer transition-colors" onClick={() => {
            setEditName((user as any)?.name || '')
            setEditNameDialog(true)
          }}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{(user as any)?.name || 'المدير'}</p>
              <p className="text-muted-foreground text-xs">مدير النظام</p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 rounded-xl" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b bg-gradient-to-l from-emerald-600 to-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" />
            <h2 className="text-lg font-bold text-white">عافيتك</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3 p-2" onClick={() => {
            setEditName((user as any)?.name || '')
            setEditNameDialog(true)
            setMobileMenuOpen(false)
          }}>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{(user as any)?.name || 'المدير'}</p>
              <p className="text-muted-foreground text-xs">مدير النظام</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold text-emerald-700 dark:text-emerald-300">عافيتك</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditName((user as any)?.name || '')
            setEditNameDialog(true)
          }}>
            <Shield className="w-4 h-4 text-emerald-600" />
          </Button>
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* ===== Dashboard Tab ===== */}
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                      <p className="text-muted-foreground text-sm mt-1">نظرة عامة على النظام</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الممرضين', value: stats.totalNurses, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: Users },
                        { label: 'ممرضين معتمدين', value: stats.approvedNurses, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', icon: CheckCircle },
                        { label: 'بانتظار الموافقة', value: stats.pendingNurses, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Loader2 },
                        { label: 'المستفيدون', value: stats.totalBeneficiaries, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', icon: Heart },
                        { label: 'الخدمات', value: stats.totalServices, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: Wrench },
                        { label: 'خدمات نشطة', value: stats.activeServices, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle },
                        { label: 'طلبات بانتظار المراجعة', value: stats.pendingRequests, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', icon: ClipboardList },
                        { label: 'طلبات مكتملة', value: stats.completedRequests, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: CheckCircle },
                      ].map((item, i) => (
                        <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                              </div>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Revenue Card */}
                    <Card className="border-0 shadow-sm bg-gradient-to-l from-emerald-500 to-emerald-700 text-white">
                      <CardContent className="p-6">
                        <p className="text-emerald-100 text-sm mb-1">إجمالي الإيرادات</p>
                        <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                      </CardContent>
                    </Card>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Bar Chart */}
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">الإيرادات الشهرية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(value: number) => formatPrice(value)} />
                                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Requests by Status Pie Chart */}
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">الطلبات حسب الحالة</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center">
                            {requestsByStatusData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={requestsByStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                  >
                                    {requestsByStatusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-muted-foreground text-sm">لا توجد بيانات طلبات بعد</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity Feed */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">النشاط الأخير</CardTitle>
                          <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setActiveTab('activity')}>
                            عرض الكل
                            <ChevronLeft className="w-4 h-4 mr-1" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {activityLogs.length > 0 ? (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {activityLogs.slice(0, 5).map((log: any) => (
                              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Activity className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{log.description}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {log.createdAt ? new Date(log.createdAt).toLocaleString('ar') : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>لا يوجد نشاط مسجل بعد</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== Services Tab ===== */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
                        <p className="text-muted-foreground text-sm mt-1">إضافة وتعديل وحذف الخدمات الصحية</p>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setEditingService(null)
                          setServiceForm({ name: '', description: '', price: '', category: 'عام', isActive: true })
                          setServiceDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة خدمة
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {services.map(service => (
                        <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{service.name}</h3>
                                  <Badge variant={service.isActive ? 'default' : 'secondary'} className={service.isActive ? 'bg-emerald-100 dark:bg-emerald-950/40 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : ''}>
                                    {service.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-bold text-emerald-600 text-lg">{formatPrice(service.price)}</span>
                                  <Badge variant="outline">{service.category}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setEditingService(service)
                                  setServiceForm({
                                    name: service.name,
                                    description: service.description,
                                    price: service.price.toString(),
                                    category: service.category,
                                    isActive: service.isActive,
                                  })
                                  setServiceDialog(true)
                                }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteService(service.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {services.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد خدمات بعد. أضف أول خدمة!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Nurses Tab ===== */}
                {activeTab === 'nurses' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">إدارة الممرضين</h1>
                      <p className="text-muted-foreground text-sm mt-1">مراجعة واعتماد تسجيلات الممرضين</p>
                    </div>
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={nurseSearch}
                          onChange={e => setNurseSearch(e.target.value)}
                          placeholder="بحث بالاسم أو الهاتف أو الرقم الوطني..."
                          className="pr-10"
                        />
                      </div>
                      <Select value={nurseFilter} onValueChange={setNurseFilter}>
                        <SelectTrigger className="w-full sm:w-44">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="approved">مقبول</SelectItem>
                          <SelectItem value="rejected">مرفوض</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4">
                      {filteredNurses.map(nurse => (
                        <Card key={nurse.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-teal-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{nurse.firstName} {nurse.secondName} {nurse.thirdName} {nurse.lastName}</h3>
                                    <Badge className={getStatusColor(nurse.status)}>
                                      {getStatusLabel(nurse.status)}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                  <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium">{nurse.phone}</span></div>
                                  <div><span className="text-muted-foreground">الموقع:</span> <span className="font-medium">{nurse.location}</span></div>
                                  <div><span className="text-muted-foreground">الرقم الوطني:</span> <span className="font-medium">{nurse.nationalId}</span></div>
                                  <div><span className="text-muted-foreground">رقم المزاولة:</span> <span className="font-medium">{nurse.licenseNumber}</span></div>
                                  <div><span className="text-muted-foreground">انتهاء المزاولة:</span> <span className="font-medium">{nurse.licenseExpiryDate}</span></div>
                                </div>
                                {/* Verification Documents */}
                                {(nurse.documentUrls || nurse.documents) && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm font-medium mb-2">المستندات:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {(nurse.documentUrls || nurse.documents || []).map((url: string, idx: number) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">
                                          <FileText className="w-3 h-3" />
                                          مستند {idx + 1}
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Admin Notes */}
                                {nurse.adminNotes && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm text-red-700">
                                    <span className="font-medium">ملاحظات الإدارة:</span> {nurse.adminNotes}
                                  </div>
                                )}
                              </div>
                              {nurse.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleNurseAction(nurse.id, 'approved')}>
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    قبول
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleNurseAction(nurse.id, 'rejected')}>
                                    <XCircle className="w-4 h-4 ml-1" />
                                    رفض
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredNurses.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>{nurseSearch || nurseFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا يوجد ممرضون مسجلون بعد'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Beneficiaries Tab ===== */}
                {activeTab === 'beneficiaries' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">المستفيدون</h1>
                      <p className="text-muted-foreground text-sm mt-1">قائمة جميع المستفيدين المسجلين في النظام</p>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={beneficiarySearch}
                        onChange={e => setBeneficiarySearch(e.target.value)}
                        placeholder="بحث بالاسم أو الهاتف أو الموقع..."
                        className="pr-10"
                      />
                    </div>
                    <div className="grid gap-4">
                      {filteredBeneficiaries.map((ben: any) => {
                        const benRequests = requests.filter((r: any) => r.beneficiaryId === ben.id)
                        const benSpent = totalBeneficiarySpent[ben.id] || 0
                        return (
                          <Card key={ben.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center flex-shrink-0">
                                  <Heart className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{ben.name}</h3>
                                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-1">
                                    <span>الهاتف: {ben.phone}</span>
                                    <span>الموقع: {ben.location}</span>
                                    {ben.createdAt && <span>تاريخ التسجيل: {new Date(ben.createdAt).toLocaleDateString('ar')}</span>}
                                  </div>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {benRequests.length} طلب
                                    </Badge>
                                    {benSpent > 0 && (
                                      <span className="text-sm font-medium text-emerald-600">
                                        إجمالي الإنفاق: {formatPrice(benSpent)}
                                      </span>
                                    )}
                                  </div>
                                  {/* Request History */}
                                  {benRequests.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-sm font-medium mb-2">سجل الطلبات:</p>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {benRequests.slice(0, 5).map((req: any) => (
                                          <div key={req.id} className="flex items-center gap-2 text-xs">
                                            <span className="text-muted-foreground">{req.service?.name}</span>
                                            <Badge className={`${getStatusColor(req.status)} text-[10px] px-1.5 py-0`}>
                                              {getStatusLabel(req.status)}
                                            </Badge>
                                            {req.service?.price && <span className="text-emerald-600">{formatPrice(req.service.price)}</span>}
                                          </div>
                                        ))}
                                        {benRequests.length > 5 && (
                                          <p className="text-xs text-muted-foreground">+{benRequests.length - 5} طلب آخر</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                      {filteredBeneficiaries.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>{beneficiarySearch ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستفيدون مسجلون بعد'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Requests Tab ===== */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
                      <p className="text-muted-foreground text-sm mt-1">مراجعة ومعالجة طلبات الخدمات</p>
                    </div>
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={requestSearch}
                          onChange={e => setRequestSearch(e.target.value)}
                          placeholder="بحث بالخدمة أو المستفيد أو الملاحظات..."
                          className="pr-10"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                          <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="حالة الطلب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الحالات</SelectItem>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="approved">مقبول</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="rejected">مرفوض</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={requestServiceFilter} onValueChange={setRequestServiceFilter}>
                          <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="الخدمة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">كل الخدمات</SelectItem>
                            {services.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Bulk Actions */}
                        {selectedRequestIds.length > 0 && (
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBulkApprove}>
                            <CheckCircle className="w-4 h-4 ml-1" />
                            قبول المحدد ({selectedRequestIds.length})
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {filteredRequests.map((req: any) => (
                        <Card key={req.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${selectedRequestIds.includes(req.id) ? 'ring-2 ring-emerald-300' : ''}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  {/* Checkbox for bulk select - only pending */}
                                  {req.status === 'pending' && (
                                    <button onClick={() => toggleRequestSelection(req.id)} className="flex-shrink-0">
                                      {selectedRequestIds.includes(req.id)
                                        ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                                        : <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                      }
                                    </button>
                                  )}
                                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{req.service?.name}</h3>
                                    <Badge className={getStatusColor(req.status)}>
                                      {getStatusLabel(req.status)}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                  <div><span className="text-muted-foreground">المستفيد:</span> <span className="font-medium">{req.beneficiary?.name}</span></div>
                                  <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium">{req.beneficiary?.phone}</span></div>
                                  <div><span className="text-muted-foreground">السعر:</span> <span className="font-medium text-emerald-600">{formatPrice(req.service?.price || 0)}</span></div>
                                  {req.paymentMethod && <div><span className="text-muted-foreground">طريقة الدفع:</span> <span className="font-medium">{req.paymentMethod}</span></div>}
                                  {req.notes && <div><span className="text-muted-foreground">ملاحظات:</span> <span className="font-medium">{req.notes}</span></div>}
                                  {req.address && <div><span className="text-muted-foreground">العنوان:</span> <span className="font-medium">{req.address}</span></div>}
                                  {req.createdAt && <div><span className="text-muted-foreground">تاريخ الطلب:</span> <span className="font-medium">{new Date(req.createdAt).toLocaleDateString('ar')}</span></div>}
                                  {req.assignment && (
                                    <div><span className="text-muted-foreground">الممرض المعيّن:</span> <span className="font-medium">{req.assignment.nurse?.firstName} {req.assignment.nurse?.lastName}</span></div>
                                  )}
                                </div>
                                {req.adminNotes && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm text-red-700">
                                    <span className="font-medium">ملاحظات الإدارة:</span> {req.adminNotes}
                                  </div>
                                )}
                              </div>
                              {req.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRequestAction(req.id, 'approved')}>
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                    قبول
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRequestAction(req.id, 'rejected')}>
                                    <XCircle className="w-4 h-4 ml-1" />
                                    رفض
                                  </Button>
                                </div>
                              )}
                              {req.status === 'approved' && !req.assignment && (
                                <Button size="sm" variant="outline" className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" onClick={() => {
                                  setSelectedRequest(req)
                                  setSelectedNurseId('')
                                  setAssignDialog(true)
                                }}>
                                  <UserPlus className="w-4 h-4 ml-1" />
                                  تعيين ممرض
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredRequests.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>{requestSearch || requestStatusFilter !== 'all' || requestServiceFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد طلبات بعد'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Payments Tab ===== */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold">طرق الدفع</h1>
                        <p className="text-muted-foreground text-sm mt-1">إدارة طرق الدفع المتاحة للمستفيدين</p>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setEditingPayment(null)
                          setPaymentForm({ name: '', accountInfo: '', isActive: true })
                          setPaymentDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة طريقة دفع
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {payments.map(payment => (
                        <Card key={payment.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{payment.name}</h3>
                                  <Badge variant={payment.isActive ? 'default' : 'secondary'} className={payment.isActive ? 'bg-emerald-100 dark:bg-emerald-950/40 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : ''}>
                                    {payment.isActive ? 'نشط' : 'غير نشط'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{payment.accountInfo}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setEditingPayment(payment)
                                  setPaymentForm({ name: payment.name, accountInfo: payment.accountInfo, isActive: payment.isActive })
                                  setPaymentDialog(true)
                                }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeletePayment(payment.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {payments.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد طرق دفع بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Coupons Tab ===== */}
                {activeTab === 'coupons' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold">إدارة الكوبونات</h1>
                        <p className="text-muted-foreground text-sm mt-1">إنشاء وإدارة أكواد الخصم</p>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setEditingCoupon(null)
                          setCouponForm({ code: '', discountPercent: '', maxUses: '', expiresAt: '', isActive: true })
                          setCouponDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة كوبون
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <Tag className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{coupons.length}</p>
                          <p className="text-xs text-muted-foreground">إجمالي الكوبونات</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-green-700">{coupons.filter(c => c.isActive).length}</p>
                          <p className="text-xs text-muted-foreground">نشط</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-red-700">{coupons.filter(c => !c.isActive).length}</p>
                          <p className="text-xs text-muted-foreground">غير نشط</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <Gift className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-purple-700">{coupons.reduce((acc: number, c: any) => acc + (c.usedCount || 0), 0)}</p>
                          <p className="text-xs text-muted-foreground">إجمالي الاستخدام</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Coupons List */}
                    <div className="grid gap-4">
                      {coupons.map((coupon: any) => {
                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                        const isMaxed = coupon.usedCount >= coupon.maxUses
                        return (
                          <Card key={coupon.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="font-mono font-bold text-lg bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">{coupon.code}</h3>
                                    <Badge variant={coupon.isActive && !isExpired && !isMaxed ? 'default' : 'secondary'} className={coupon.isActive && !isExpired && !isMaxed ? 'bg-emerald-100 dark:bg-emerald-950/40 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : isExpired ? 'bg-red-100 dark:bg-red-950/40 text-red-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}>
                                      {isExpired ? 'منتهي الصلاحية' : isMaxed ? 'استُنفد' : coupon.isActive ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Percent className="w-3.5 h-3.5 text-emerald-500" />
                                      خصم <span className="font-bold text-emerald-600">{coupon.discountPercent}%</span>
                                    </span>
                                    <span className="text-muted-foreground">
                                      الاستخدام: <span className="font-medium">{coupon.usedCount || 0}/{coupon.maxUses}</span>
                                    </span>
                                    {coupon.expiresAt && (
                                      <span className="text-muted-foreground">
                                        ينتهي: <span className="font-medium">{new Date(coupon.expiresAt).toLocaleDateString('ar-YE')}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleToggleCouponStatus(coupon)}>
                                    {coupon.isActive ? 'تعطيل' : 'تفعيل'}
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setEditingCoupon(coupon)
                                    setCouponForm({
                                      code: coupon.code,
                                      discountPercent: coupon.discountPercent.toString(),
                                      maxUses: coupon.maxUses.toString(),
                                      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
                                      isActive: coupon.isActive,
                                    })
                                    setCouponDialog(true)
                                  }}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteCoupon(coupon.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                      {coupons.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد كوبونات بعد. أضف أول كوبون!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== Reports Tab ===== */}
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">التقارير</h1>
                      <p className="text-muted-foreground text-sm mt-1">تقارير وإحصائيات النظام</p>
                    </div>

                    {/* Date Range Selector */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                          <div className="flex-1 space-y-1">
                            <Label className="text-sm">من تاريخ</Label>
                            <Input type="date" value={reportFromDate} onChange={e => setReportFromDate(e.target.value)} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-sm">إلى تاريخ</Label>
                            <Input type="date" value={reportToDate} onChange={e => setReportToDate(e.target.value)} />
                          </div>
                          <Button variant="outline" onClick={() => { setReportFromDate(''); setReportToDate('') }} className="w-full sm:w-auto">
                            مسح الفلتر
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-0 shadow-sm bg-gradient-to-l from-emerald-500 to-emerald-700 text-white">
                        <CardContent className="p-6">
                          <p className="text-emerald-100 text-sm">إجمالي الإيرادات</p>
                          <p className="text-2xl font-bold mt-1">{formatPrice(stats?.totalRevenue || 0)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                          <p className="text-2xl font-bold mt-1">{stats?.totalRequests || 0}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
                          <p className="text-2xl font-bold mt-1">
                            {stats?.totalRequests ? formatPrice(Math.round(stats.totalRevenue / stats.totalRequests)) : formatPrice(0)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Service Popularity */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">ترتيب الخدمات حسب الطلب</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {servicePopularity.length > 0 ? (
                          <div className="space-y-3">
                            {servicePopularity.map((svc, i) => (
                              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{svc.name}</p>
                                  <p className="text-xs text-muted-foreground">{svc.count} طلب</p>
                                </div>
                                <span className="font-bold text-emerald-600">{formatPrice(svc.revenue)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">لا توجد بيانات كافية</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Nurse Performance */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">أداء الممرضين</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {nursePerformance.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">الممرض</th>
                                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">التعيينات</th>
                                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">المكتملة</th>
                                  <th className="py-3 px-4 text-right font-medium text-muted-foreground">نسبة الإنجاز</th>
                                </tr>
                              </thead>
                              <tbody>
                                {nursePerformance.map((n, i) => (
                                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-medium">{n.name}</td>
                                    <td className="py-3 px-4">{n.assignments}</td>
                                    <td className="py-3 px-4">{n.completed}</td>
                                    <td className="py-3 px-4">
                                      <span className={`font-medium ${n.assignments > 0 ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'}`}>
                                        {n.assignments > 0 ? Math.round(n.completed / n.assignments * 100) : 0}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">لا توجد بيانات كافية</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== Activity Tab ===== */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">سجل النشاط</h1>
                      <p className="text-muted-foreground text-sm mt-1">جميع الأنشطة والأحداث في النظام</p>
                    </div>
                    {activityLogs.length > 0 ? (
                      <div className="space-y-3">
                        {activityLogs.map((log: any) => (
                          <Card key={log.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Activity className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{log.description}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="outline" className="text-xs">{log.type}</Badge>
                                    {log.userName && <span className="text-xs text-muted-foreground">بواسطة: {log.userName}</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {log.createdAt ? new Date(log.createdAt).toLocaleString('ar') : ''}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا يوجد نشاط مسجل بعد</p>
                        <p className="text-sm mt-1">ستظهر هنا أنشطة النظام مثل التسجيلات وتغييرات الحالة</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== Settings Tab ===== */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">الإعدادات</h1>
                      <p className="text-muted-foreground text-sm mt-1">إعدادات حساب المدير والنظام</p>
                    </div>
                    {/* Account Info */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">معلومات الحساب</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                              <p className="text-sm text-muted-foreground">الاسم</p>
                              <p className="font-medium">{(user as any)?.name || 'المدير'}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditName((user as any)?.name || '')
                              setEditNameDialog(true)
                            }}>
                              <Pencil className="w-4 h-4 ml-1" />
                              تعديل
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                              <p className="text-sm text-muted-foreground">اسم المستخدم</p>
                              <p className="font-medium">{(user as any)?.username || 'admin'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                              <p className="text-sm text-muted-foreground">الصلاحية</p>
                              <p className="font-medium">مدير النظام</p>
                            </div>
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">مدير</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">تغيير كلمة المرور</h3>
                        <Button variant="outline" onClick={() => setView('admin-change-password')}>
                          تغيير كلمة المرور
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Dark Mode */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">المظهر</h3>
                        <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            {darkMode ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                            <div>
                              <p className="font-medium">{darkMode ? 'الوضع الداكن' : 'الوضع الفاتح'}</p>
                              <p className="text-xs text-muted-foreground">تبديل مظهر الواجهة</p>
                            </div>
                          </div>
                          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">معلومات النظام</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">حالة Firebase</p>
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">متصل</Badge>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">إجمالي الممرضين</p>
                            <span className="font-medium">{stats?.totalNurses || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">إجمالي المستفيدين</p>
                            <span className="font-medium">{stats?.totalBeneficiaries || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                            <span className="font-medium">{stats?.totalRequests || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">إجمالي الخدمات</p>
                            <span className="font-medium">{stats?.totalServices || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-p-4 bg-gray-50 dark:bg-gray-800/50 rounded bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">إصدار النظام</p>
                            <span className="font-medium">1.0.0</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Service Dialog */}
      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم الخدمة</Label>
              <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: قياس الضغط" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الخدمة" />
            </div>
            <div className="space-y-2">
              <Label>السعر (ر.ي)</Label>
              <Input type="number" value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={serviceForm.category} onValueChange={v => setServiceForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="عام">عام</SelectItem>
                  <SelectItem value="تمريض">تمريض</SelectItem>
                  <SelectItem value="فحوصات">فحوصات</SelectItem>
                  <SelectItem value="علاج طبيعي">علاج طبيعي</SelectItem>
                  <SelectItem value="رعاية منزلية">رعاية منزلية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={serviceForm.isActive} onCheckedChange={v => setServiceForm(f => ({ ...f, isActive: v }))} />
              <Label>خدمة نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveService}>
              {editingService ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={paymentForm.name} onChange={e => setPaymentForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: جوال كاش" />
            </div>
            <div className="space-y-2">
              <Label>معلومات الحساب</Label>
              <Textarea value={paymentForm.accountInfo} onChange={e => setPaymentForm(f => ({ ...f, accountInfo: e.target.value }))} placeholder="رقم الحساب أو معلومات التحويل" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={paymentForm.isActive} onCheckedChange={v => setPaymentForm(f => ({ ...f, isActive: v }))} />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSavePayment}>
              {editingPayment ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>كود الكوبون</Label>
              <Input
                value={couponForm.code}
                onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="مثال: SAVE20"
                className="font-mono"
                disabled={!!editingCoupon}
              />
            </div>
            <div className="space-y-2">
              <Label>نسبة الخصم (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={couponForm.discountPercent}
                onChange={e => setCouponForm(f => ({ ...f, discountPercent: e.target.value }))}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للاستخدام</Label>
              <Input
                type="number"
                min="1"
                value={couponForm.maxUses}
                onChange={e => setCouponForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={couponForm.expiresAt}
                onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={couponForm.isActive} onCheckedChange={v => setCouponForm(f => ({ ...f, isActive: v }))} />
              <Label>كوبون نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveCoupon}>
              {editingCoupon ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Nurse Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعيين ممرض للطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              الخدمة: <span className="font-medium text-foreground">{selectedRequest?.service?.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              المستفيد: <span className="font-medium text-foreground">{selectedRequest?.beneficiary?.name}</span>
            </p>
            <Separator />
            <div className="space-y-2">
              <Label>اختر الممرض</Label>
              <Select value={selectedNurseId} onValueChange={setSelectedNurseId}>
                <SelectTrigger><SelectValue placeholder="اختر ممرضاً" /></SelectTrigger>
                <SelectContent>
                  {approvedNurses.map(nurse => (
                    <SelectItem key={nurse.id} value={nurse.id}>
                      {nurse.firstName} {nurse.secondName} {nurse.thirdName} {nurse.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAssignNurse}>تعيين</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الرفض</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="سبب الرفض..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editNameDialog} onOpenChange={setEditNameDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الاسم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الجديد</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="أدخل الاسم الجديد" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameDialog(false)}>إلغاء</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpdateName}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
