'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function BeneficiaryRegister() {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.location || !form.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
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
      const res = await fetch('/api/beneficiary/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          location: form.location,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        toast({ title: 'تم التسجيل بنجاح' })
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
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="border-0 shadow-xl text-center">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">تم التسجيل بنجاح!</h2>
              <p className="text-muted-foreground mb-6">يمكنك الآن تسجيل الدخول وطلب الخدمات الصحية.</p>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => setView('beneficiary-login')}>
                تسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mx-auto mb-3">
              <Heart className="w-8 h-8 text-cyan-600" />
            </div>
            <CardTitle className="text-2xl font-bold">تسجيل مستفيد جديد</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">أنشئ حسابك لطلب الخدمات الصحية</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="الاسم الكامل" />
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
              <Label>كلمة المرور *</Label>
              <Input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="6 أحرف على الأقل" />
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور *</Label>
              <Input type="password" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="أعد كتابة كلمة المرور" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-white hover:opacity-90"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setView('beneficiary-login')}>
                لديك حساب؟ تسجيل الدخول
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setView('landing')}>
                <ArrowRight className="w-4 h-4 ml-2" />
                الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
