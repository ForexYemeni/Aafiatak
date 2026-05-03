'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ClipboardList, CreditCard, LogOut, Loader2, Plus, XCircle, ShoppingBag } from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

type Tab = 'services' | 'requests' | 'payments'

export default function BeneficiaryDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('services')
  const [services, setServices] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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
      } else {
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

  // Fetch payment methods for the request dialog
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
  ]

  const categories = [...new Set(services.map(s => s.category))]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-bold text-cyan-700">عافيتك</h2>
              <p className="text-xs text-muted-foreground">{(user as any)?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-1" />
            خروج
          </Button>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">الخدمات المتاحة</h1>
                  {categories.map(category => (
                    <div key={category}>
                      <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{category}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.filter(s => s.category === category).map(service => (
                          <motion.div key={service.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Card className="border-0 shadow-sm h-full flex flex-col">
                              <CardContent className="p-5 flex flex-col flex-1">
                                <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 flex-1">{service.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold text-emerald-600">{formatPrice(service.price)}</span>
                                  <Button
                                    size="sm"
                                    className="bg-cyan-600 hover:bg-cyan-700"
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
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center text-muted-foreground">
                        لا توجد خدمات متاحة حالياً
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">طلباتي</h1>
                  {requests.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center text-muted-foreground">
                        لم تقم بأي طلبات بعد. تصفح الخدمات المتاحة!
                      </CardContent>
                    </Card>
                  ) : (
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
                                  <span>السعر: {formatPrice(req.service?.price || 0)}</span>
                                  <span>طريقة الدفع: {req.paymentMethod || 'غير محددة'}</span>
                                  {req.notes && <span>ملاحظات: {req.notes}</span>}
                                  {req.address && <span>العنوان: {req.address}</span>}
                                  {req.adminNotes && <span>ملاحظات الإدارة: {req.adminNotes}</span>}
                                  {req.assignment && (
                                    <span>الممرض: {req.assignment.nurse?.firstName} {req.assignment.nurse?.lastName}</span>
                                  )}
                                  <span>تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString('ar-YE')}</span>
                                </div>
                              </div>
                              {req.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleCancelRequest(req.id)}
                                >
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

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">طرق الدفع المتاحة</h1>
                  {payments.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center text-muted-foreground">
                        لا توجد طرق دفع متاحة حالياً
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {payments.map(payment => (
                        <Card key={payment.id} className="border-0 shadow-sm">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                              </div>
                              <h3 className="font-semibold">{payment.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{payment.accountInfo}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h3 className="font-semibold">{selectedService.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-2">{formatPrice(selectedService.price)}</p>
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    value={requestForm.address}
                    onChange={e => setRequestForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="عنوانك بالتفصيل"
                  />
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
                  <Textarea
                    value={requestForm.notes}
                    onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialog(false)}>إلغاء</Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleRequestService}>
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
