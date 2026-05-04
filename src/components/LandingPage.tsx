'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Shield, Stethoscope, Heart, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Clock, MapPin, Phone, Star, Menu, X,
  ChevronUp, Activity, Users, Award, Sparkles, Play,
  Syringe, Brain, Baby, Hand, Pill, Mail, MessageCircle, ArrowLeft
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
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

// ─── Animated Counter ───
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <div ref={ref}>{count.toLocaleString('ar-YE')}{suffix}</div>
}

// ─── Fade-in wrapper ───
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
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
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ─── Heartbeat Pulse SVG Animation ───
function HeartbeatPulse() {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none opacity-20">
      <svg width="600" height="80" viewBox="0 0 600 80" className="text-teal-600 max-w-full">
        <motion.path
          d="M0 40 L80 40 L100 40 L120 10 L140 70 L160 20 L180 60 L200 40 L280 40 L300 40 L320 10 L340 70 L360 20 L380 60 L400 40 L480 40 L500 40 L520 10 L540 70 L560 20 L580 60 L600 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}

// ─── Floating Medical Icons ───
function FloatingIcons() {
  const icons = [
    { Icon: Stethoscope, x: '15%', y: '20%', delay: 0, size: 32 },
    { Icon: Heart, x: '75%', y: '15%', delay: 0.5, size: 28 },
    { Icon: Shield, x: '85%', y: '55%', delay: 1, size: 26 },
    { Icon: Activity, x: '25%', y: '70%', delay: 1.5, size: 30 },
    { Icon: Heart, x: '60%', y: '75%', delay: 0.8, size: 24 },
    { Icon: Stethoscope, x: '50%', y: '30%', delay: 1.2, size: 22 },
  ]

  return (
    <>
      {icons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: item.delay,
          }}
        >
          <div className="rounded-2xl bg-teal-50/80 backdrop-blur-sm border border-teal-100 p-3 shadow-lg shadow-teal-500/5">
            <item.Icon className="text-teal-500" style={{ width: item.size, height: item.size }} />
          </div>
        </motion.div>
      ))}
    </>
  )
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export default function LandingPage() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()

  // ─── Auth modal state ───
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [loginRole, setLoginRole] = useState<Role>('beneficiary')
  const [registerRole, setRegisterRole] = useState<'beneficiary' | 'nurse'>('beneficiary')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // ─── Mobile nav ───
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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

  // ─── Scroll handler ───
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  // ─── Open auth modal ───
  const openAuth = useCallback((tab: AuthTab, role?: Role) => {
    setAuthTab(tab)
    setRegisterSuccess(false)
    if (tab === 'login' && role) setLoginRole(role)
    if (tab === 'register' && role && role !== 'admin') setRegisterRole(role as 'beneficiary' | 'nurse')
    setAuthOpen(true)
    setMobileMenuOpen(false)
  }, [])

  // ─── Scroll to section ───
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

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
        setAuthOpen(false)
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
        setAuthOpen(false)
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
        setAuthOpen(false)
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

  const navLinks = [
    { label: 'الرئيسية', id: 'hero' },
    { label: 'خدماتنا', id: 'services' },
    { label: 'كيف يعمل', id: 'how-it-works' },
    { label: 'تواصل معنا', id: 'contact' },
  ]

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ═══════════════════════════════════════ */}
      {/* ─── NAVBAR ─── */}
      {/* ═══════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-md shadow-slate-200/50 border-b border-slate-100'
            : 'bg-white/70 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="relative p-1 rounded-xl">
                <Image src="/logo.png" alt="عافيتك" width={36} height={36} className="rounded-lg" priority />
              </div>
              <span className="text-xl font-bold text-slate-900">
                عافيتك
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors duration-200 rounded-lg hover:bg-teal-50/50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/50"
                onClick={() => openAuth('login', 'beneficiary')}
              >
                تسجيل الدخول
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-105 border-0"
                onClick={() => openAuth('register', 'beneficiary')}
              >
                <Sparkles className="w-4 h-4 ml-1.5" />
                ابدأ الآن
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen
                ? <X className="w-6 h-6 text-slate-900" />
                : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="block w-full text-right px-4 py-3 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-teal-600 font-medium transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-center h-11 rounded-xl border-slate-200"
                    onClick={() => openAuth('login', 'beneficiary')}
                  >
                    تسجيل الدخول
                  </Button>
                  <Button
                    className="w-full justify-center h-11 rounded-xl bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 border-0"
                    onClick={() => openAuth('register', 'beneficiary')}
                  >
                    <Sparkles className="w-4 h-4 ml-1.5" />
                    ابدأ الآن
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════════════════════════════════ */}
      {/* ─── HERO SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-bl from-teal-50 via-white to-emerald-50/30 min-h-screen flex items-center"
      >
        {/* Subtle background decorations */}
        <div className="absolute inset-0">
          {/* Soft radial gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_30%,rgba(13,148,136,0.06),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_70%,rgba(16,185,129,0.05),transparent)]" />

          {/* Dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(13,148,136,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Floating medical icons */}
        <div className="absolute inset-0 hidden lg:block">
          <FloatingIcons />
        </div>

        {/* Heartbeat pulse line */}
        <HeartbeatPulse />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-right">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-5 py-2.5 mb-8"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Stethoscope className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-teal-700">رعاية صحية منزلية موثوقة</span>
                </motion.div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-l from-teal-600 via-emerald-500 to-teal-700 bg-clip-text text-transparent">
                    عافيتك
                  </span>
                </h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-800 mb-4"
                >
                  رعاية صحية في منزلك
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-base sm:text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  منصة متكاملة لربط المستفيدين بممرضين مؤهلين لتقديم خدمات صحية منزلية بأعلى معايير الجودة والسلامة
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-xl shadow-teal-500/20 group rounded-xl border-0"
                    onClick={() => openAuth('register', 'beneficiary')}
                  >
                    <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    سجّل الآن
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 text-lg px-8 h-14 rounded-xl"
                    onClick={() => scrollTo('services')}
                  >
                    <Play className="w-5 h-5 ml-2" />
                    اكتشف خدماتنا
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Decorative Illustration Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="flex-shrink-0 hidden lg:block"
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-3xl blur-3xl scale-150" />

                {/* Rotating border */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 rounded-3xl border border-teal-200/30"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-8 rounded-3xl border border-dashed border-teal-200/20"
                />

                {/* Main illustration card */}
                <div className="relative p-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-teal-100 shadow-2xl shadow-teal-500/5">
                  <Image
                    src="/logo.png"
                    alt="عافيتك - رعاية صحية منزلية"
                    width={280}
                    height={280}
                    className="rounded-2xl"
                    priority
                  />
                </div>

                {/* Floating mini cards */}
                <motion.div
                  className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg shadow-teal-500/10 border border-teal-50 p-3 flex items-center gap-2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">معتمدون</span>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg shadow-teal-500/10 border border-teal-50 p-3 flex items-center gap-2"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">4.9 تقييم</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="bg-white/80 backdrop-blur-lg border-t border-teal-100/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex items-center justify-center gap-8 sm:gap-16">
                {[
                  { value: '٥٠٠+', label: 'ممرض معتمد', icon: Stethoscope, color: 'text-teal-500' },
                  { value: '١٠٠٠+', label: 'مستفيد', icon: Users, color: 'text-emerald-500' },
                  { value: '٤.٩', label: 'تقييم', icon: Star, color: 'text-amber-500' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-slate-900">{stat.value}</div>
                      <div className="text-xs text-slate-400">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── SERVICES SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section id="services" className="py-20 md:py-28 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-teal-50 text-teal-700 border-teal-100 rounded-full">
                <Stethoscope className="w-3.5 h-3.5 ml-1.5" />
                خدماتنا
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                خدمات <span className="bg-gradient-to-l from-teal-600 to-emerald-500 bg-clip-text text-transparent">صحية متكاملة</span>
              </h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                نقدم مجموعة واسعة من الخدمات الصحية المنزلية على يد ممرضين مؤهلين ومعتمدين
              </p>
            </div>
          </FadeIn>

          {/* Category Filter */}
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 scale-105'
                      : 'bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-600 border border-slate-200 hover:border-teal-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Services Grid */}
          {servicesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                <div className="absolute inset-0 blur-xl bg-teal-500/20 rounded-full" />
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-lg text-slate-400">لا توجد خدمات متاحة حالياً</p>
              <p className="text-sm text-slate-300 mt-2">سيتم إضافة خدمات جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Card className="group hover:shadow-xl hover:shadow-teal-500/[0.06] transition-all duration-500 border border-slate-200/80 hover:border-teal-200 h-full overflow-hidden hover:-translate-y-1 bg-white border-t-2 border-t-teal-400">
                        <CardContent className="p-6">
                          {/* Icon & Category */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-500 border-0">
                              {service.category}
                            </Badge>
                          </div>

                          {/* Name & Description */}
                          <h3 className="text-lg font-bold mb-2 text-slate-800 group-hover:text-teal-700 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                            {service.description}
                          </p>

                          {/* Price & CTA */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-400">السعر</span>
                              <div className="text-xl font-bold text-teal-600">
                                {service.price.toLocaleString('ar-YE')} ر.ي
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg border-0"
                              onClick={() => openAuth('register', 'beneficiary')}
                            >
                              اطلب الآن
                              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
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
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── HOW IT WORKS ─── */}
      {/* ═══════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full">
                <Play className="w-3.5 h-3.5 ml-1.5" />
                كيف يعمل
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                ثلاث خطوات <span className="bg-gradient-to-l from-teal-600 to-emerald-500 bg-clip-text text-transparent">بسيطة</span>
              </h2>
              <p className="text-slate-500 text-lg">احصل على الرعاية الصحية المنزلية بسهولة وسرعة</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Dotted Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%]">
              <div className="w-full border-t-2 border-dashed border-teal-200" />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-500 rounded-full shadow-lg shadow-teal-500/30"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              />
            </div>

            {[
              {
                step: '١',
                title: 'سجّل حسابك',
                desc: 'أنشئ حسابك كمستفيد أو ممرض بخطوات بسيطة وسريعة',
                icon: UserPlus,
              },
              {
                step: '٢',
                title: 'اختر الخدمة',
                desc: 'اختر الخدمة الصحية المناسبة وحدد العنوان وطريقة الدفع',
                icon: MapPin,
              },
              {
                step: '٣',
                title: 'استقبل الرعاية',
                desc: 'يصلك ممرض مؤهل لتنفيذ الخدمة في منزلك بأعلى جودة',
                icon: Heart,
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={0.2 + i * 0.15}>
                <div className="text-center relative">
                  {/* Step number circle with gradient */}
                  <div className="relative inline-block mb-6">
                    <div className="w-[88px] h-[88px] rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/20 group hover:shadow-2xl hover:shadow-teal-500/30 transition-shadow duration-300">
                      <span className="text-white text-3xl font-bold">{item.step}</span>
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shadow-sm">
                      <item.icon className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── WHY CHOOSE US ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-teal-50 text-teal-700 border-teal-100 rounded-full">
                <Shield className="w-3.5 h-3.5 ml-1.5" />
                لماذا عافيتك
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                ثقة <span className="bg-gradient-to-l from-teal-600 to-emerald-500 bg-clip-text text-transparent">الجميع</span>
              </h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">نلتزم بأعلى معايير الجودة والسلامة لتقديم أفضل تجربة رعاية صحية منزلية</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'ممرضون معتمدون',
                desc: 'جميع ممرضينا يحملون تراخيص مزاولة معتمدة وخبرات عملية موثقة',
                bg: 'bg-teal-50',
                iconColor: 'text-teal-600',
                border: 'border-teal-100',
              },
              {
                icon: Clock,
                title: 'دعم ٢٤/٧',
                desc: 'فريق الدعم متاح على مدار الساعة للإجابة عن استفساراتكم',
                bg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                border: 'border-emerald-100',
              },
              {
                icon: Activity,
                title: 'حجز سهل',
                desc: 'احجز خدمتك بنقرات بسيطة واختر الوقت المناسب لك',
                bg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                border: 'border-amber-100',
              },
              {
                icon: Award,
                title: 'دفع آمن',
                desc: 'طرق دفع متعددة وآمنة بدون رسوم خفية أو تكاليف إضافية',
                bg: 'bg-sky-50',
                iconColor: 'text-sky-600',
                border: 'border-sky-100',
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={0.05 + i * 0.1}>
                <Card className={`group hover:shadow-xl transition-all duration-500 border ${item.border} h-full hover:-translate-y-1 ${item.bg}/30 bg-white`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-800 group-hover:text-teal-700 transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── STATS SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-amber-50 text-amber-700 border-amber-100 rounded-full">
                <Award className="w-3.5 h-3.5 ml-1.5" />
                إنجازاتنا
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">أرقام نفتخر بها</h2>
              <p className="text-slate-500 text-lg">ثقة المستفيدين هي الدليل على جودة خدماتنا</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { target: 500, suffix: '+', label: 'ممرض معتمد', icon: Stethoscope, bg: 'bg-teal-50', iconColor: 'text-teal-500' },
              { target: 1000, suffix: '+', label: 'مستفيد نشط', icon: Users, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
              { target: 5000, suffix: '+', label: 'خدمة منفذة', icon: Activity, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
              { target: 98, suffix: '%', label: 'نسبة الرضا', icon: Award, bg: 'bg-sky-50', iconColor: 'text-sky-500' },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={0.1 + i * 0.1}>
                <div className={`text-center p-6 md:p-8 rounded-2xl ${stat.bg} border border-white hover:shadow-lg transition-all duration-300`}>
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.iconColor}`} />
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-slate-900">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── TESTIMONIALS SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-amber-50 text-amber-700 border-amber-100 rounded-full">
                <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                آراء المستفيدين
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                ماذا يقولون <span className="bg-gradient-to-l from-teal-600 to-emerald-500 bg-clip-text text-transparent">عنا</span>
              </h2>
              <p className="text-slate-500 text-lg">تجارب حقيقية من مستفيدين يثقون بخدماتنا</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'أحمد محمد',
                role: 'مستفيد',
                text: 'خدمة ممتازة وسريعة! وصل الممرض خلال ساعة واحدة وكان محترفاً جداً في التعامل مع والدي المسن. أنصح الجميع بالتجربة.',
                rating: 5,
                gradient: 'from-teal-500 to-emerald-600',
              },
              {
                name: 'فاطمة علي',
                role: 'مستفيدة',
                text: 'تجربة رائعة من البداية للنهاية. التطبيق سهل الاستخدام والخدمة عالية الجودة. سأستخدمها مرة أخرى بالتأكيد.',
                rating: 5,
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                name: 'خالد عبدالله',
                role: 'ممرض',
                text: 'كنت أبحث عن منصة موثوقة للعمل كممرض مستقل. عافيتك وفرت لي فرص عمل ممتازة وتسهيلات كبيرة في إدارة المواعيد.',
                rating: 5,
                gradient: 'from-amber-400 to-orange-500',
              },
            ].map((item, i) => (
              <FadeIn key={item.name} delay={0.1 + i * 0.1}>
                <Card className="group hover:shadow-xl hover:shadow-teal-500/[0.04] transition-all duration-500 border-slate-200 hover:border-teal-200/50 h-full relative overflow-hidden hover:-translate-y-1 bg-white">
                  {/* Top accent bar */}
                  <div className={`h-1 bg-gradient-to-l ${item.gradient}`} />
                  <CardContent className="p-6 pt-5">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: item.rating }).map((_, si) => (
                        <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-6 text-sm">{item.text}</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── CTA SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-600 via-emerald-600 to-teal-700" />
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeIn>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md mb-8 border border-white/10">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
                مستعد للبدء؟
              </h2>
              <p className="text-white/70 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                سواء كنت مستفيداً يبحث عن رعاية أو ممرضاً يبحث عن فرص عمل، عافيتك هي المنصة المثالية لك
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-teal-700 hover:bg-white/90 text-base px-8 h-14 shadow-xl group rounded-xl font-semibold"
                  onClick={() => openAuth('register', 'beneficiary')}
                >
                  <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  تسجيل مستفيد
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-14 rounded-xl backdrop-blur-sm"
                  onClick={() => openAuth('register', 'nurse')}
                >
                  <Stethoscope className="w-5 h-5 ml-2" />
                  تسجيل ممرض
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── CONTACT SECTION ─── */}
      {/* ═══════════════════════════════════════ */}
      <section id="contact" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Text */}
                <div>
                  <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-teal-50 text-teal-700 border-teal-100 rounded-full">
                    <Mail className="w-3.5 h-3.5 ml-1.5" />
                    تواصل معنا
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">
                    نسعد بتواصلكم
                  </h2>
                  <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                    فريقنا جاهز للإجابة عن جميع استفساراتكم ومساعدتكم في أي وقت
                  </p>

                  <div className="space-y-5">
                    {[
                      {
                        icon: Phone,
                        label: 'الهاتف',
                        value: '+967 777 123 456',
                        desc: 'متاح 24/7',
                        bg: 'bg-teal-50',
                        iconColor: 'text-teal-600',
                      },
                      {
                        icon: Mail,
                        label: 'البريد الإلكتروني',
                        value: 'info@afiyatak.com',
                        desc: 'رد خلال 24 ساعة',
                        bg: 'bg-emerald-50',
                        iconColor: 'text-emerald-600',
                      },
                      {
                        icon: MapPin,
                        label: 'العنوان',
                        value: 'صنعاء، اليمن',
                        desc: 'المكتب الرئيسي',
                        bg: 'bg-amber-50',
                        iconColor: 'text-amber-600',
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-4 group">
                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div>
                          <div className="text-sm text-slate-400 mb-0.5">{item.label}</div>
                          <div className="font-semibold text-slate-800">{item.value}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Illustration */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-3xl blur-2xl scale-110" />
                    <div className="relative bg-white rounded-3xl border border-teal-100 p-8 shadow-xl shadow-teal-500/5">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
                          <MessageCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">هل تحتاج مساعدة؟</h3>
                        <p className="text-slate-500 text-sm mb-6">لا تتردد في التواصل معنا</p>
                        <Button
                          className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 rounded-xl border-0 shadow-lg shadow-teal-500/20"
                          onClick={() => openAuth('register', 'beneficiary')}
                        >
                          ابدأ الآن
                          <ArrowLeft className="w-4 h-4 mr-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* ─── FOOTER ─── */}
      {/* ═══════════════════════════════════════ */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="عافيتك" width={36} height={36} className="rounded-lg" />
                <span className="text-xl font-bold">عافيتك</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-sm mb-6">
                منصة متكاملة لربط المستفيدين بممرضين مؤهلين لتقديم خدمات صحية منزلية بأعلى معايير الجودة والسلامة
              </p>
              <div className="flex items-center gap-3 text-slate-500">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+967 777 123 456</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-white/80 text-sm">روابط سريعة</h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => scrollTo(link.id)}
                      className="text-sm text-slate-500 hover:text-teal-400 transition-colors duration-200"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-bold mb-4 text-white/80 text-sm">حسابك</h4>
              <ul className="space-y-3">
                {[
                  { label: 'تسجيل دخول مستفيد', action: () => openAuth('login', 'beneficiary') },
                  { label: 'تسجيل مستفيد جديد', action: () => openAuth('register', 'beneficiary') },
                  { label: 'تسجيل دخول ممرض', action: () => openAuth('login', 'nurse') },
                  { label: 'تسجيل ممرض جديد', action: () => openAuth('register', 'nurse') },
                  { label: 'دخول الإدارة', action: () => openAuth('login', 'admin') },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-slate-500 hover:text-teal-400 transition-colors duration-200"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4 text-white/80 text-sm">تواصل معنا</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  +967 777 123 456
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  info@afiyatak.com
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  صنعاء، اليمن
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
            </p>
            <p className="text-sm text-slate-700">
              رعاية صحية منزلية بأعلى المعايير
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════ */}
      {/* ─── BACK TO TOP ─── */}
      {/* ═══════════════════════════════════════ */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/20 flex items-center justify-center hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-110"
            aria-label="العودة للأعلى"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── AUTH MODAL / DIALOG (3 TABS) ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      <Dialog open={authOpen} onOpenChange={(open) => { setAuthOpen(open); if (!open) setRegisterSuccess(false) }}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">تسجيل الدخول أو إنشاء حساب</DialogTitle>
          <DialogDescription className="sr-only">اختر نوع الحساب وسجّل الدخول أو أنشئ حساباً جديداً</DialogDescription>

          {/* Header with close */}
          <div className="relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-6 pb-8">
            {/* Close button */}
            <button
              onClick={() => { setAuthOpen(false); setRegisterSuccess(false) }}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <Image src="/logo.png" alt="عافيتك" width={56} height={56} className="rounded-xl mx-auto mb-3 shadow-lg" />
              <h2 className="text-2xl font-bold text-white">عافيتك</h2>
              <p className="text-white/60 text-sm mt-1">رعاية صحية في منزلك</p>
            </div>
          </div>

          {/* Three Tabs */}
          <div className="flex bg-slate-50/80 border-b border-slate-100 relative">
            {([
              { key: 'login' as AuthTab, label: 'تسجيل الدخول' },
              { key: 'register' as AuthTab, label: 'إنشاء حساب' },
              { key: 'services' as AuthTab, label: 'خدماتنا' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setAuthTab(tab.key); setRegisterSuccess(false) }}
                className={`flex-1 py-3.5 text-sm font-medium transition-all duration-300 relative ${
                  authTab === tab.key
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
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

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-6">
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
                  <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
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
                              ? `bg-white shadow-sm ${config.textAccent}`
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

                  <div className="space-y-4">
                    {loginRole === 'admin' && (
                      <>
                        <div className="space-y-2">
                          <Label>اسم المستخدم</Label>
                          <Input
                            value={adminForm.username}
                            onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
                            onKeyDown={handleLoginKeyDown}
                            placeholder="أدخل اسم المستخدم"
                            className="h-11 rounded-xl"
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
                            className="h-11 rounded-xl"
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
                            className="h-11 text-left rounded-xl"
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
                            className="h-11 rounded-xl"
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
                            className="h-11 text-left rounded-xl"
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
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </>
                    )}

                    <Button
                      className={`w-full h-12 text-base font-semibold bg-gradient-to-l ${roleConfig[loginRole].gradient} text-white hover:opacity-90 shadow-lg rounded-xl border-0`}
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
                        className={`bg-gradient-to-l ${roleConfig[registerRole].gradient} text-white hover:opacity-90 rounded-xl border-0 shadow-lg`}
                        onClick={() => { setRegisterSuccess(false); setAuthTab('login') }}
                      >
                        تسجيل الدخول
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Register Role Selector (NO admin) */}
                      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
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
                                  ? `bg-white shadow-sm ${config.textAccent}`
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
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الأول *</Label>
                              <Input value={nurseRegForm.firstName} onChange={e => setNurseRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="الاسم الأول" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الثاني *</Label>
                              <Input value={nurseRegForm.secondName} onChange={e => setNurseRegForm(f => ({ ...f, secondName: e.target.value }))} placeholder="الاسم الثاني" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الثالث *</Label>
                              <Input value={nurseRegForm.thirdName} onChange={e => setNurseRegForm(f => ({ ...f, thirdName: e.target.value }))} placeholder="الاسم الثالث" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الاسم الرابع *</Label>
                              <Input value={nurseRegForm.lastName} onChange={e => setNurseRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="اللقب" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">رقم الهاتف *</Label>
                              <Input value={nurseRegForm.phone} onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-10 text-left rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الموقع *</Label>
                              <Input value={nurseRegForm.location} onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">الرقم الوطني *</Label>
                              <Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="الرقم الوطني" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">رقم المزاولة *</Label>
                              <Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">تاريخ انتهاء المزاولة *</Label>
                              <Input type="date" value={nurseRegForm.licenseExpiryDate} onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} dir="ltr" className="h-10 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">كلمة المرور *</Label>
                              <PasswordInput
                                value={nurseRegForm.password}
                                onChange={v => setNurseRegForm(f => ({ ...f, password: v }))}
                                onKeyDown={handleRegisterKeyDown}
                                placeholder="6 أحرف+"
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                className="h-10 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">تأكيد كلمة المرور *</Label>
                            <PasswordInput
                              value={nurseRegForm.confirmPassword}
                              onChange={v => setNurseRegForm(f => ({ ...f, confirmPassword: v }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="أعد كتابة كلمة المرور"
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              className="h-10 rounded-lg"
                            />
                          </div>
                          <Button
                            className={`w-full h-11 font-semibold bg-gradient-to-l ${roleConfig.nurse.gradient} text-white hover:opacity-90 shadow-lg rounded-xl border-0`}
                            onClick={handleNurseRegister}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                          </Button>
                          <div className="text-center">
                            <button onClick={() => setAuthTab('login')} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
                              لديك حساب؟ تسجيل الدخول
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Beneficiary Register Form */}
                      {registerRole === 'beneficiary' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>الاسم الكامل *</Label>
                            <Input value={beneficiaryRegForm.name} onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))} onKeyDown={handleRegisterKeyDown} placeholder="الاسم الكامل" className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الهاتف *</Label>
                            <Input value={beneficiaryRegForm.phone} onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))} onKeyDown={handleRegisterKeyDown} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>الموقع *</Label>
                            <Input value={beneficiaryRegForm.location} onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))} onKeyDown={handleRegisterKeyDown} placeholder="المدينة / المنطقة" className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>كلمة المرور *</Label>
                            <PasswordInput
                              value={beneficiaryRegForm.password}
                              onChange={v => setBeneficiaryRegForm(f => ({ ...f, password: v }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="6 أحرف على الأقل"
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>تأكيد كلمة المرور *</Label>
                            <PasswordInput
                              value={beneficiaryRegForm.confirmPassword}
                              onChange={v => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: v }))}
                              onKeyDown={handleRegisterKeyDown}
                              placeholder="أعد كتابة كلمة المرور"
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <Button
                            className={`w-full h-12 font-semibold bg-gradient-to-l ${roleConfig.beneficiary.gradient} text-white hover:opacity-90 shadow-lg rounded-xl border-0`}
                            onClick={handleBeneficiaryRegister}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                          </Button>
                          <div className="text-center">
                            <button onClick={() => setAuthTab('login')} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
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
              {/* SERVICES TAB (in modal) */}
              {/* ═══════════════════════════════════ */}
              {authTab === 'services' && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold">خدماتنا</h3>
                    <p className="text-sm text-slate-500">اكتشف خدماتنا الصحية المنزلية</p>
                  </div>

                  {/* Category Filter in Modal */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setModalActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                          modalActiveCategory === cat
                            ? 'bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                  ) : modalFilteredServices.length === 0 ? (
                    <div className="text-center py-10">
                      <Stethoscope className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-sm text-slate-500">لا توجد خدمات متاحة حالياً</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pl-1" style={{ scrollbarWidth: 'thin' }}>
                      {modalFilteredServices.map((service) => {
                        const Icon = categoryIcons[service.category] || Stethoscope
                        const color = categoryColors[service.category] || 'from-teal-500 to-emerald-600'
                        return (
                          <div
                            key={service.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-teal-200/50 hover:shadow-md transition-all duration-300"
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{service.name}</div>
                              <div className="text-xs text-slate-500 truncate">{service.description}</div>
                            </div>
                            <div className="flex-shrink-0 text-left">
                              <div className="text-sm font-bold text-teal-600">
                                {service.price.toLocaleString('ar-YE')} ر.ي
                              </div>
                              <div className="text-[10px] text-slate-400">{service.category}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-5 text-center">
                    <Button
                      className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white hover:opacity-90 rounded-xl border-0 shadow-lg"
                      onClick={() => { setAuthOpen(false); scrollTo('services') }}
                    >
                      عرض جميع الخدمات
                      <ArrowLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
