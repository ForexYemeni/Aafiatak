'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Stethoscope, Heart, ArrowRight, Loader2, UserPlus, Eye, EyeOff, RefreshCw, Database, AlertTriangle, CheckCircle, Phone, Lock, ScanFace } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

type Mode = 'login' | 'register'

const roleConfig = {
  beneficiary: {
    icon: Heart,
    label: 'مستفيد',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    textAccent: 'text-violet-600',
    glowColor: 'shadow-violet-500/25',
  },
  nurse: {
    icon: Stethoscope,
    label: 'ممرض',
    gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    textAccent: 'text-blue-600',
    glowColor: 'shadow-blue-500/25',
  },
  admin: {
    icon: Shield,
    label: 'مدير',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    textAccent: 'text-amber-600',
    glowColor: 'shadow-amber-500/25',
  },
}

export default function UnifiedLogin() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [detectedRole, setDetectedRole] = useState<'beneficiary' | 'nurse' | 'admin' | null>(null)
  const [showRoleDetection, setShowRoleDetection] = useState(false)

  // Login form
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' })

  // Register role
  const [registerRole, setRegisterRole] = useState<'beneficiary' | 'nurse'>('beneficiary')

  // Register forms
  const [nurseRegForm, setNurseRegForm] = useState({
    firstName: '', secondName: '', thirdName: '', lastName: '',
    phone: '', location: '', nationalId: '', licenseNumber: '',
    licenseExpiryDate: '', password: '', confirmPassword: '',
  })
  const [beneficiaryRegForm, setBeneficiaryRegForm] = useState({
    name: '', phone: '', location: '', password: '', confirmPassword: '',
  })

  // Check Firebase connection
  useEffect(() => { checkFirebase() }, [])

  const checkFirebase = async () => {
    setFirebaseStatus('checking')
    try {
      const res = await fetch('/api/firebase-status')
      if (res.ok) {
        const data = await res.json()
        if (data.connected) { setFirebaseStatus('connected'); setFirebaseError(null) }
        else { setFirebaseStatus('disconnected'); setFirebaseError(data.error) }
      } else { setFirebaseStatus('disconnected'); setFirebaseError('فشل الاتصال بالخادم') }
    } catch { setFirebaseStatus('disconnected'); setFirebaseError('فشل الاتصال بالخادم') }
  }

  // ============ UNIFIED LOGIN HANDLER ============
  const handleUnifiedLogin = async () => {
    if (!loginForm.phone || !loginForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (res.ok) {
        const userType = data.userType as 'admin' | 'nurse' | 'beneficiary'
        setDetectedRole(userType)
        setShowRoleDetection(true)

        setTimeout(() => {
          setUser(data, userType)
          if (userType === 'admin') {
            if (data.mustChangePassword) {
              setView('admin-change-password')
              toast({ title: 'يجب تغيير كلمة المرور', description: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة' })
            } else {
              setView('admin-dashboard')
              const roleLabel = data.role === 'sub-admin' ? 'مدير فرعي' : 'مدير'
              toast({ title: `مرحباً ${data.name}`, description: `تم تسجيل الدخول ك${roleLabel}` })
            }
          } else if (userType === 'nurse') {
            setView('nurse-dashboard')
            toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + data.firstName })
          } else {
            setView('beneficiary-dashboard')
            toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً ' + data.name })
          }
          setShowRoleDetection(false)
        }, 1500)
      } else {
        toast({ title: 'خطأ', description: data.error || 'رقم الهاتف أو كلمة المرور غير صحيحة', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ============ REGISTER HANDLERS ============
  const handleNurseRegister = async () => {
    const required = ['firstName', 'secondName', 'thirdName', 'lastName', 'phone', 'location', 'nationalId', 'licenseNumber', 'licenseExpiryDate', 'password']
    for (const field of required) {
      if (!nurseRegForm[field as keyof typeof nurseRegForm]) {
        toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
        return
      }
    }
    if (nurseRegForm.password !== nurseRegForm.confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' })
      return
    }
    if (nurseRegForm.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/nurse/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nurseRegForm),
      })
      const data = await res.json()
      if (res.ok) { setRegisterSuccess(true); toast({ title: 'تم التسجيل بنجاح', description: 'سيتم مراجعة حسابك من قبل الإدارة' }) }
      else { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const handleBeneficiaryRegister = async () => {
    if (!beneficiaryRegForm.name || !beneficiaryRegForm.phone || !beneficiaryRegForm.location || !beneficiaryRegForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    if (beneficiaryRegForm.password !== beneficiaryRegForm.confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' })
      return
    }
    if (beneficiaryRegForm.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/beneficiary/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: beneficiaryRegForm.name,
          phone: beneficiaryRegForm.phone,
          location: beneficiaryRegForm.location,
          password: beneficiaryRegForm.password,
        }),
      })
      const data = await res.json()
      if (res.ok) { setRegisterSuccess(true); toast({ title: 'تم التسجيل بنجاح' }) }
      else { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }) }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') handleUnifiedLogin()
      else if (registerRole === 'nurse') handleNurseRegister()
      else handleBeneficiaryRegister()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-8" dir="rtl">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-amber-200/30 rounded-full blur-3xl" />
      </div>

      {/* Role Detection Overlay */}
      <AnimatePresence>
        {showRoleDetection && detectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
                className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${roleConfig[detectedRole].gradient} flex items-center justify-center shadow-2xl ${roleConfig[detectedRole].glowColor} ring-4 ring-white/30`}
              >
                {(() => { const Icon = roleConfig[detectedRole].icon; return <Icon className="w-14 h-14 text-white" /> })()}
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-center">
                <p className="text-white text-lg font-bold mb-1">تم التعرف على حسابك</p>
                <div className="flex items-center justify-center gap-2">
                  <ScanFace className="w-4 h-4 text-emerald-400" />
                  <span className={`text-2xl font-black ${detectedRole === 'beneficiary' ? 'text-violet-300' : detectedRole === 'nurse' ? 'text-blue-300' : 'text-amber-300'}`}>
                    {roleConfig[detectedRole].label}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-2">جارٍ التحويل...</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo & Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-block mb-4">
            <Image src="/logo.png" alt="عافيتك" width={90} height={90} className="rounded-2xl shadow-lg" priority />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">عافيتك</h1>
          <p className="text-muted-foreground mt-1 text-sm">رعاية صحية في منزلك</p>
        </motion.div>

        {/* Firebase Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {firebaseStatus === 'connected' && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />متصل
            </div>
          )}
          {firebaseStatus === 'disconnected' && (
            <button onClick={() => setView('firebase-setup')} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-3 h-3" />قاعدة البيانات غير متصلة
            </button>
          )}
          {firebaseStatus === 'checking' && (
            <div className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
            </div>
          )}
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl shadow-black/5 overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex bg-slate-50 border-b border-slate-100">
            {([
              { key: 'login' as Mode, label: 'تسجيل الدخول' },
              { key: 'register' as Mode, label: 'إنشاء حساب' },
            ]).map((tab) => {
              const isActive = mode === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setMode(tab.key); setRegisterSuccess(false); setShowPassword(false) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-300 relative ${
                    isActive
                      ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeModeTab"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tab.key === 'login' ? 'from-violet-500 via-purple-500 to-fuchsia-500' : 'from-cyan-500 via-blue-500 to-indigo-500'}`}
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {registerSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${roleConfig[registerRole].gradient} mx-auto mb-4 shadow-lg`}>
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">تم التسجيل بنجاح!</h3>
                  <p className="text-muted-foreground mb-6">
                    {registerRole === 'nurse' ? 'سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.' : 'يمكنك الآن تسجيل الدخول وطلب الخدمات الصحية.'}
                  </p>
                  <Button className={`bg-gradient-to-r ${roleConfig[registerRole].gradient} text-white hover:opacity-90`} onClick={() => { setRegisterSuccess(false); setMode('login') }}>
                    تسجيل الدخول
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key={`${mode}-${registerRole}`}
                  initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* ============ UNIFIED LOGIN FORM ============ */}
                  {mode === 'login' && (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl shadow-violet-500/25 mb-3 ring-4 ring-white/20"
                        >
                          <ScanFace className="w-7 h-7 text-white" />
                        </motion.div>
                        <h2 className="text-xl font-bold">مرحباً بعودتك</h2>
                        <p className="text-sm text-muted-foreground mt-1">سجّل دخولك وسنتعرف على حسابك تلقائياً</p>
                      </div>

                      {/* Role hint badges */}
                      <div className="flex items-center justify-center gap-1.5 mb-5">
                        {(['beneficiary', 'nurse', 'admin'] as const).map((r) => {
                          const config = roleConfig[r]
                          const Icon = config.icon
                          return (
                            <div key={r} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 border shadow-sm">
                              <Icon className={`w-3 h-3 ${config.textAccent}`} />
                              <span className="text-[10px] font-bold text-slate-500">{config.label}</span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                          <ScanFace className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600">تعرف تلقائي</span>
                        </div>
                      </div>

                      {/* Firebase Disconnected Warning */}
                      {firebaseStatus === 'disconnected' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-bold text-red-800">قاعدة البيانات غير متصلة</p>
                            <p className="text-red-700 mt-1 text-xs">{firebaseError || 'لا يمكن الاتصال بقاعدة البيانات'}</p>
                            <Button variant="outline" size="sm" className="mt-2 border-red-300 text-red-700 h-7 text-xs" onClick={() => setView('firebase-setup')}>
                              <Database className="w-3 h-3 ml-1" />إعداد قاعدة البيانات
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="login-phone" className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-violet-500" />رقم الهاتف
                        </Label>
                        <Input
                          id="login-phone"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm(f => ({ ...f, phone: e.target.value }))}
                          onKeyDown={handleKeyDown}
                          placeholder="7XXXXXXXX"
                          dir="ltr"
                          className="h-11 text-left"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-violet-500" />كلمة المرور
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                            onKeyDown={handleKeyDown}
                            placeholder="أدخل كلمة المرور"
                            className="h-11 pl-10"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg shadow-violet-500/25"
                        onClick={handleUnifiedLogin}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span>جارٍ التعرف على حسابك...</span></span>
                        ) : (
                          <span className="flex items-center gap-2"><ScanFace className="w-5 h-5" /><span>تسجيل الدخول</span></span>
                        )}
                      </Button>

                      <div className="text-center">
                        <button onClick={() => setMode('register')} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />ليس لديك حساب؟ إنشاء حساب جديد
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============ REGISTER FORM ============ */}
                  {mode === 'register' && (
                    <div className="space-y-4">
                      {/* Register Role Selector (NO admin) */}
                      <div className="flex bg-slate-50 rounded-xl p-1.5 gap-1">
                        {(['beneficiary', 'nurse'] as const).map((r) => {
                          const config = roleConfig[r]
                          const Icon = config.icon
                          const isActive = registerRole === r
                          return (
                            <button
                              key={r}
                              onClick={() => setRegisterRole(r)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                                isActive
                                  ? `bg-gradient-to-l ${config.gradient} text-white shadow-md ${config.glowColor}`
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{config.label}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="text-center mb-2">
                        <h2 className="text-lg font-bold">إنشاء حساب {roleConfig[registerRole].label}</h2>
                      </div>

                      {/* Nurse Register */}
                      {registerRole === 'nurse' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label className="text-xs">الاسم الأول *</Label><Input value={nurseRegForm.firstName} onChange={e => setNurseRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="الاسم الأول" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">الاسم الثاني *</Label><Input value={nurseRegForm.secondName} onChange={e => setNurseRegForm(f => ({ ...f, secondName: e.target.value }))} placeholder="الاسم الثاني" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">الاسم الثالث *</Label><Input value={nurseRegForm.thirdName} onChange={e => setNurseRegForm(f => ({ ...f, thirdName: e.target.value }))} placeholder="الاسم الثالث" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">الاسم الرابع *</Label><Input value={nurseRegForm.lastName} onChange={e => setNurseRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="اللقب" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">رقم الهاتف *</Label><Input value={nurseRegForm.phone} onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-10 text-left" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">الموقع *</Label><Input value={nurseRegForm.location} onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة / المنطقة" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">الرقم الوطني *</Label><Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="الرقم الوطني" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">رقم المزاولة *</Label><Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">تاريخ انتهاء المزاولة *</Label><Input type="date" value={nurseRegForm.licenseExpiryDate} onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} dir="ltr" className="h-10" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">كلمة المرور *</Label><Input type="password" value={nurseRegForm.password} onChange={e => setNurseRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف على الأقل" className="h-10" /></div>
                          </div>
                          <div className="space-y-1.5"><Label className="text-xs">تأكيد كلمة المرور *</Label><Input type="password" value={nurseRegForm.confirmPassword} onChange={e => setNurseRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-10" /></div>
                          <Button className={`w-full h-11 font-semibold bg-gradient-to-r ${roleConfig[registerRole].gradient} text-white hover:opacity-90 transition-all duration-300 shadow-lg`} onClick={handleNurseRegister} disabled={loading}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                          </Button>
                          <div className="text-center">
                            <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">لديك حساب؟ تسجيل الدخول</button>
                          </div>
                        </div>
                      )}

                      {/* Beneficiary Register */}
                      {registerRole === 'beneficiary' && (
                        <div className="space-y-4">
                          <div className="space-y-2"><Label>الاسم الكامل *</Label><Input value={beneficiaryRegForm.name} onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" className="h-11" /></div>
                          <div className="space-y-2"><Label>رقم الهاتف *</Label><Input value={beneficiaryRegForm.phone} onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left" /></div>
                          <div className="space-y-2"><Label>الموقع *</Label><Input value={beneficiaryRegForm.location} onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة / المنطقة" className="h-11" /></div>
                          <div className="space-y-2"><Label>كلمة المرور *</Label><Input type="password" value={beneficiaryRegForm.password} onChange={e => setBeneficiaryRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف على الأقل" className="h-11" /></div>
                          <div className="space-y-2"><Label>تأكيد كلمة المرور *</Label><Input type="password" value={beneficiaryRegForm.confirmPassword} onChange={e => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-11" /></div>
                          <Button className={`w-full h-12 font-semibold bg-gradient-to-r ${roleConfig[registerRole].gradient} text-white hover:opacity-90 transition-all duration-300 shadow-lg`} onClick={handleBeneficiaryRegister} disabled={loading}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                          </Button>
                          <div className="text-center">
                            <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">لديك حساب؟ تسجيل الدخول</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setView('landing')}>
            <ArrowRight className="w-4 h-4 ml-2" />العودة للرئيسية
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
