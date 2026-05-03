'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function AdminChangePassword() {
  const { user, setUser, setView } = useAppStore()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }

    if (newPassword.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين', variant: 'destructive' })
      return
    }

    if (currentPassword === newPassword) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: (user as any)?.id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم تغيير كلمة المرور بنجاح', description: 'يمكنك الآن الوصول إلى لوحة التحكم' })
        // Update user in store to remove mustChangePassword flag
        setUser({ ...user!, mustChangePassword: false } as any, 'admin')
        setView('admin-dashboard')
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mx-auto mb-3">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">تغيير كلمة المرور</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">يجب تغيير كلمة المرور الافتراضية قبل المتابعة</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Warning banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                يجب تغيير كلمة المرور الافتراضية قبل الوصول إلى لوحة التحكم. لا يمكنك تخطي هذه الخطوة.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة"
                className="text-right"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-white hover:opacity-90"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'تغيير كلمة المرور'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
