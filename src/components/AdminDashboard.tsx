'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wrench, Users, ClipboardList, CreditCard,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle, UserPlus,
  Loader2, Shield, Heart, Menu, X, UserCog, ChevronLeft
} from 'lucide-react'
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

type Tab = 'dashboard' | 'services' | 'nurses' | 'beneficiaries' | 'requests' | 'payments' | 'settings'

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
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Admin name edit
  const [editNameDialog, setEditNameDialog] = useState(false)
  const [editName, setEditName] = useState('')

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) setStats(await res.json())
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
        setRejectDialog(false)
        fetchData()
      }
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
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const approvedNurses = nurses.filter(n => n.status === 'approved')

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { key: 'services', label: 'الخدمات', icon: Wrench },
    { key: 'nurses', label: 'الممرضين', icon: Users },
    { key: 'beneficiaries', label: 'المستفيدين', icon: Heart },
    { key: 'requests', label: 'الطلبات', icon: ClipboardList },
    { key: 'payments', label: 'طرق الدفع', icon: CreditCard },
    { key: 'settings', label: 'الإعدادات', icon: UserCog },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-l shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b bg-gradient-to-l from-emerald-600 to-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-emerald-100 text-xs">لوحة تحكم الإدارة</p>
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
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
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

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => {
            setEditName((user as any)?.name || '')
            setEditNameDialog(true)
          }}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{(user as any)?.name || 'المدير'}</p>
              <p className="text-muted-foreground text-xs">مدير النظام</p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={handleLogout}>
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
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b bg-gradient-to-l from-emerald-600 to-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">عافيتك</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
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
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{(user as any)?.name || 'المدير'}</p>
              <p className="text-muted-foreground text-xs">مدير النظام</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-emerald-700">عافيتك</span>
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
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                      <p className="text-muted-foreground text-sm mt-1">نظرة عامة على النظام</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الممرضين', value: stats.totalNurses, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Users },
                        { label: 'ممرضين معتمدين', value: stats.approvedNurses, color: 'text-teal-600', bg: 'bg-teal-50', icon: CheckCircle },
                        { label: 'بانتظار الموافقة', value: stats.pendingNurses, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Loader2 },
                        { label: 'المستفيدون', value: stats.totalBeneficiaries, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Heart },
                        { label: 'الخدمات', value: stats.totalServices, color: 'text-purple-600', bg: 'bg-purple-50', icon: Wrench },
                        { label: 'خدمات نشطة', value: stats.activeServices, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
                        { label: 'طلبات بانتظار المراجعة', value: stats.pendingRequests, color: 'text-orange-600', bg: 'bg-orange-50', icon: ClipboardList },
                        { label: 'طلبات مكتملة', value: stats.completedRequests, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
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
                    <Card className="border-0 shadow-sm bg-gradient-to-l from-emerald-500 to-emerald-700 text-white">
                      <CardContent className="p-6">
                        <p className="text-emerald-100 text-sm mb-1">إجمالي الإيرادات</p>
                        <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Services Tab */}
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
                                  <Badge variant={service.isActive ? 'default' : 'secondary'} className={service.isActive ? 'bg-emerald-100 text-emerald-700' : ''}>
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

                {/* Nurses Tab */}
                {activeTab === 'nurses' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">إدارة الممرضين</h1>
                      <p className="text-muted-foreground text-sm mt-1">مراجعة واعتماد تسجيلات الممرضين</p>
                    </div>
                    <div className="grid gap-4">
                      {nurses.map(nurse => (
                        <Card key={nurse.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
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
                      {nurses.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا يوجد ممرضون مسجلون بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Beneficiaries Tab */}
                {activeTab === 'beneficiaries' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">المستفيدون</h1>
                      <p className="text-muted-foreground text-sm mt-1">قائمة جميع المستفيدين المسجلين في النظام</p>
                    </div>
                    <div className="grid gap-4">
                      {beneficiaries.map((ben: any) => (
                        <Card key={ben.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-cyan-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{ben.name}</h3>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-1">
                                  <span>الهاتف: {ben.phone}</span>
                                  <span>الموقع: {ben.location}</span>
                                  {ben.createdAt && <span>تاريخ التسجيل: {new Date(ben.createdAt).toLocaleDateString('ar')}</span>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {beneficiaries.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا يوجد مستفيدون مسجلون بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
                      <p className="text-muted-foreground text-sm mt-1">مراجعة ومعالجة طلبات الخدمات</p>
                    </div>
                    <div className="grid gap-4">
                      {requests.map(req => (
                        <Card key={req.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
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
                                  {req.assignment && (
                                    <div><span className="text-muted-foreground">الممرض المعيّن:</span> <span className="font-medium">{req.assignment.nurse?.firstName} {req.assignment.nurse?.lastName}</span></div>
                                  )}
                                </div>
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
                                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700" onClick={() => {
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
                      {requests.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>لا توجد طلبات بعد</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payments Tab */}
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
                                  <Badge variant={payment.isActive ? 'default' : 'secondary'} className={payment.isActive ? 'bg-emerald-100 text-emerald-700' : ''}>
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

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold">الإعدادات</h1>
                      <p className="text-muted-foreground text-sm mt-1">إعدادات حساب المدير</p>
                    </div>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">معلومات الحساب</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
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
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="text-sm text-muted-foreground">اسم المستخدم</p>
                              <p className="font-medium">{(user as any)?.username || 'admin'}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="text-sm text-muted-foreground">الصلاحية</p>
                              <p className="font-medium">مدير النظام</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">مدير</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">تغيير كلمة المرور</h3>
                        <Button variant="outline" onClick={() => setView('admin-change-password')}>
                          تغيير كلمة المرور
                        </Button>
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
