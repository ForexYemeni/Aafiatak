'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wrench, Users, ClipboardList, CreditCard,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle, UserPlus,
  Loader2, Shield
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

type Tab = 'dashboard' | 'services' | 'nurses' | 'requests' | 'payments'

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
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [nurses, setNurses] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Check mustChangePassword - redirect to change password if needed
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

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { key: 'services', label: 'الخدمات', icon: Wrench },
    { key: 'nurses', label: 'الممرضين', icon: Users },
    { key: 'requests', label: 'الطلبات', icon: ClipboardList },
    { key: 'payments', label: 'طرق الدفع', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-emerald-700">عافيتك</h2>
          <p className="text-sm text-muted-foreground">لوحة تحكم الإدارة</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{(user as any)?.name || 'المدير'}</p>
              <p className="text-muted-foreground text-xs">مدير النظام</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-emerald-700">عافيتك</h2>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden fixed top-14 left-0 right-0 bg-white border-b z-50 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto md:pt-8 pt-28 pb-24 md:pb-8">
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
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'إجمالي الممرضين', value: stats.totalNurses, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'ممرضين معتمدين', value: stats.approvedNurses, color: 'text-teal-600', bg: 'bg-teal-50' },
                        { label: 'بانتظار الموافقة', value: stats.pendingNurses, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                        { label: 'المستفيدون', value: stats.totalBeneficiaries, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                        { label: 'الخدمات', value: stats.totalServices, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'خدمات نشطة', value: stats.activeServices, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'طلبات بانتظار المراجعة', value: stats.pendingRequests, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'طلبات مكتملة', value: stats.completedRequests, color: 'text-blue-600', bg: 'bg-blue-50' },
                      ].map((item, i) => (
                        <Card key={i} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                        <p className="text-3xl font-bold text-emerald-600">{formatPrice(stats.totalRevenue)}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
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
                        <Card key={service.id} className="border-0 shadow-sm">
                          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                            <div className="flex-1 min-w-48">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{service.name}</h3>
                                <Badge variant={service.isActive ? 'default' : 'secondary'} className={service.isActive ? 'bg-emerald-100 text-emerald-700' : ''}>
                                  {service.isActive ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="font-bold text-emerald-600">{formatPrice(service.price)}</span>
                                <span className="text-muted-foreground">التصنيف: {service.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingService(service)
                                  setServiceForm({
                                    name: service.name,
                                    description: service.description,
                                    price: service.price.toString(),
                                    category: service.category,
                                    isActive: service.isActive,
                                  })
                                  setServiceDialog(true)
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteService(service.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {services.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          لا توجد خدمات بعد. أضف أول خدمة!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'nurses' && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold">إدارة الممرضين</h1>
                    <div className="grid gap-4">
                      {nurses.map(nurse => (
                        <Card key={nurse.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                              <div className="flex-1 min-w-64">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{nurse.firstName} {nurse.secondName} {nurse.thirdName} {nurse.lastName}</h3>
                                  <Badge className={getStatusColor(nurse.status)}>
                                    {getStatusLabel(nurse.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                  <span>الهاتف: {nurse.phone}</span>
                                  <span>الموقع: {nurse.location}</span>
                                  <span>الرقم الوطني: {nurse.nationalId}</span>
                                  <span>رقم المزاولة: {nurse.licenseNumber}</span>
                                  <span>انتهاء المزاولة: {nurse.licenseExpiryDate}</span>
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
                        <div className="text-center py-12 text-muted-foreground">
                          لا يوجد ممرضون مسجلون بعد
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
                    <div className="grid gap-4">
                      {requests.map(req => (
                        <Card key={req.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                              <div className="flex-1 min-w-64">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{req.service?.name}</h3>
                                  <Badge className={getStatusColor(req.status)}>
                                    {getStatusLabel(req.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                  <span>المستفيد: {req.beneficiary?.name}</span>
                                  <span>الهاتف: {req.beneficiary?.phone}</span>
                                  <span>السعر: {formatPrice(req.service?.price || 0)}</span>
                                  <span>طريقة الدفع: {req.paymentMethod || 'غير محددة'}</span>
                                  {req.notes && <span>ملاحظات: {req.notes}</span>}
                                  {req.address && <span>العنوان: {req.address}</span>}
                                  {req.adminNotes && <span>ملاحظات الإدارة: {req.adminNotes}</span>}
                                  {req.assignment && (
                                    <span>الممرض المعيّن: {req.assignment.nurse?.firstName} {req.assignment.nurse?.lastName}</span>
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
                        <div className="text-center py-12 text-muted-foreground">
                          لا توجد طلبات بعد
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold">طرق الدفع</h1>
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
                        <Card key={payment.id} className="border-0 shadow-sm">
                          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
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
                          </CardContent>
                        </Card>
                      ))}
                      {payments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          لا توجد طرق دفع بعد
                        </div>
                      )}
                    </div>
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
    </div>
  )
}
