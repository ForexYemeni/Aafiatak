'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Stethoscope, Heart, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Sparkles, ArrowRight
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

// ─── Types ───
type Role = 'beneficiary' | 'nurse' | 'admin'
type AuthTab = 'login' | 'register'

// ─── Password Input with toggle ───
function PasswordInput({
  value,
  onChange,
  placeholder = 'أدخل كلمة المرور',
  showPassword,
  setShowPassword,
  disabled = false,
  onKeyDown,
  className = 'h-12',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
}) {
  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`${className} pl-10 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-300`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-600 transition-colors"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─── Floating particles component ───
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/25 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-rose-300/15 to-orange-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-emerald-300/20 to-teal-300/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
  )
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export default function LandingPage() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()

  // ─── Auth tab state ───
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [loginRole, setLoginRole] = useState<Role>('beneficiary')
  const [registerRole, setRegisterRole] = useState<'beneficiary' | 'nurse'>('beneficiary')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // ─── Login forms ───
  const [adminForm, setAdminForm] = useState({ username: '', password: '' })
  const [nurseLoginForm, setNurseLoginForm] = useState({ phone: '', password: '' })
  const [beneficiaryLoginForm, setBeneficiaryLoginForm] = useState({ phone: '', password: '' })

  // ─── Register forms ───
  const [nurseRegForm, setNurseRegForm] = useState({
    firstName: '', secondName: '', thirdName: '', lastName: '',
    phone: '', location: '', nationalId: '', licenseNumber: '',
    licenseExpiryDate: '', password: '', confirmPassword: '',
  })
  const [beneficiaryRegForm, setBeneficiaryRegForm] = useState({
    name: '', phone: '', location: '', password: '', confirmPassword: '',
  })

  // ─── Open auth tab ───
  const openAuth = useCallback((tab: AuthTab, role?: Role) => {
    setAuthTab(tab)
    setRegisterSuccess(false)
    if (tab === 'login' && role) setLoginRole(role)
    if (tab === 'register' && role && role !== 'admin') setRegisterRole(role as 'beneficiary' | 'nurse')
  }, [])

  // ═══════════════════════════════════════════
  //  LOGIN HANDLERS
  // ═══════════════════════════════════════════

  const handleAdminLogin = async () => {
    if (!adminForm.username || !adminForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data, 'admin')
        if (data.mustChangePassword) {
          setView('admin-change-password')
          toast({ title: 'يجب تغيير كلمة المرور', description: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة' })
        } else {
          setView('admin-dashboard')
          toast({ title: 'مرحباً ' + data.name })
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleNurseLogin = async () => {
    if (!nurseLoginForm.phone || !nurseLoginForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/nurse/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nurseLoginForm),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data, 'nurse')
        setView('nurse-dashboard')
        toast({ title: 'مرحباً ' + data.firstName })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleBeneficiaryLogin = async () => {
    if (!beneficiaryLoginForm.phone || !beneficiaryLoginForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/beneficiary/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(beneficiaryLoginForm),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data, 'beneficiary')
        setView('beneficiary-dashboard')
        toast({ title: 'مرحباً ' + data.name })
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════
  //  REGISTER HANDLERS
  // ═══════════════════════════════════════════

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
      if (res.ok) {
        setRegisterSuccess(true)
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
      if (res.ok) {
        setRegisterSuccess(true)
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

  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (loginRole === 'admin') handleAdminLogin()
      else if (loginRole === 'nurse') handleNurseLogin()
      else handleBeneficiaryLogin()
    }
  }

  const handleRegisterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (registerRole === 'nurse') handleNurseRegister()
      else handleBeneficiaryRegister()
    }
  }

  // ─── Role config ───
  const roleConfig = {
    beneficiary: {
      icon: Heart, label: 'مستفيد',
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      lightGradient: 'from-violet-500 to-fuchsia-500',
      textAccent: 'text-violet-600',
      bgAccent: 'bg-violet-50',
      borderAccent: 'border-violet-200',
      glowColor: 'shadow-violet-500/25',
    },
    nurse: {
      icon: Stethoscope, label: 'ممرض',
      gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
      lightGradient: 'from-cyan-500 to-blue-500',
      textAccent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
      borderAccent: 'border-blue-200',
      glowColor: 'shadow-blue-500/25',
    },
    admin: {
      icon: Shield, label: 'مدير',
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      lightGradient: 'from-amber-500 to-orange-500',
      textAccent: 'text-amber-600',
      bgAccent: 'bg-amber-50',
      borderAccent: 'border-amber-200',
      glowColor: 'shadow-amber-500/25',
    },
  }

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20" dir="rtl">
      {/* Background Effects */}
      <FloatingOrbs />

      {/* Decorative mesh gradient */}
      <div className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(at 20% 20%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 80%, rgba(236, 72, 153, 0.12) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.08) 0px, transparent 50%)
          `
        }}
      />

      {/* ─── Logo & Brand ─── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="pt-8 pb-5 text-center relative z-10"
      >
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
          <Image src="/logo.png" alt="عافيتك" width={72} height={72} className="rounded-2xl mx-auto mb-4 shadow-2xl relative z-10 ring-2 ring-white/50" priority />
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-l from-violet-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
          عافيتك
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium tracking-wide">
          رعاية صحية احترافية في منزلك
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-violet-400 font-semibold">صحة · رعاية · ثقة</span>
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
        </div>
      </motion.div>

      {/* ─── Main Card Container ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="w-full max-w-xl mx-auto px-4 pb-8 flex-1 flex flex-col relative z-10"
      >
        <div className="relative rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl shadow-violet-500/10">
          {/* Glassmorphism card background */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-violet-50/40 to-fuchsia-50/30" />
          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/60" />

          <div className="relative z-10 flex flex-col flex-1">
            {/* ─── Tab Buttons ─── */}
            <div className="flex p-2 gap-2">
              {([
                { key: 'login' as AuthTab, label: 'تسجيل الدخول', icon: ArrowRight },
                { key: 'register' as AuthTab, label: 'إنشاء حساب', icon: UserPlus },
              ]).map((tab) => {
                const Icon = tab.icon
                const isActive = authTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setAuthTab(tab.key); setRegisterSuccess(false) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-500 relative ${
                      isActive
                        ? `bg-gradient-to-l ${isActive && tab.key === 'login' ? 'from-violet-600 via-purple-600 to-fuchsia-600' : 'from-cyan-600 via-blue-600 to-indigo-600'} text-white shadow-lg ${isActive && tab.key === 'login' ? 'shadow-violet-500/30' : 'shadow-blue-500/30'}`
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ─── Tab Content ─── */}
            <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              <AnimatePresence mode="wait">

                {/* ═══════════════════════════════════ */}
                {/* LOGIN TAB */}
                {/* ═══════════════════════════════════ */}
                {authTab === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {/* Login Role Selector */}
                    <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-6 border border-white/60 shadow-sm">
                      {(['beneficiary', 'nurse', 'admin'] as Role[]).map((r) => {
                        const config = roleConfig[r]
                        const Icon = config.icon
                        const isActive = loginRole === r
                        return (
                          <button
                            key={r}
                            onClick={() => setLoginRole(r)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-400 ${
                              isActive
                                ? `bg-gradient-to-l ${config.gradient} text-white shadow-lg ${config.glowColor}`
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{config.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black text-slate-800">
                        مرحباً بعودتك
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        سجّل دخولك كـ{roleConfig[loginRole].label}
                      </p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      {loginRole === 'admin' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">اسم المستخدم</Label>
                            <Input
                              value={adminForm.username}
                              onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
                              onKeyDown={handleLoginKeyDown}
                              placeholder="أدخل اسم المستخدم"
                              className="h-12 bg-white/60 backdrop-blur-sm border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-300"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">كلمة المرور</Label>
                            <PasswordInput
                              value={adminForm.password}
                              onChange={v => setAdminForm(f => ({ ...f, password: v }))}
                              onKeyDown={handleLoginKeyDown}
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              disabled={loading}
                            />
                          </div>
                        </>
                      )}

                      {loginRole === 'nurse' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">رقم الهاتف</Label>
                            <Input
                              value={nurseLoginForm.phone}
                              onChange={e => setNurseLoginForm(f => ({ ...f, phone: e.target.value }))}
                              onKeyDown={handleLoginKeyDown}
                              placeholder="7XXXXXXXX"
                              dir="ltr"
                              className="h-12 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 text-left transition-all duration-300"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">كلمة المرور</Label>
                            <PasswordInput
                              value={nurseLoginForm.password}
                              onChange={v => setNurseLoginForm(f => ({ ...f, password: v }))}
                              onKeyDown={handleLoginKeyDown}
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              disabled={loading}
                            />
                          </div>
                        </>
                      )}

                      {loginRole === 'beneficiary' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">رقم الهاتف</Label>
                            <Input
                              value={beneficiaryLoginForm.phone}
                              onChange={e => setBeneficiaryLoginForm(f => ({ ...f, phone: e.target.value }))}
                              onKeyDown={handleLoginKeyDown}
                              placeholder="7XXXXXXXX"
                              dir="ltr"
                              className="h-12 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 text-left transition-all duration-300"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">كلمة المرور</Label>
                            <PasswordInput
                              value={beneficiaryLoginForm.password}
                              onChange={v => setBeneficiaryLoginForm(f => ({ ...f, password: v }))}
                              onKeyDown={handleLoginKeyDown}
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              disabled={loading}
                            />
                          </div>
                        </>
                      )}

                      <Button
                        className={`w-full h-12 text-base font-bold bg-gradient-to-l ${roleConfig[loginRole].gradient} text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg ${roleConfig[loginRole].glowColor} border-0 transition-all duration-300 rounded-xl`}
                        onClick={() => {
                          if (loginRole === 'admin') handleAdminLogin()
                          else if (loginRole === 'nurse') handleNurseLogin()
                          else handleBeneficiaryLogin()
                        }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <span className="flex items-center gap-2">
                            تسجيل الدخول
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </span>
                        )}
                      </Button>

                      {loginRole !== 'admin' && (
                        <div className="text-center pt-1">
                          <button
                            onClick={() => setAuthTab('register')}
                            className="text-sm text-slate-500 hover:text-violet-600 transition-colors inline-flex items-center gap-1.5 font-medium"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            ليس لديك حساب؟ إنشاء حساب جديد
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ═══════════════════════════════════ */}
                {/* REGISTER TAB */}
                {/* ═══════════════════════════════════ */}
                {authTab === 'register' && (
                  <motion.div
                    key={`register-${registerSuccess ? 'success' : 'form'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {registerSuccess ? (
                      /* Success State */
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                          className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${roleConfig[registerRole].gradient} mx-auto mb-6 shadow-2xl ${roleConfig[registerRole].glowColor}`}
                        >
                          <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-black mb-3 text-slate-800">تم التسجيل بنجاح!</h3>
                        <p className="text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
                          {registerRole === 'nurse'
                            ? 'سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.'
                            : 'يمكنك الآن تسجيل الدخول والاستفادة من خدماتنا الصحية.'}
                        </p>
                        <Button
                          className={`bg-gradient-to-l ${roleConfig[registerRole].gradient} text-white hover:opacity-90 border-0 shadow-lg ${roleConfig[registerRole].glowColor} rounded-xl px-8 h-12 font-bold`}
                          onClick={() => { setRegisterSuccess(false); setAuthTab('login') }}
                        >
                          تسجيل الدخول الآن
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Register Role Selector (NO admin) */}
                        <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-6 border border-white/60 shadow-sm">
                          {(['beneficiary', 'nurse'] as const).map((r) => {
                            const config = roleConfig[r]
                            const Icon = config.icon
                            const isActive = registerRole === r
                            return (
                              <button
                                key={r}
                                onClick={() => setRegisterRole(r)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-400 ${
                                  isActive
                                    ? `bg-gradient-to-l ${config.gradient} text-white shadow-lg ${config.glowColor}`
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{config.label}</span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="text-center mb-5">
                          <h3 className="text-xl font-black text-slate-800">
                            حساب جديد
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            أنشئ حسابك كـ{roleConfig[registerRole].label}
                          </p>
                        </div>

                        {/* Nurse Register Form */}
                        {registerRole === 'nurse' && (
                          <div className="space-y-3 max-w-lg mx-auto">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">الاسم الأول *</Label>
                                <Input value={nurseRegForm.firstName} onChange={e => setNurseRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="الاسم الأول" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">الاسم الثاني *</Label>
                                <Input value={nurseRegForm.secondName} onChange={e => setNurseRegForm(f => ({ ...f, secondName: e.target.value }))} placeholder="الاسم الثاني" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">الاسم الثالث *</Label>
                                <Input value={nurseRegForm.thirdName} onChange={e => setNurseRegForm(f => ({ ...f, thirdName: e.target.value }))} placeholder="الاسم الثالث" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">الاسم الرابع *</Label>
                                <Input value={nurseRegForm.lastName} onChange={e => setNurseRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="اللقب" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">رقم الهاتف *</Label>
                                <Input value={nurseRegForm.phone} onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 text-left transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">الموقع *</Label>
                                <Input value={nurseRegForm.location} onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">رقم الهوية *</Label>
                                <Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="رقم الهوية" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">رقم الترخيص *</Label>
                                <Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-600">تاريخ انتهاء الترخيص *</Label>
                              <Input
                                type="date"
                                value={nurseRegForm.licenseExpiryDate}
                                onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))}
                                className="h-10 bg-white/60 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300"
                                onKeyDown={handleRegisterKeyDown}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-600">كلمة المرور *</Label>
                              <PasswordInput
                                value={nurseRegForm.password}
                                onChange={v => setNurseRegForm(f => ({ ...f, password: v }))}
                                onKeyDown={handleRegisterKeyDown}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                className="h-10"
                                placeholder="كلمة المرور (6 أحرف على الأقل)"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-600">تأكيد كلمة المرور *</Label>
                              <PasswordInput
                                value={nurseRegForm.confirmPassword}
                                onChange={v => setNurseRegForm(f => ({ ...f, confirmPassword: v }))}
                                onKeyDown={handleRegisterKeyDown}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                className="h-10"
                                placeholder="أعد إدخال كلمة المرور"
                              />
                            </div>
                            <Button
                              className={`w-full h-12 font-bold bg-gradient-to-l ${roleConfig.nurse.gradient} text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg ${roleConfig.nurse.glowColor} border-0 transition-all duration-300 rounded-xl`}
                              onClick={handleNurseRegister}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب ممرض'}
                            </Button>
                            <div className="text-center">
                              <button
                                onClick={() => setAuthTab('login')}
                                className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
                              >
                                لديك حساب؟ تسجيل الدخول
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Beneficiary Register Form */}
                        {registerRole === 'beneficiary' && (
                          <div className="space-y-4 max-w-md mx-auto">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">الاسم الكامل *</Label>
                              <Input
                                value={beneficiaryRegForm.name}
                                onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))}
                                onKeyDown={handleRegisterKeyDown}
                                placeholder="أدخل اسمك الكامل"
                                className="h-12 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-300"
                                disabled={loading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">رقم الهاتف *</Label>
                              <Input
                                value={beneficiaryRegForm.phone}
                                onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))}
                                onKeyDown={handleRegisterKeyDown}
                                placeholder="7XXXXXXXX"
                                dir="ltr"
                                className="h-12 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 text-left transition-all duration-300"
                                disabled={loading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">الموقع *</Label>
                              <Input
                                value={beneficiaryRegForm.location}
                                onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))}
                                onKeyDown={handleRegisterKeyDown}
                                placeholder="المدينة / المنطقة"
                                className="h-12 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-300"
                                disabled={loading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">كلمة المرور *</Label>
                              <PasswordInput
                                value={beneficiaryRegForm.password}
                                onChange={v => setBeneficiaryRegForm(f => ({ ...f, password: v }))}
                                onKeyDown={handleRegisterKeyDown}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                disabled={loading}
                                placeholder="كلمة المرور (6 أحرف على الأقل)"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">تأكيد كلمة المرور *</Label>
                              <PasswordInput
                                value={beneficiaryRegForm.confirmPassword}
                                onChange={v => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: v }))}
                                onKeyDown={handleRegisterKeyDown}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                disabled={loading}
                                placeholder="أعد إدخال كلمة المرور"
                              />
                            </div>
                            <Button
                              className={`w-full h-12 text-base font-bold bg-gradient-to-l ${roleConfig.beneficiary.gradient} text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg ${roleConfig.beneficiary.glowColor} border-0 transition-all duration-300 rounded-xl`}
                              onClick={handleBeneficiaryRegister}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب'}
                            </Button>
                            <div className="text-center">
                              <button
                                onClick={() => setAuthTab('login')}
                                className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium"
                              >
                                لديك حساب؟ تسجيل الدخول
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="pb-6 text-center relative z-10"
      >
        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} عافيتك · جميع الحقوق محفوظة
        </p>
      </motion.div>
    </div>
  )
}
