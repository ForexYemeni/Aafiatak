'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Loader2, AlertTriangle, Database } from 'lucide-react'
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
  const [firebaseStatus, setFirebaseStatus] = useState<{ connected: boolean; error: string | null } | null>(null)

  // Check Firebase connection on mount
  useEffect(() => {
    checkFirebase()
  }, [])

  const checkFirebase = async () => {
    try {
      const res = await fetch('/api/firebase-status')
      if (res.ok) {
        const data = await res.json()
        setFirebaseStatus(data)
      } else {
        setFirebaseStatus({ connected: false, error: 'فشل الاتصال بالخادم' })
      }
    } catch {
      setFirebaseStatus({ connected: false, error: 'فشل الاتصال بالخادم' })
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }

    // Check Firebase first
    if (firebaseStatus && !firebaseStatus.connected) {
      toast({
        title: 'خطأ في قاعدة البيانات',
        description: firebaseStatus.error || 'Firebase غير متصل. تأكد من إعدادات قاعدة البيانات.',
        variant: 'destructive',
        duration: 8000,
      })
      return
    }

    setLoading(true)
    try {
      // Try login first
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const loginData = await loginRes.json()

      if (loginRes.ok) {
        setUser(loginData, 'admin')

        // Check if must change password
        if (loginData.mustChangePassword) {
          setView('admin-change-password')
          toast({ title: 'يجب تغيير كلمة المرور', description: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة' })
        } else {
          setView('admin-dashboard')
          toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + loginData.name })
        }
      } else if (loginRes.status === 401) {
        // Wrong credentials - try init if no admin exists yet
        const initRes = await fetch('/api/admin/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, name: 'المدير' }),
        })

        const initData = await initRes.json()

        if (initRes.ok) {
          setUser(initData, 'admin')
          setView('admin-change-password')
          toast({ title: 'تم إنشاء حساب المدير', description: 'يجب تغيير كلمة المرور الافتراضية' })
        } else {
          // Show the specific error
          toast({
            title: 'خطأ',
            description: initData.error || initData.firebaseError || 'اسم المستخدم أو كلمة المرور غير صحيحة',
            variant: 'destructive',
            duration: 8000,
          })
        }
      } else {
        // Other error (500, etc.)
        toast({
          title: 'خطأ في الخادم',
          description: loginData.error || loginData.firebaseError || 'حدث خطأ غير متوقع',
          variant: 'destructive',
          duration: 8000,
        })
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.',
        variant: 'destructive',
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
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
            {/* Firebase status warning */}
            {firebaseStatus && !firebaseStatus.connected && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-red-800">قاعدة البيانات غير متصلة</p>
                  <p className="text-red-700 mt-1">{firebaseStatus.error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-300 text-red-700"
                    onClick={() => setView('firebase-setup')}
                  >
                    <Database className="w-4 h-4 ml-1" />
                    إعداد قاعدة البيانات
                  </Button>
                </div>
              </div>
            )}

            {/* Default credentials hint */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800">
                <strong>بيانات الدخول الافتراضية:</strong> اسم المستخدم: <code className="bg-emerald-100 px-1 rounded">admin</code> | كلمة المرور: <code className="bg-emerald-100 px-1 rounded">admin123</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="أدخل اسم المستخدم"
                className="text-right"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="أدخل كلمة المرور"
                className="text-right"
                disabled={loading}
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:opacity-90 h-12 text-base"
              onClick={handleLogin}
              disabled={loading || (firebaseStatus !== null && !firebaseStatus.connected)}
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
