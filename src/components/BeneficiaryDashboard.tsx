'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ClipboardList, CreditCard, LogOut, Loader2, Plus, XCircle,
  ShoppingBag, User, Menu, X, Bell, MapPin, Phone, Home, HelpCircle
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
import Image from 'next/image'

type Tab = 'services' | 'requests' | 'payments' | 'profile' | 'help'

export default function BeneficiaryDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('services')
  const [services, setServices] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Request service dialog
  const [requestDialog, setRequestDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [requestForm, setRequestForm] = useState({ paymentMethod: '', notes: '', address: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'services') {
        const res = await fetch('/api/beneficiary/services')
        if (res.ok) setServices(await res.json())
      } else if (activeTab === 'requests') {
        const res = await fetch(`/api/beneficiary/requests?beneficiaryId=${(user as any)?.id}`)
        if (res.ok) setRequests(await res.json())
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/beneficiary/payments')
        if (res.ok) setPayments(await res.json())
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, user, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/beneficiary/payments')
      .then(res => res.ok ? res.json() : [])
      .then(data => setPaymentMethods(data))
      .catch(() => {})
  }, [])

  const handleRequestService = async () => {
    if (!selectedService) return
    try {
      const res = await fetch('/api/beneficiary/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId: (user as any)?.id,
          serviceId: selectedService.id,
          paymentMethod: requestForm.paymentMethod || null,
          notes: requestForm.notes || null,
          address: requestForm.address || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'تم إرسال الطلب بنجاح', description: 'سيتم مراجعة طلبك من قبل الإدارة' })
        setRequestDialog(false)
        setSelectedService(null)
        setRequestForm({ paymentMethod: '', notes: '', address: '' })
        setActiveTab('requests')
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

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
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'services', label: 'الخدمات', icon: ShoppingBag },
    { key: 'requests', label: 'طلباتي', icon: ClipboardList },
    { key: 'payments', label: 'طرق الدفع', icon: CreditCard },
    { key: 'profile', label: 'الملف الشخصي', icon: User },
    { key: 'help', label: 'المساعدة', icon: HelpCircle },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const categories = [...new Set(services.map(s => s.category))]
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const completedRequests = requests.filter(r => r.status === 'completed').length

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-l shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b bg-gradient-to-l from-rose-500 to-pink-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-rose-100 text-xs">حساب المستفيد</p>
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
                  ? 'bg-rose-50 text-rose-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.key === 'requests' && pendingRequests > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{(user as any)?.name}</p>
              <p className="text-muted-foreground text-xs">مستفيد</p>
            </div>
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
        <div className="p-4 border-b bg-gradient-to-l from-rose-500 to-pink-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" />
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
                activeTab === tab.key ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold text-rose-700">عافيتك</span>
        </div>
        <div className="flex items-center gap-2">
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
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50">
                        <CardContent className="p-4 text-center">
                          <ShoppingBag className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-rose-700">{services.length}</p>
                          <p className="text-xs text-muted-foreground">خدمة متاحة</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
                        <CardContent className="p-4 text-center">
                          <ClipboardList className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-violet-700">{requests.length}</p>
                          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardContent className="p-4 text-center">
                          <Bell className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-amber-700">{pendingRequests}</p>
                          <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                        <CardContent className="p-4 text-center">
                          <Heart className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-emerald-700">{completedRequests}</p>
                          <p className="text-xs text-muted-foreground">مكتملة</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h1 className="text-2xl font-bold mb-1">الخدمات المتاحة</h1>
                      <p className="text-muted-foreground text-sm">اختر الخدمة التي تناسبك واطلبها بسهولة</p>
                    </div>
                    {categories.map(category => (
                      <div key={category}>
                        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{category}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {services.filter(s => s.category === category).map(service => (
                            <motion.div key={service.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                                <CardContent className="p-5 flex flex-col flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg">{service.name}</h3>
                                    <Badge variant="outline" className="text-xs">{service.category}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4 flex-1">{service.description}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-emerald-600">{formatPrice(service.price)}</span>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90"
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
                        </div>
                      </div>
                    ))}
                    {services.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد خدمات متاحة حالياً</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">طلباتي</h1>
                      <p className="text-muted-foreground text-sm">متابعة حالة طلبات الخدمات</p>
                    </div>

                    {/* Request Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                      {['الكل', 'قيد الانتظار', 'مقبول', 'قيد التنفيذ', 'مكتمل', 'ملغي'].map((filter, i) => (
                        <Badge key={filter} variant="outline" className="cursor-pointer hover:bg-gray-100 px-3 py-1.5">
                          {filter}
                        </Badge>
                      ))}
                    </div>

                    {requests.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لم تقم بأي طلبات بعد. تصفح الخدمات المتاحة!</p>
                        <Button className="mt-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white" onClick={() => setActiveTab('services')}>
                          تصفح الخدمات
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {requests.map(req => (
                          <Card key={req.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between flex-wrap gap-4">
                                <div className="flex-1 min-w-64">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                      <ClipboardList className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold">{req.service?.name}</h3>
                                      <Badge className={getStatusColor(req.status)}>
                                        {getStatusLabel(req.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <span className="font-medium text-foreground">السعر:</span> {formatPrice(req.service?.price || 0)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <span className="font-medium text-foreground">طريقة الدفع:</span> {req.paymentMethod || 'غير محددة'}
                                    </div>
                                    {req.notes && <div className="col-span-2"><span className="font-medium">ملاحظات:</span> <span className="text-muted-foreground">{req.notes}</span></div>}
                                    {req.address && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> <span className="text-muted-foreground">{req.address}</span></div>}
                                    {req.adminNotes && <div className="col-span-2 bg-amber-50 rounded-lg p-2 text-sm"><span className="font-medium text-amber-800">ملاحظات الإدارة:</span> <span className="text-amber-700">{req.adminNotes}</span></div>}
                                    {req.assignment && (
                                      <div className="col-span-2 bg-violet-50 rounded-lg p-2 text-sm">
                                        <span className="font-medium text-violet-800">الممرض المعيّن:</span>{' '}
                                        <span className="text-violet-700">{req.assignment.nurse?.firstName} {req.assignment.nurse?.lastName}</span>
                                      </div>
                                    )}
                                    <div className="text-muted-foreground text-xs">
                                      {new Date(req.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                  </div>
                                </div>
                                {req.status === 'pending' && (
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancelRequest(req.id)}>
                                    <XCircle className="w-4 h-4 ml-1" />
                                    إلغاء
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">طرق الدفع المتاحة</h1>
                      <p className="text-muted-foreground text-sm">الطرق المتاحة لدفع قيمة الخدمات</p>
                    </div>
                    {payments.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد طرق دفع متاحة حالياً</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {payments.map(payment => (
                          <Card key={payment.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold">{payment.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3 mt-2">{payment.accountInfo}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">الملف الشخصي</h1>
                      <p className="text-muted-foreground text-sm">معلومات حسابك الشخصية</p>
                    </div>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{(user as any)?.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{(user as any)?.name}</h3>
                            <Badge className="bg-rose-100 text-rose-700">مستفيد</Badge>
                          </div>
                        </div>
                        <Separator className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Phone className="w-5 h-5 text-rose-600" />
                            <div>
                              <p className="text-muted-foreground text-xs">رقم الهاتف</p>
                              <p className="font-medium">{(user as any)?.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-rose-600" />
                            <div>
                              <p className="text-muted-foreground text-xs">الموقع</p>
                              <p className="font-medium">{(user as any)?.location}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">المساعدة والدعم</h1>
                      <p className="text-muted-foreground text-sm">الأسئلة الشائعة ومعلومات التواصل</p>
                    </div>
                    {[
                      { q: 'كيف أطلب خدمة؟', a: 'انتقل إلى قسم الخدمات، اختر الخدمة المناسبة، اضغط على زر "طلب"، ثم املأ تفاصيل الطلب包括 العنوان وطريقة الدفع' },
                      { q: 'كيف أتابع حالة طلبي؟', a: 'انتقل إلى قسم "طلباتي" لمشاهدة جميع طلباتك وحالتها الحالية. ستظهر أي تحديثات فورية.' },
                      { q: 'هل يمكنني إلغاء طلب؟', a: 'نعم، يمكنك إلغاء الطلب إذا كان لا يزال في حالة "قيد الانتظار". بعد قبول الطلب من الإدارة، تواصل مع الدعم.' },
                      { q: 'ما هي طرق الدفع المتاحة؟', a: 'يمكنك الاطلاع على طرق الدفع المتاحة في قسم "طرق الدفع". يتم دعم الدفع النقدي عند الاستلام والتحويل البنكي.' },
                    ].map((item, i) => (
                      <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-5">
                          <h3 className="font-bold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            {item.q}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Request Service Dialog */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب خدمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedService && (
              <>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h3 className="font-semibold">{selectedService.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-2">{formatPrice(selectedService.price)}</p>
                </div>
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input value={requestForm.address} onChange={e => setRequestForm(f => ({ ...f, address: e.target.value }))} placeholder="عنوانك بالتفصيل" />
                </div>
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select value={requestForm.paymentMethod} onValueChange={v => setRequestForm(f => ({ ...f, paymentMethod: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر طريقة الدفع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                      {paymentMethods.map(pm => (
                        <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={requestForm.notes} onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))} placeholder="أي ملاحظات إضافية..." />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialog(false)}>إلغاء</Button>
            <Button className="bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90" onClick={handleRequestService}>
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
