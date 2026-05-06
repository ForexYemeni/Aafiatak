'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Loader2, UserPlus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function BeneficiaryLogin() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!phone || !password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/beneficiary/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data, 'beneficiary')
        setView('beneficiary-dashboard')
        toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + data.name })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-2xl font-bold">دخول المستفيد</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">أدخل بياناتك لطلب الخدمات الصحية</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7XXXXXXXX"
                className="text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="text-right"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-white hover:opacity-90"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
            </Button>
            <Button
              variant="outline"
              className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              onClick={() => setView('beneficiary-register')}
            >
              <UserPlus className="w-4 h-4 ml-2" />
              إنشاء حساب جديد
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setView('landing')}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
