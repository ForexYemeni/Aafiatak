'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Stethoscope, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function NurseRegister() {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    secondName: '',
    thirdName: '',
    lastName: '',
    phone: '',
    location: '',
    nationalId: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleRegister = async () => {
    const required = ['firstName', 'secondName', 'thirdName', 'lastName', 'phone', 'location', 'nationalId', 'licenseNumber', 'licenseExpiryDate', 'password']
    for (const field of required) {
      if (!form[field as keyof typeof form]) {
        toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
        return
      }
    }

    if (form.password !== form.confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' })
      return
    }

    if (form.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/nurse/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        toast({ title: 'تم التسجيل بنجاح', description: 'سيتم مراجعة حسابك من قبل الإدارة' })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="border-0 shadow-xl text-center">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-100 mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">تم التسجيل بنجاح!</h2>
              <p className="text-muted-foreground mb-6">سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.</p>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setView('nurse-login')}>
                العودة لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mx-auto mb-3">
              <Stethoscope className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">تسجيل حساب ممرض جديد</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">أدخل بياناتك الكاملة للتسجيل</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الأول *</Label>
                <Input value={form.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="الاسم الأول" />
              </div>
              <div className="space-y-2">
                <Label>الاسم الثاني *</Label>
                <Input value={form.secondName} onChange={e => updateField('secondName', e.target.value)} placeholder="الاسم الثاني" />
              </div>
              <div className="space-y-2">
                <Label>الاسم الثالث *</Label>
                <Input value={form.thirdName} onChange={e => updateField('thirdName', e.target.value)} placeholder="الاسم الثالث" />
              </div>
              <div className="space-y-2">
                <Label>الاسم الرابع (اللقب) *</Label>
                <Input value={form.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="الاسم الرابع" />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف *</Label>
                <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="7XXXXXXXX" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الموقع *</Label>
                <Input value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="المدينة / المنطقة" />
              </div>
              <div className="space-y-2">
                <Label>الرقم الوطني *</Label>
                <Input value={form.nationalId} onChange={e => updateField('nationalId', e.target.value)} placeholder="الرقم الوطني" />
              </div>
              <div className="space-y-2">
                <Label>رقم المزاولة *</Label>
                <Input value={form.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} placeholder="رقم ترخيص المزاولة" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ انتهاء المزاولة *</Label>
                <Input type="date" value={form.licenseExpiryDate} onChange={e => updateField('licenseExpiryDate', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور *</Label>
                <Input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="6 أحرف على الأقل" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>تأكيد كلمة المرور *</Label>
                <Input type="password" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="أعد كتابة كلمة المرور" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-teal-700 text-white hover:opacity-90"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setView('nurse-login')}>
                  لديك حساب؟ تسجيل الدخول
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setView('landing')}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                  الرئيسية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
