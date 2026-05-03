'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Loader2, AlertTriangle, Database, RefreshCw } from 'lucide-react'
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
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Check Firebase connection on mount
  useEffect(() => {
    checkFirebase()
  }, [])

  const checkFirebase = async () => {
    setFirebaseStatus('checking')
    try {
      const res = await fetch('/api/firebase-status')
      if (res.ok) {
        const data = await res.json()
        if (data.connected) {
          setFirebaseStatus('connected')
          setFirebaseError(null)
        } else {
          setFirebaseStatus('disconnected')
          setFirebaseError(data.error)
        }
      } else {
        setFirebaseStatus('disconnected')
        setFirebaseError('فشل الاتصال بالخادم')
      }
    } catch {
      setFirebaseStatus('disconnected')
      setFirebaseError('فشل الاتصال بالخادم')
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }

    setServerError(null)
    setLoading(true)
    try {
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
        // Wrong credentials
        setServerError(loginData.error || 'اسم المستخدم أو كلمة المرور غير صحيحة')
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: loginData.error || 'اسم المستخدم أو كلمة المرور غير صحيحة',
          variant: 'destructive',
          duration: 8000,
        })
      } else if (loginData.isFirestoreNotCreated) {
        // Firestore not created yet
        setServerError(loginData.error)
        toast({
          title: 'قاعدة البيانات غير مفعلة',
          description: loginData.error,
          variant: 'destructive',
          duration: 15000,
        })
      } else if (loginData.isFirebaseError) {
        // Firebase not configured
        setServerError(loginData.error)
        toast({
          title: 'خطأ في قاعدة البيانات',
          description: loginData.error,
          variant: 'destructive',
          duration: 15000,
        })
        setFirebaseStatus('disconnected')
      } else {
        // Other server error
        setServerError(loginData.error || 'حدث خطأ غير متوقع')
        toast({
          title: 'خطأ في الخادم',
          description: loginData.error || 'حدث خطأ غير متوقع',
          variant: 'destructive',
          duration: 8000,
        })
      }
    } catch (error) {
      setServerError('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.')
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
            
            {/* Firebase connection indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {firebaseStatus === 'connected' && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  قاعدة البيانات متصلة
                </div>
              )}
              {firebaseStatus === 'disconnected' && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  قاعدة البيانات غير متصلة
                </div>
              )}
              {firebaseStatus === 'checking' && (
                <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  جاري التحقق...
                </div>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={checkFirebase}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Firebase status warning - show but DON'T block login */}
            {firebaseStatus === 'disconnected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-red-800">قاعدة البيانات غير متصلة</p>
                  <p className="text-red-700 mt-1">{firebaseError || 'لا يمكن الاتصال بـ Firebase'}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700"
                      onClick={() => setView('firebase-setup')}
                    >
                      <Database className="w-4 h-4 ml-1" />
                      إعداد قاعدة البيانات
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Server error display */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">{serverError}</p>
              </div>
            )}

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
