'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Stethoscope, Heart, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Sparkles, ArrowRight, Navigation, MapPin, AlertTriangle,
  Check, X, Phone, CreditCard, FileBadge, Lock, ChevronLeft, User,
  RefreshCw, BadgeCheck
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getGPSLocation, getDisplayLocation } from '@/lib/location-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

// ─── Types ───
type Role = 'beneficiary' | 'nurse' | 'admin'
type AuthTab = 'login' | 'register'
type NurseRegStep = 1 | 2 | 3

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
  accentColor = 'violet',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  accentColor?: 'violet' | 'blue' | 'amber'
}) {
  const colorMap = {
    violet: 'border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 text-violet-400 hover:text-violet-600',
    blue: 'border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 text-blue-400 hover:text-blue-600',
    amber: 'border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 text-amber-400 hover:text-amber-600',
  }
  const colors = colorMap[accentColor]

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`${className} pl-10 bg-white/60 backdrop-blur-sm ${colors.split(' ').slice(0, 2).join(' ')} transition-all duration-300`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.split(' ').slice(2).join(' ')} transition-colors`}
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

// ─── Step Indicator for Nurse Registration ───
function StepIndicator({ currentStep, steps }: { currentStep: NurseRegStep; steps: { num: number; label: string; icon: React.ElementType }[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-5">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isActive = currentStep === step.num
        const isCompleted = currentStep > step.num
        return (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e2e8f0',
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-500 ${
                  isActive ? 'shadow-blue-500/30 ring-2 ring-blue-200' : ''
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                )}
              </motion.div>
              <span className={`text-[10px] mt-1.5 font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="mx-1.5 mb-5">
                <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Geolocation Helper (fast <5s) ───
function useGeoLocation() {
  const { toast } = useToast()

  const getLocation = useCallback(async (onSuccess: (address: string) => void) => {
    if (!navigator.geolocation) {
      toast({ title: 'غير مدعوم', description: 'متصفحك لا يدعم تحديد الموقع', variant: 'destructive' })
      return
    }
    toast({ title: 'جارٍ تحديد الموقع...', description: 'يرجى الانتظار' })

    const result = await getGPSLocation()
    if (result) {
      onSuccess(result.address)
      const display = getDisplayLocation(result.address)
      toast({ title: 'تم تحديد الموقع بنجاح', description: display.substring(0, 80) })
    } else {
      toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
    }
  }, [toast])

  return { getLocation }
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export default function LandingPage() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()
  const { getLocation } = useGeoLocation()

  // ─── Auth tab state ───
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [registerRole, setRegisterRole] = useState<'beneficiary' | 'nurse'>('beneficiary')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [detectedRole, setDetectedRole] = useState<Role | null>(null)
  const [countdown, setCountdown] = useState(5)

  // ─── Nurse Registration Step ───
  const [nurseStep, setNurseStep] = useState<NurseRegStep>(1)

  // ─── Unified login form ───
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' })

  // ─── Register forms ───
  const [nurseRegForm, setNurseRegForm] = useState({
    fullName: '',
    phone: '', location: '', nationalId: '', licenseNumber: '',
    licenseExpiryDate: '', password: '', confirmPassword: '',
  })
  const [beneficiaryRegForm, setBeneficiaryRegForm] = useState({
    name: '', phone: '', location: '', password: '', confirmPassword: '',
  })

  // ─── Open auth tab ───
  const openAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab)
    setRegisterSuccess(false)
    setNurseStep(1)
  }, [])

  // ─── Countdown effect when role detected ───
  useEffect(() => {
    if (!detectedRole) { setCountdown(5); return }
    setCountdown(5)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [detectedRole])

  // ─── Nurse step validation ───
  const isNurseStep1Valid = nurseRegForm.fullName.trim().split(/\s+/).length >= 3 && nurseRegForm.phone && nurseRegForm.location
  const isNurseStep2Valid = nurseRegForm.nationalId && nurseRegForm.licenseNumber && nurseRegForm.licenseExpiryDate
  const isLicenseExpired = nurseRegForm.licenseExpiryDate ? new Date(nurseRegForm.licenseExpiryDate) < new Date(new Date().toDateString()) : false
  const isNurseStep3Valid = nurseRegForm.password.length >= 6 && nurseRegForm.password === nurseRegForm.confirmPassword

  // ═══════════════════════════════════════════
  //  UNIFIED LOGIN HANDLER - Auto-detect role
  // ═══════════════════════════════════════════

  const handleUnifiedLogin = async () => {
    if (!loginForm.phone || !loginForm.password) {
      toast({ title: 'خطأ', description: 'يرجى إدخال رقم الهاتف وكلمة المرور', variant: 'destructive' })
      return
    }
    setLoading(true)
    setDetectedRole(null)
    try {
      // Try all three APIs simultaneously for speed
      const results = await Promise.all([
        fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loginForm.phone, password: loginForm.password }),
        }).then(r => r.json().then(d => ({ ok: r.ok, data: d, role: 'admin' as const }))).catch(() => ({ ok: false, data: { error: '' }, role: 'admin' as const })),
        fetch('/api/nurse/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loginForm.phone, password: loginForm.password }),
        }).then(r => r.json().then(d => ({ ok: r.ok, data: d, role: 'nurse' as const }))).catch(() => ({ ok: false, data: { error: '' }, role: 'nurse' as const })),
        fetch('/api/beneficiary/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loginForm.phone, password: loginForm.password }),
        }).then(r => r.json().then(d => ({ ok: r.ok, data: d, role: 'beneficiary' as const }))).catch(() => ({ ok: false, data: { error: '' }, role: 'beneficiary' as const })),
      ])

      // Check in priority order: admin → nurse → beneficiary
      const successResult = results.find(r => r.ok)

      if (successResult) {
        const { data, role } = successResult
        // Show detected role animation
        setDetectedRole(role)
        // 5 seconds animation before navigating
        await new Promise(res => setTimeout(res, 5000))

        setUser(data, role)
        if (role === 'admin') {
          if (data.mustChangePassword) {
            setView('admin-change-password')
            toast({ title: 'يجب تغيير كلمة المرور', description: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة' })
          } else {
            setView('admin-dashboard')
            const roleLabel = data.role === 'sub-admin' ? 'مدير فرعي' : 'مدير'
            toast({ title: `مرحباً ${data.name}`, description: `تم تسجيل الدخول ك${roleLabel}` })
          }
        } else if (role === 'nurse') {
          setView('nurse-dashboard')
          toast({ title: `مرحباً ${data.firstName}` })
        } else {
          setView('beneficiary-dashboard')
          toast({ title: `مرحباً ${data.name}` })
        }
      } else {
        // All failed - get first meaningful error message
        const errorMsg = results.find(r => r.data?.error)?.data?.error || 'رقم الهاتف أو كلمة المرور غير صحيحة'
        toast({ title: 'خطأ في تسجيل الدخول', description: errorMsg, variant: 'destructive' })
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
    if (!nurseRegForm.fullName || !nurseRegForm.phone || !nurseRegForm.location || !nurseRegForm.nationalId || !nurseRegForm.licenseNumber || !nurseRegForm.licenseExpiryDate || !nurseRegForm.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    const nameParts = nurseRegForm.fullName.trim().split(/\s+/)
    if (nameParts.length < 3) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم الرباعي كاملاً (3 أسماء على الأقل)', variant: 'destructive' })
      return
    }
    const expiryDate = new Date(nurseRegForm.licenseExpiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate < today) {
      toast({ title: 'ترخيص منتهي', description: 'لا يمكن التسجيل برخصة مزاولة منتهية الصلاحية. يرجى تجديد رخصتك أولاً', variant: 'destructive' })
      return
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
      const parts = nurseRegForm.fullName.trim().split(/\s+/)
      const res = await fetch('/api/nurse/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: parts[0] || '',
          secondName: parts[1] || '',
          thirdName: parts[2] || '',
          lastName: parts[3] || parts[2] || '',
          phone: nurseRegForm.phone,
          location: nurseRegForm.location,
          nationalId: nurseRegForm.nationalId,
          licenseNumber: nurseRegForm.licenseNumber,
          licenseExpiryDate: nurseRegForm.licenseExpiryDate,
          password: nurseRegForm.password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Auto-login after registration - show role detection animation then redirect
        setDetectedRole('nurse')
        await new Promise(r => setTimeout(r, 5000))
        setUser(data, 'nurse')
        setView('nurse-dashboard')
        toast({ title: `مرحباً ${data.firstName}`, description: 'تم إنشاء حسابك بنجاح! أكمل ملفك الشخصي لتحسين فرص التعيين' })
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
        // Auto-login after registration - show role detection animation then redirect
        setDetectedRole('beneficiary')
        await new Promise(r => setTimeout(r, 5000))
        setUser(data, 'beneficiary')
        setView('beneficiary-dashboard')
        toast({ title: `مرحباً ${data.name}`, description: 'تم إنشاء حسابك بنجاح! يمكنك الآن طلب الخدمات الصحية' })
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
      handleUnifiedLogin()
    }
  }

  const handleRegisterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (registerRole === 'nurse') {
        if (nurseStep === 1 && isNurseStep1Valid) setNurseStep(2)
        else if (nurseStep === 2 && isNurseStep2Valid && !isLicenseExpired) setNurseStep(3)
        else if (nurseStep === 3) handleNurseRegister()
      } else {
        handleBeneficiaryRegister()
      }
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

  // ─── Nurse registration steps config ───
  const nurseSteps = [
    { num: 1, label: 'الشخصية', icon: User },
    { num: 2, label: 'الترخيص', icon: FileBadge },
    { num: 3, label: 'الحساب', icon: Lock },
  ]

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
                    onClick={() => { setAuthTab(tab.key); setRegisterSuccess(false); setNurseStep(1) }}
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
                {/* UNIFIED LOGIN TAB - Auto Role Detection */}
                {/* ═══════════════════════════════════ */}
                {authTab === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {/* Detected Role Animation Overlay — Professional Design */}
                    <AnimatePresence>
                      {detectedRole && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-2xl rounded-3xl overflow-hidden"
                        >
                          {/* Animated background particles */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Pulsing rings */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0.8 }}
                              animate={{ scale: 4, opacity: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 ${detectedRole === 'admin' ? 'border-amber-400/60' : detectedRole === 'nurse' ? 'border-blue-400/60' : 'border-violet-400/60'}`}
                            />
                            <motion.div
                              initial={{ scale: 0, opacity: 0.6 }}
                              animate={{ scale: 3.5, opacity: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 ${detectedRole === 'admin' ? 'border-orange-400/40' : detectedRole === 'nurse' ? 'border-indigo-400/40' : 'border-purple-400/40'}`}
                            />
                            <motion.div
                              initial={{ scale: 0, opacity: 0.4 }}
                              animate={{ scale: 5, opacity: 0 }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 1 }}
                              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border ${detectedRole === 'admin' ? 'border-amber-300/30' : detectedRole === 'nurse' ? 'border-cyan-300/30' : 'border-fuchsia-300/30'}`}
                            />
                            {/* Gradient orb behind icon */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br ${roleConfig[detectedRole].gradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
                          </div>

                          <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', duration: 0.7, bounce: 0.2 }}
                            className="flex flex-col items-center gap-5 relative z-10"
                          >
                            {/* Main Icon with ring border */}
                            <div className="relative">
                              {/* Rotating ring border */}
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                className={`absolute -inset-3 rounded-full border-2 border-dashed ${detectedRole === 'admin' ? 'border-amber-300/50' : detectedRole === 'nurse' ? 'border-blue-300/50' : 'border-violet-300/50'}`}
                              />
                              {/* Outer glow ring */}
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.3, opacity: [0, 0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className={`absolute -inset-4 rounded-full bg-gradient-to-br ${roleConfig[detectedRole].gradient} opacity-20 blur-md`}
                              />
                              {/* Icon container */}
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.5, bounce: 0.5, delay: 0.1 }}
                                className={`w-28 h-28 rounded-full bg-gradient-to-br ${roleConfig[detectedRole].gradient} flex items-center justify-center shadow-2xl ${roleConfig[detectedRole].glowColor} ring-4 ring-white/80`}
                              >
                                {(() => {
                                  const Icon = roleConfig[detectedRole].icon
                                  return <Icon className="w-14 h-14 text-white drop-shadow-lg" />
                                })()}
                              </motion.div>
                              {/* Verified badge */}
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.5, bounce: 0.6 }}
                                className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg ring-3 ring-white"
                              >
                                <CheckCircle className="w-5 h-5 text-white" />
                              </motion.div>
                            </div>

                            {/* Text content */}
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              className="text-center"
                            >
                              <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-2xl font-black text-slate-800 mb-1"
                              >
                                تم التعرف عليك!
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.65 }}
                                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${roleConfig[detectedRole].bgAccent} border ${roleConfig[detectedRole].borderAccent} mt-2`}
                              >
                                {(() => {
                                  const Icon = roleConfig[detectedRole].icon
                                  return <Icon className={`w-4 h-4 ${roleConfig[detectedRole].textAccent}`} />
                                })()}
                                <span className={`text-sm font-bold ${roleConfig[detectedRole].textAccent}`}>
                                  {detectedRole === 'admin' ? 'مدير النظام' : detectedRole === 'nurse' ? 'ممرض / ممرضة' : 'مستفيد'}
                                </span>
                              </motion.div>
                            </motion.div>

                            {/* Loading indicator with countdown */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.8 }}
                              className="flex flex-col items-center gap-3 mt-1"
                            >
                              {/* Circular countdown */}
                              <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="url(#countdown-gradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / 5)}`} className="transition-all duration-1000 ease-linear" />
                                  <defs>
                                    <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor={detectedRole === 'admin' ? '#f59e0b' : detectedRole === 'nurse' ? '#3b82f6' : '#8b5cf6'} />
                                      <stop offset="100%" stopColor={detectedRole === 'admin' ? '#ef4444' : detectedRole === 'nurse' ? '#06b6d4' : '#d946ef'} />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-700">{countdown}</span>
                              </div>
                              <span className="text-xs font-medium text-slate-400">جارٍ التحويل...</span>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-xl shadow-violet-500/30 mb-4"
                      >
                        <Lock className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-slate-800">
                        مرحباً بعودتك
                      </h3>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        أدخل بياناتك وسنتعرف عليك تلقائياً
                      </p>
                      {/* Role hints */}
                      <div className="flex items-center justify-center gap-3 mt-3">
                        {(['beneficiary', 'nurse', 'admin'] as Role[]).map((r) => {
                          const config = roleConfig[r]
                          const Icon = config.icon
                          return (
                            <div key={r} className="flex items-center gap-1 text-xs text-slate-400">
                              <Icon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-5 max-w-md mx-auto">
                      {/* Phone Input */}
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5 text-white" />
                          </div>
                          رقم الهاتف
                        </Label>
                        <Input
                          value={loginForm.phone}
                          onChange={e => setLoginForm(f => ({ ...f, phone: e.target.value }))}
                          onKeyDown={handleLoginKeyDown}
                          placeholder="7XXXXXXXX"
                          dir="ltr"
                          className="h-13 bg-white/70 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 text-left transition-all duration-300 rounded-xl text-base font-medium tracking-wide"
                          disabled={loading || !!detectedRole}
                        />
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-white" />
                          </div>
                          كلمة المرور
                        </Label>
                        <PasswordInput
                          value={loginForm.password}
                          onChange={v => setLoginForm(f => ({ ...f, password: v }))}
                          onKeyDown={handleLoginKeyDown}
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          disabled={loading || !!detectedRole}
                          accentColor="violet"
                        />
                      </div>

                      {/* Smart Detection Indicator */}
                      {loading && !detectedRole && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center gap-2 py-2"
                        >
                          <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                          <span className="text-xs font-bold text-violet-500">جارٍ التعرف على حسابك...</span>
                        </motion.div>
                      )}

                      {/* Login Button */}
                      <Button
                        className="w-full h-13 text-base font-bold bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 text-white hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/25 border-0 transition-all duration-300 rounded-xl"
                        onClick={handleUnifiedLogin}
                        disabled={loading || !!detectedRole}
                      >
                        {loading ? (
                          detectedRole ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              تم التعرف بنجاح
                            </span>
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          )
                        ) : (
                          <span className="flex items-center gap-2">
                            تسجيل الدخول
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </span>
                        )}
                      </Button>

                      {/* Register Link */}
                      <div className="text-center pt-1">
                        <button
                          onClick={() => setAuthTab('register')}
                          className="text-sm text-slate-500 hover:text-violet-600 transition-colors inline-flex items-center gap-1.5 font-medium"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          ليس لديك حساب؟ إنشاء حساب جديد
                        </button>
                      </div>
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
                      /* Success State - Now with auto-login animation */
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                          className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${roleConfig[registerRole].gradient} mx-auto mb-6 shadow-2xl ${roleConfig[registerRole].glowColor}`}
                        >
                          <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-black mb-3 text-slate-800">تم إنشاء حسابك!</h3>
                        <p className="text-slate-500 mb-4 leading-relaxed max-w-sm mx-auto">
                          جارٍ تسجيل دخولك تلقائياً...
                        </p>
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: registerRole === 'nurse' ? '#3b82f6' : '#8b5cf6' }} />
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
                                onClick={() => { setRegisterRole(r); setNurseStep(1) }}
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

                        <div className="text-center mb-4">
                          <h3 className="text-xl font-black text-slate-800">
                            حساب جديد
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            أنشئ حسابك كـ{roleConfig[registerRole].label}
                          </p>
                        </div>

                        {/* ═══════════════════════════════════ */}
                        {/* NURSE REGISTER FORM - MULTI-STEP */}
                        {/* ═══════════════════════════════════ */}
                        {registerRole === 'nurse' && (
                          <div className="max-w-lg mx-auto">
                            {/* Step Indicator */}
                            <StepIndicator currentStep={nurseStep} steps={nurseSteps} />

                            <AnimatePresence mode="wait">
                              {/* ─── STEP 1: Personal Info ─── */}
                              {nurseStep === 1 && (
                                <motion.div
                                  key="nurse-step-1"
                                  initial={{ opacity: 0, x: 30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -30 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className="space-y-4"
                                >
                                  {/* Section Card: Personal Info */}
                                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-4 border border-blue-100/60 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                                        <User className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-blue-700">المعلومات الشخصية</p>
                                        <p className="text-[10px] text-blue-400">الخطوة 1 من 3</p>
                                      </div>
                                    </div>

                                    {/* Full Name */}
                                    <div className="space-y-2 mb-3">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                                        الاسم الرباعي *
                                      </Label>
                                      <Input
                                        value={nurseRegForm.fullName}
                                        onChange={e => setNurseRegForm(f => ({ ...f, fullName: e.target.value }))}
                                        placeholder="أدخل اسمك الرباعي كاملاً"
                                        className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 rounded-xl text-sm"
                                        onKeyDown={handleRegisterKeyDown}
                                      />
                                      <div className="flex items-center gap-1.5">
                                        {nurseRegForm.fullName.trim().split(/\s+/).filter(Boolean).length >= 3 ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <X className="w-3 h-3 text-slate-300" />
                                        )}
                                        <p className="text-[10px] text-gray-400">يجب أن يحتوي على 3 أسماء على الأقل</p>
                                      </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2 mb-3">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                                        رقم الهاتف *
                                      </Label>
                                      <Input
                                        value={nurseRegForm.phone}
                                        onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="7XXXXXXXX"
                                        dir="ltr"
                                        className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 text-left transition-all duration-300 rounded-xl text-sm"
                                      />
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                        الموقع *
                                      </Label>
                                      <div className="flex gap-2">
                                        <Input
                                          value={nurseRegForm.location}
                                          onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))}
                                          placeholder="المدينة أو العنوان"
                                          className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 flex-1 rounded-xl text-sm"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="shrink-0 h-11 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-3 transition-all duration-300"
                                          disabled={loading}
                                          onClick={() => getLocation((address) => setNurseRegForm(f => ({ ...f, location: address })))}
                                        >
                                          <Navigation className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Next Button */}
                                  <Button
                                    className="w-full h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 rounded-xl"
                                    onClick={() => setNurseStep(2)}
                                    disabled={!isNurseStep1Valid}
                                  >
                                    <span className="flex items-center gap-2">
                                      التالي - معلومات الترخيص
                                      <ChevronLeft className="w-4 h-4" />
                                    </span>
                                  </Button>
                                </motion.div>
                              )}

                              {/* ─── STEP 2: License Info ─── */}
                              {nurseStep === 2 && (
                                <motion.div
                                  key="nurse-step-2"
                                  initial={{ opacity: 0, x: 30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -30 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className="space-y-4"
                                >
                                  {/* Section Card: License Info */}
                                  <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl p-4 border border-amber-100/60 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                                        <FileBadge className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-amber-700">معلومات الترخيص</p>
                                        <p className="text-[10px] text-amber-400">الخطوة 2 من 3</p>
                                      </div>
                                    </div>

                                    {/* National ID + License Number */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                          رقم الهوية *
                                        </Label>
                                        <Input
                                          value={nurseRegForm.nationalId}
                                          onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))}
                                          placeholder="رقم الهوية"
                                          className="h-11 bg-white/70 backdrop-blur-sm border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-300 rounded-xl text-sm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                                          رقم الترخيص *
                                        </Label>
                                        <Input
                                          value={nurseRegForm.licenseNumber}
                                          onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))}
                                          placeholder="رقم الترخيص"
                                          className="h-11 bg-white/70 backdrop-blur-sm border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-300 rounded-xl text-sm"
                                        />
                                      </div>
                                    </div>

                                    {/* License Expiry Date */}
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        تاريخ انتهاء الترخيص *
                                      </Label>
                                      <div className="relative">
                                        <Input
                                          type="date"
                                          value={nurseRegForm.licenseExpiryDate}
                                          onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))}
                                          className={`h-11 bg-white/70 backdrop-blur-sm transition-all duration-300 rounded-xl ${nurseRegForm.licenseExpiryDate && isLicenseExpired ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : 'border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20'}`}
                                          onKeyDown={handleRegisterKeyDown}
                                        />
                                        {nurseRegForm.licenseExpiryDate && (
                                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            {isLicenseExpired ? (
                                              <X className="w-4 h-4 text-red-500" />
                                            ) : (
                                              <Check className="w-4 h-4 text-emerald-500" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {nurseRegForm.licenseExpiryDate && isLicenseExpired && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200"
                                        >
                                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                          <p className="text-xs text-red-600 font-bold">ترخيص منتهي! لا يمكن التسجيل برخصة منتهية الصلاحية</p>
                                        </motion.div>
                                      )}
                                      {nurseRegForm.licenseExpiryDate && !isLicenseExpired && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200"
                                        >
                                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                          <p className="text-xs text-emerald-600 font-bold">الترخيص ساري - يمكن المتابعة</p>
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Back + Next Buttons */}
                                  <div className="flex gap-3">
                                    <Button
                                      variant="outline"
                                      className="flex-1 h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-all duration-300"
                                      onClick={() => setNurseStep(1)}
                                    >
                                      <ArrowRight className="w-4 h-4 ml-1" />
                                      السابق
                                    </Button>
                                    <Button
                                      className="flex-[2] h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 rounded-xl"
                                      onClick={() => setNurseStep(3)}
                                      disabled={!isNurseStep2Valid || isLicenseExpired}
                                    >
                                      <span className="flex items-center gap-2">
                                        التالي - إعداد الحساب
                                        <ChevronLeft className="w-4 h-4" />
                                      </span>
                                    </Button>
                                  </div>
                                </motion.div>
                              )}

                              {/* ─── STEP 3: Account Setup ─── */}
                              {nurseStep === 3 && (
                                <motion.div
                                  key="nurse-step-3"
                                  initial={{ opacity: 0, x: 30 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -30 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className="space-y-4"
                                >
                                  {/* Section Card: Account Setup */}
                                  <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-4 border border-emerald-100/60 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                                        <Lock className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-emerald-700">إعداد الحساب</p>
                                        <p className="text-[10px] text-emerald-400">الخطوة 3 من 3</p>
                                      </div>
                                    </div>

                                    {/* Summary of entered data */}
                                    <div className="bg-white/50 rounded-xl p-3 mb-4 border border-emerald-100/40">
                                      <p className="text-[10px] font-bold text-slate-400 mb-2">ملخص البيانات</p>
                                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 truncate">{nurseRegForm.fullName.substring(0, 20)}</span></div>
                                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500">{nurseRegForm.phone}</span></div>
                                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 truncate">{nurseRegForm.nationalId}</span></div>
                                        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 truncate">{nurseRegForm.licenseNumber}</span></div>
                                      </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2 mb-3">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        كلمة المرور *
                                      </Label>
                                      <PasswordInput
                                        value={nurseRegForm.password}
                                        onChange={v => setNurseRegForm(f => ({ ...f, password: v }))}
                                        onKeyDown={handleRegisterKeyDown}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        className="h-11"
                                        placeholder="كلمة المرور (6 أحرف على الأقل)"
                                        accentColor="blue"
                                      />
                                      {nurseRegForm.password && nurseRegForm.password.length < 6 && (
                                        <p className="text-[10px] text-red-400">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                                      )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        تأكيد كلمة المرور *
                                      </Label>
                                      <PasswordInput
                                        value={nurseRegForm.confirmPassword}
                                        onChange={v => setNurseRegForm(f => ({ ...f, confirmPassword: v }))}
                                        onKeyDown={handleRegisterKeyDown}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        className="h-11"
                                        placeholder="أعد إدخال كلمة المرور"
                                        accentColor="blue"
                                      />
                                      {nurseRegForm.confirmPassword && nurseRegForm.password !== nurseRegForm.confirmPassword && (
                                        <p className="text-[10px] text-red-400">كلمتا المرور غير متطابقتين</p>
                                      )}
                                      {nurseRegForm.confirmPassword && nurseRegForm.password === nurseRegForm.confirmPassword && nurseRegForm.password.length >= 6 && (
                                        <div className="flex items-center gap-1">
                                          <Check className="w-3 h-3 text-emerald-500" />
                                          <p className="text-[10px] text-emerald-500 font-bold">كلمتا المرور متطابقتان</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Back + Submit Buttons */}
                                  <div className="flex gap-3">
                                    <Button
                                      variant="outline"
                                      className="flex-1 h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-all duration-300"
                                      onClick={() => setNurseStep(2)}
                                    >
                                      <ArrowRight className="w-4 h-4 ml-1" />
                                      السابق
                                    </Button>
                                    <Button
                                      className="flex-[2] h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 rounded-xl"
                                      onClick={handleNurseRegister}
                                      disabled={loading || !isNurseStep3Valid}
                                    >
                                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <span className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4" />
                                          إنشاء حساب الممرض
                                        </span>
                                      )}
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Link to login */}
                            <div className="text-center mt-3">
                              <button
                                onClick={() => { setAuthTab('login'); setNurseStep(1) }}
                                className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
                              >
                                لديك حساب؟ تسجيل الدخول
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ═══════════════════════════════════ */}
                        {/* BENEFICIARY REGISTER FORM */}
                        {/* ═══════════════════════════════════ */}
                        {registerRole === 'beneficiary' && (
                          <div className="space-y-4 max-w-md mx-auto">
                            <div className="bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 rounded-2xl p-4 border border-violet-100/60 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                                  <Heart className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-violet-700">معلومات المستفيد</p>
                                  <p className="text-[10px] text-violet-400">أنشئ حسابك لطلب الخدمات الصحية</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-violet-400" />
                                    الاسم الكامل *
                                  </Label>
                                  <Input
                                    value={beneficiaryRegForm.name}
                                    onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))}
                                    onKeyDown={handleRegisterKeyDown}
                                    placeholder="أدخل اسمك الكامل"
                                    className="h-11 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-300 rounded-xl text-sm"
                                    disabled={loading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-violet-400" />
                                    رقم الهاتف *
                                  </Label>
                                  <Input
                                    value={beneficiaryRegForm.phone}
                                    onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))}
                                    onKeyDown={handleRegisterKeyDown}
                                    placeholder="7XXXXXXXX"
                                    dir="ltr"
                                    className="h-11 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 text-left transition-all duration-300 rounded-xl text-sm"
                                    disabled={loading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-violet-400" />
                                    الموقع *
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={beneficiaryRegForm.location}
                                      onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))}
                                      onKeyDown={handleRegisterKeyDown}
                                      placeholder="سيتم تحديد موقعك تلقائياً أو أدخل العنوان"
                                      className="h-11 bg-white/60 backdrop-blur-sm border-violet-200/50 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-300 flex-1 rounded-xl text-sm"
                                      disabled={loading}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="shrink-0 h-11 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 px-3 transition-all duration-300"
                                      disabled={loading}
                                      onClick={() => getLocation((address) => setBeneficiaryRegForm(f => ({ ...f, location: address })))}
                                    >
                                      <Navigation className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-violet-400" />
                                    كلمة المرور *
                                  </Label>
                                  <PasswordInput
                                    value={beneficiaryRegForm.password}
                                    onChange={v => setBeneficiaryRegForm(f => ({ ...f, password: v }))}
                                    onKeyDown={handleRegisterKeyDown}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    disabled={loading}
                                    className="h-11"
                                    placeholder="كلمة المرور (6 أحرف على الأقل)"
                                    accentColor="violet"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-violet-400" />
                                    تأكيد كلمة المرور *
                                  </Label>
                                  <PasswordInput
                                    value={beneficiaryRegForm.confirmPassword}
                                    onChange={v => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: v }))}
                                    onKeyDown={handleRegisterKeyDown}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    disabled={loading}
                                    className="h-11"
                                    placeholder="أعد إدخال كلمة المرور"
                                    accentColor="violet"
                                  />
                                </div>
                              </div>
                            </div>

                            <Button
                              className={`w-full h-12 text-base font-bold bg-gradient-to-l ${roleConfig.beneficiary.gradient} text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg ${roleConfig.beneficiary.glowColor} border-0 transition-all duration-300 rounded-xl`}
                              onClick={handleBeneficiaryRegister}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  إنشاء حساب
                                </span>
                              )}
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
    </div>
  )
}
