'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Stethoscope, Heart, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Activity, Syringe, Brain, Baby, Hand, Pill, ArrowLeft, Moon, Sun
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

// ─── Types ───
type Role = 'beneficiary' | 'nurse' | 'admin'
type AuthTab = 'login' | 'register' | 'services'

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  isActive: boolean
}

// ─── Category icon mapping ───
const categoryIcons: Record<string, React.ElementType> = {
  'تمريض': Stethoscope,
  'علاج طبيعي': Activity,
  'رعاية مسنين': Heart,
  'أطفال': Baby,
  'حقن': Syringe,
  'فحوصات': Brain,
  'علاج نفسي': Brain,
  'رعاية منزلية': Hand,
  'أدوية': Pill,
}

const categoryColors: Record<string, string> = {
  'تمريض': 'from-teal-500 to-emerald-600',
  'علاج طبيعي': 'from-emerald-500 to-teal-600',
  'رعاية مسنين': 'from-rose-400 to-pink-500',
  'أطفال': 'from-sky-400 to-cyan-500',
  'حقن': 'from-amber-400 to-orange-500',
  'فحوصات': 'from-teal-400 to-cyan-600',
  'علاج نفسي': 'from-violet-400 to-purple-500',
  'رعاية منزلية': 'from-emerald-400 to-green-600',
  'أدوية': 'from-red-400 to-rose-500',
}

// ─── Password Input with toggle ───
function PasswordInput({
  value,
  onChange,
  placeholder = 'أدخل كلمة المرور',
  showPassword,
  setShowPassword,
  disabled = false,
  onKeyDown,
  className = 'h-11',
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
        className={`${className} pl-10`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export default function LandingPage() {
  const { setView, setUser, darkMode, toggleDarkMode } = useAppStore()
  const { toast } = useToast()

  // ─── Auth tab state ───
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [loginRole, setLoginRole] = useState<Role>('beneficiary')
  const [registerRole, setRegisterRole] = useState<'beneficiary' | 'nurse'>('beneficiary')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // ─── Services data ───
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('الكل')
  const [modalActiveCategory, setModalActiveCategory] = useState<string>('الكل')

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

  // ─── Fetch services ───
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/beneficiary/services')
        if (res.ok) {
          const data = await res.json()
          setServices(data)
        }
      } catch {
        // silently fail on landing page
      } finally {
        setServicesLoading(false)
      }
    }
    fetchServices()
  }, [])

  // ─── Unique categories ───
  const categories = ['الكل', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))]
  const filteredServices = activeCategory === 'الكل' ? services : services.filter(s => s.category === activeCategory)
  const modalFilteredServices = modalActiveCategory === 'الكل' ? services : services.filter(s => s.category === modalActiveCategory)

  // ─── Open auth tab (replaces old openAuth) ───
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
      gradient: 'from-teal-500 to-emerald-600',
      btnGradient: 'from-teal-500 to-emerald-600',
      textAccent: 'text-teal-600',
      bgLight: 'bg-teal-50',
    },
    nurse: {
      icon: Stethoscope, label: 'ممرض',
      gradient: 'from-emerald-500 to-teal-600',
      btnGradient: 'from-emerald-500 to-teal-600',
      textAccent: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    admin: {
      icon: Shield, label: 'مدير',
      gradient: 'from-amber-500 to-orange-600',
      btnGradient: 'from-amber-500 to-orange-600',
      textAccent: 'text-amber-600',
      bgLight: 'bg-amber-50',
    },
  }

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center" dir="rtl">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label={darkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      >
        {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
      </button>
      {/* ─── Logo & Brand ─── */}
      <div className="pt-8 pb-4 text-center">
        <Image src="/logo.png" alt="عافيتك" width={56} height={56} className="rounded-xl mx-auto mb-3 shadow-md" priority />
        <h1 className="text-2xl font-bold bg-gradient-to-l from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          عافيتك
        </h1>
        <p className="text-sm text-slate-400 mt-1">رعاية صحية في منزلك</p>
      </div>

      {/* ─── Main Card Container ─── */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-8 flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col flex-1">
          {/* ─── Tab Buttons ─── */}
          <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            {([
              { key: 'login' as AuthTab, label: 'تسجيل الدخول' },
              { key: 'register' as AuthTab, label: 'إنشاء حساب' },
              { key: 'services' as AuthTab, label: 'الخدمات' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setAuthTab(tab.key); setRegisterSuccess(false) }}
                className={`flex-1 py-3.5 text-sm font-medium transition-all duration-300 relative ${
                  authTab === tab.key
                    ? 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
                {authTab === tab.key && (
                  <motion.div
                    layoutId="authTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-l from-teal-500 to-emerald-500"
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ─── Tab Content ─── */}
          <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                  transition={{ duration: 0.3 }}
                >
                  {/* Login Role Selector */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                    {(['beneficiary', 'nurse', 'admin'] as Role[]).map((r) => {
                      const config = roleConfig[r]
                      const Icon = config.icon
                      const isActive = loginRole === r
                      return (
                        <button
                          key={r}
                          onClick={() => setLoginRole(r)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isActive
                              ? `bg-white dark:bg-gray-700 shadow-sm ${config.textAccent}`
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
                    <h3 className="text-lg font-bold">
                      تسجيل دخول {roleConfig[loginRole].label}
                    </h3>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    {loginRole === 'admin' && (
                      <>
                        <div className="space-y-2">
                          <Label>اسم المستخدم</Label>
                          <Input
                            value={adminForm.username}
                            onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
                            onKeyDown={handleLoginKeyDown}
                            placeholder="أدخل اسم المستخدم"
                            className="h-11"
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كلمة المرور</Label>
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
                          <Label>رقم الهاتف</Label>
                          <Input
                            value={nurseLoginForm.phone}
                            onChange={e => setNurseLoginForm(f => ({ ...f, phone: e.target.value }))}
                            onKeyDown={handleLoginKeyDown}
                            placeholder="7XXXXXXXX"
                            dir="ltr"
                            className="h-11 text-left"
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كلمة المرور</Label>
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
                          <Label>رقم الهاتف</Label>
                          <Input
                            value={beneficiaryLoginForm.phone}
                            onChange={e => setBeneficiaryLoginForm(f => ({ ...f, phone: e.target.value }))}
                            onKeyDown={handleLoginKeyDown}
                            placeholder="7XXXXXXXX"
                            dir="ltr"
                            className="h-11 text-left"
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كلمة المرور</Label>
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
                      className={`w-full h-12 text-base font-semibold bg-gradient-to-l ${roleConfig[loginRole].gradient} text-white hover:opacity-90 shadow-lg border-0`}
                      onClick={() => {
                        if (loginRole === 'admin') handleAdminLogin()
                        else if (loginRole === 'nurse') handleNurseLogin()
                        else handleBeneficiaryLogin()
                      }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
                    </Button>

                    {loginRole !== 'admin' && (
                      <div className="text-center">
                        <button
                          onClick={() => setAuthTab('register')}
                          className="text-sm text-slate-500 hover:text-teal-600 transition-colors inline-flex items-center gap-1"
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
                  transition={{ duration: 0.3 }}
                >
                  {registerSuccess ? (
                    /* Success State */
                    <div className="text-center py-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${roleConfig[registerRole].gradient} mx-auto mb-4 shadow-xl`}
                      >
                        <CheckCircle className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 text-slate-900">تم التسجيل بنجاح!</h3>
                      <p className="text-slate-500 mb-6 leading-relaxed">
                        {registerRole === 'nurse'
                          ? 'سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.'
                          : 'يمكنك الآن تسجيل الدخول وطلب الخدمات الصحية.'}
                      </p>
                      <Button
                        className={`bg-gradient-to-l ${roleConfig[registerRole].gradient} text-white hover:opacity-90 border-0 shadow-lg`}
                        onClick={() => { setRegisterSuccess(false); setAuthTab('login') }}
                      >
                        تسجيل الدخول
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Register Role Selector (NO admin) */}
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                        {(['beneficiary', 'nurse'] as const).map((r) => {
                          const config = roleConfig[r]
                          const Icon = config.icon
                          const isActive = registerRole === r
                          return (
                            <button
                              key={r}
                              onClick={() => setRegisterRole(r)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                                isActive
                                  ? `bg-white dark:bg-gray-700 shadow-sm ${config.textAccent}`
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
                        <h3 className="text-lg font-bold">
                          إنشاء حساب {roleConfig[registerRole].label}
                        </h3>
                      </div>

                      {/* Nurse Register Form */}
                      {registerRole === 'nurse' && (
                        <div className="space-y-3 max-w-lg mx-auto">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الأول *</Label>
                              <Input value={nurseRegForm.firstName} onChange={e => setNurseRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="الاسم الأول" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الثاني *</Label>
                              <Input value={nurseRegForm.secondName} onChange={e => setNurseRegForm(f => ({ ...f, secondName: e.target.value }))} placeholder="الاسم الثاني" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الثالث *</Label>
                              <Input value={nurseRegForm.thirdName} onChange={e => setNurseRegForm(f => ({ ...f, thirdName: e.target.value }))} placeholder="الاسم الثالث" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الرابع *</Label>
                              <Input value={nurseRegForm.lastName} onChange={e => setNurseRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="اللقب" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">رقم الهاتف *</Label>
                              <Input value={nurseRegForm.phone} onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-10 text-left" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الموقع *</Label>
                              <Input value={nurseRegForm.location} onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">رقم الهوية *</Label>
                              <Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="رقم الهوية" className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">رقم الترخيص *</Label>
                              <Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">تاريخ انتهاء الترخيص *</Label>
                            <Input
                              type="date"
                              value={nurseRegForm.licenseExpiryDate}
                              onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))}
                              className="h-10"
                              onKeyDown={handleRegisterKeyDown}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">كلمة المرور *</Label>
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
                            <Label className="text-xs">تأكيد كلمة المرور *</Label>
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
                            className={`w-full h-11 font-semibold bg-gradient-to-l ${roleConfig.nurse.gradient} text-white hover:opacity-90 shadow-lg border-0`}
                            onClick={handleNurseRegister}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب ممرض'}
                          </Button>
                          <div className="text-center">
                            <button
                              onClick={() => setAuthTab('login')}
                              className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
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
                            <Label>الاسم الكامل *</Label>
                            <Input
                              value={beneficiaryRegForm.name}
                              onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="أدخل اسمك الكامل"
                              className="h-11"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input
                              value={beneficiaryRegForm.phone}
                              onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="7XXXXXXXX"
                              dir="ltr"
                              className="h-11 text-left"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>الموقع *</Label>
                            <Input
                              value={beneficiaryRegForm.location}
                              onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="المدينة / المنطقة"
                              className="h-11"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>كلمة المرور *</Label>
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
                            <Label>تأكيد كلمة المرور *</Label>
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
                            className={`w-full h-12 text-base font-semibold bg-gradient-to-l ${roleConfig.beneficiary.gradient} text-white hover:opacity-90 shadow-lg border-0`}
                            onClick={handleBeneficiaryRegister}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب'}
                          </Button>
                          <div className="text-center">
                            <button
                              onClick={() => setAuthTab('login')}
                              className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
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

              {/* ═══════════════════════════════════ */}
              {/* SERVICES TAB */}
              {/* ═══════════════════════════════════ */}
              {authTab === 'services' && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          activeCategory === cat
                            ? 'bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Services Grid */}
                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12">
                      <Stethoscope className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                      <p className="text-base text-slate-400">لا توجد خدمات متاحة حالياً</p>
                      <p className="text-sm text-slate-300 mt-1">سيتم إضافة خدمات جديدة قريباً</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {filteredServices.map((service, i) => {
                          const Icon = categoryIcons[service.category] || Stethoscope
                          const color = categoryColors[service.category] || 'from-teal-500 to-emerald-600'
                          return (
                            <motion.div
                              key={service.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                              <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-700 h-full overflow-hidden bg-white dark:bg-gray-900">
                                <CardContent className="p-4">
                                  {/* Icon & Category */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                      <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <Badge variant="secondary" className="text-xs bg-gray-50 dark:bg-gray-800 text-slate-500 dark:text-slate-400 border-0">
                                      {service.category}
                                    </Badge>
                                  </div>

                                  {/* Name & Description */}
                                  <h3 className="text-sm font-bold mb-1 text-slate-800 group-hover:text-teal-700 transition-colors">
                                    {service.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                                    {service.description}
                                  </p>

                                  {/* Price & CTA */}
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div>
                                      <span className="text-[10px] text-slate-400">السعر</span>
                                      <div className="text-base font-bold text-teal-600">
                                        {service.price.toLocaleString('ar-YE')} ر.ي
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border-0 text-xs"
                                      onClick={() => openAuth('register', 'beneficiary')}
                                    >
                                      اطلب الآن
                                      <ArrowLeft className="w-3 h-3 mr-1" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="w-full text-center py-4 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
      </footer>
    </div>
  )
}
