'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function AdminLogin() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  useEffect(() => {
    setInitLoading(false)
  }, [])

  const handleInitAndLogin = async () => {
    if (!username || !password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      // Try to init admin first
      const initRes = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: 'المدير' }),
      })

      if (initRes.ok) {
        const admin = await initRes.json()
        setUser(admin, 'admin')
        // New admin must change password
        setView('admin-change-password')
        toast({ title: 'تم إنشاء حساب المدير بنجاح', description: 'يجب تغيير كلمة المرور الافتراضية' })
        return
      }

      // If admin already exists, try login
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (loginRes.ok) {
        const admin = await loginRes.json()
        setUser(admin, 'admin')
        
        // Check if must change password
        if (admin.mustChangePassword) {
          setView('admin-change-password')
          toast({ title: 'يجب تغيير كلمة المرور', description: admin.message || 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة' })
        } else {
          setView('admin-dashboard')
          toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + admin.name })
        }
      } else {
        const data = await loginRes.json()
        toast({ title: 'خطأ في تسجيل الدخول', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-3">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">تسجيل دخول الإدارة</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">أدخل بيانات المدير للوصول إلى لوحة التحكم</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="text-right"
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
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:opacity-90"
              onClick={handleInitAndLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'تسجيل الدخول'
              )}
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
