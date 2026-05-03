'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Shield, Stethoscope, Heart, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Clock, MapPin, Phone, Star, Menu, X,
  ChevronUp, Activity, Users, Award, Sparkles, Play,
  Syringe, Brain, Baby, Hand, Pill
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

type Role = 'beneficiary' | 'nurse' | 'admin'
type Mode = 'login' | 'register'

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
  'تمريض': 'from-violet-500 to-purple-600',
  'علاج طبيعي': 'from-emerald-500 to-teal-600',
  'رعاية مسنين': 'from-rose-500 to-pink-600',
  'أطفال': 'from-sky-500 to-cyan-600',
  'حقن': 'from-amber-500 to-orange-600',
  'فحوصات': 'from-indigo-500 to-blue-600',
  'علاج نفسي': 'from-fuchsia-500 to-purple-600',
  'رعاية منزلية': 'from-lime-500 to-green-600',
  'أدوية': 'from-red-500 to-rose-600',
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

export default function LandingPage() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()

  // ─── Auth modal state ───
  const [authOpen, setAuthOpen] = useState(false)
  const [role, setRole] = useState<Role>('beneficiary')
  const [mode, setMode] = useState<Mode>('login')
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
  const groupedServices = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'أخرى'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  // ─── Open auth modal ───
  const openAuth = useCallback((r: Role, m: Mode = 'login') => {
    setRole(r)
    setMode(m)
    setRegisterSuccess(false)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') {
        if (role === 'admin') handleAdminLogin()
        else if (role === 'nurse') handleNurseLogin()
        else handleBeneficiaryLogin()
      } else {
        if (role === 'nurse') handleNurseRegister()
        else handleBeneficiaryRegister()
      }
    }
  }

  // ─── Role config ───
  const roleConfig = {
    beneficiary: {
      icon: Heart, label: 'مستفيد',
      gradient: 'from-rose-500 to-pink-600',
      btnGradient: 'from-rose-500 to-pink-600',
      textAccent: 'text-rose-600',
      bgLight: 'bg-rose-50',
    },
    nurse: {
      icon: Stethoscope, label: 'ممرض',
      gradient: 'from-violet-500 to-purple-600',
      btnGradient: 'from-violet-500 to-purple-600',
      textAccent: 'text-violet-600',
      bgLight: 'bg-violet-50',
    },
    admin: {
      icon: Shield, label: 'مدير/إدارة',
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
    <div className="min-h-screen bg-white" dir="rtl">
      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-white/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" priority />
              <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                عافيتك
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'الرئيسية', action: () => scrollTo('hero') },
                { label: 'خدماتنا', action: () => scrollTo('services') },
                { label: 'كيف يعمل', action: () => scrollTo('how-it-works') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`text-sm font-medium transition-colors hover:text-rose-500 ${
                    scrolled ? 'text-slate-600' : 'text-white/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className={`text-sm ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/90 hover:text-white'}`}
                onClick={() => openAuth('beneficiary', 'login')}
              >
                تسجيل الدخول
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                onClick={() => openAuth('beneficiary', 'register')}
              >
                ابدأ الآن
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen
                ? <X className={`w-6 h-6 ${scrolled ? 'text-slate-900' : 'text-white'}`} />
                : <Menu className={`w-6 h-6 ${scrolled ? 'text-slate-900' : 'text-white'}`} />}
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
              className="md:hidden bg-white border-t border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {[
                  { label: 'الرئيسية', action: () => scrollTo('hero') },
                  { label: 'خدماتنا', action: () => scrollTo('services') },
                  { label: 'كيف يعمل', action: () => scrollTo('how-it-works') },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="block w-full text-right px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => openAuth('beneficiary', 'login')}
                  >
                    تسجيل الدخول
                  </Button>
                  <Button
                    className="w-full justify-center bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90"
                    onClick={() => openAuth('beneficiary', 'register')}
                  >
                    ابدأ الآن
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white min-h-screen flex items-center"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 16}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-right">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2.5 mb-8 border border-white/10">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium">رعاية صحية منزلية موثوقة</span>
                </div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-l from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    عافيتك
                  </span>
                </h1>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/90 mb-4">
                  رعاية صحية في منزلك
                </p>
                <p className="text-base sm:text-lg text-white/60 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  منصة متكاملة لربط المستفيدين بممرضين مؤهلين لتقديم خدمات صحية منزلية بأعلى معايير الجودة والسلامة
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-2xl shadow-purple-500/30 group"
                    onClick={() => openAuth('beneficiary', 'register')}
                  >
                    <Heart className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    ابدأ الآن
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 backdrop-blur-sm"
                    onClick={() => scrollTo('services')}
                  >
                    <Play className="w-5 h-5 ml-2" />
                    اكتشف خدماتنا
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                  {[
                    { value: '٥٠٠+', label: 'ممرض معتمد' },
                    { value: '١٠٠٠+', label: 'مستفيد' },
                    { value: '٤.٩', label: 'تقييم المستخدمين' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-purple-500/30 rounded-3xl blur-3xl scale-125" />
                <div className="relative p-2 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <Image
                    src="/logo.png"
                    alt="عافيتك"
                    width={280}
                    height={280}
                    className="rounded-2xl"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ─── SERVICES SECTION ─── */}
      <section id="services" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-purple-50 text-purple-700 border-purple-100">
                خدماتنا
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                خدمات <span className="bg-gradient-to-l from-rose-500 to-purple-600 bg-clip-text text-transparent">صحية متكاملة</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-gradient-to-l from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg text-muted-foreground">لا توجد خدمات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, i) => {
                  const Icon = categoryIcons[service.category] || Stethoscope
                  const color = categoryColors[service.category] || 'from-slate-500 to-slate-600'
                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <Card className="group hover:shadow-xl transition-all duration-500 border border-slate-100 hover:border-purple-200/50 h-full overflow-hidden">
                        <CardContent className="p-6">
                          {/* Icon & Category */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-500">
                              {service.category}
                            </Badge>
                          </div>

                          {/* Name & Description */}
                          <h3 className="text-lg font-bold mb-2 group-hover:text-purple-700 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                            {service.description}
                          </p>

                          {/* Price */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div>
                              <span className="text-xs text-muted-foreground">السعر</span>
                              <div className="text-xl font-bold bg-gradient-to-l from-rose-500 to-purple-600 bg-clip-text text-transparent">
                                {service.price.toLocaleString('ar-YE')} ر.ي
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90 shadow-md"
                              onClick={() => openAuth('beneficiary', 'register')}
                            >
                              اطلب الآن
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

          {/* Services Grouped by Category (Additional View) */}
          {!servicesLoading && Object.keys(groupedServices).length > 0 && activeCategory === 'الكل' && (
            <div className="mt-16 space-y-12">
              {Object.entries(groupedServices).map(([category, catServices], catIdx) => {
                const Icon = categoryIcons[category] || Stethoscope
                const color = categoryColors[category] || 'from-slate-500 to-slate-600'
                return (
                  <FadeIn key={category} delay={catIdx * 0.1}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{category}</h3>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                        {catServices.length} خدمة
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {catServices.map((service) => (
                        <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-slate-100">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm mb-1 group-hover:text-purple-700 transition-colors">
                              {service.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                            <div className="text-sm font-bold text-purple-600">
                              {service.price.toLocaleString('ar-YE')} ر.ي
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-purple-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-rose-50 text-rose-700 border-rose-100">
                كيف يعمل
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                ثلاث خطوات <span className="bg-gradient-to-l from-rose-500 to-purple-600 bg-clip-text text-transparent">بسيطة</span>
              </h2>
              <p className="text-muted-foreground text-lg">احصل على الرعاية الصحية المنزلية بسهولة وسرعة</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-l from-rose-200 via-purple-200 to-violet-200" />

            {[
              {
                step: '١',
                title: 'سجّل حسابك',
                desc: 'أنشئ حسابك كمستفيد أو ممرض بخطوات بسيطة وسريعة',
                icon: UserPlus,
                color: 'from-rose-500 to-pink-600',
                bgColor: 'bg-rose-50',
              },
              {
                step: '٢',
                title: 'اطلب الخدمة',
                desc: 'اختر الخدمة الصحية المناسبة وحدد العنوان وطريقة الدفع',
                icon: MapPin,
                color: 'from-violet-500 to-purple-600',
                bgColor: 'bg-violet-50',
              },
              {
                step: '٣',
                title: 'استقبل الرعاية',
                desc: 'يصلك ممرض مؤهل لتنفيذ الخدمة في منزلك بأعلى جودة',
                icon: Heart,
                color: 'from-purple-500 to-indigo-600',
                bgColor: 'bg-purple-50',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={0.2 + i * 0.15}>
                <div className="text-center relative">
                  {/* Step Number */}
                  <div className="relative inline-block mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300`}>
                      <span className="text-white text-3xl font-bold">{item.step}</span>
                    </div>
                    <div className={`absolute -bottom-2 -left-2 w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <item.icon className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(244,63,94,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">أرقام نفتخر بها</h2>
              <p className="text-white/60 text-lg">ثقة المستفيدين هي الدليل على جودة خدماتنا</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { target: 500, suffix: '+', label: 'ممرض معتمد', icon: Stethoscope },
              { target: 1000, suffix: '+', label: 'مستفيد نشط', icon: Users },
              { target: 5000, suffix: '+', label: 'خدمة منفذة', icon: Activity },
              { target: 98, suffix: '%', label: 'نسبة الرضا', icon: Award },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={0.1 + i * 0.1}>
                <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-purple-300" />
                  <div className="text-3xl md:text-4xl font-bold mb-2">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST / TESTIMONIALS ─── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm bg-emerald-50 text-emerald-700 border-emerald-100">
                لماذا عافيتك
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                ثقة <span className="bg-gradient-to-l from-rose-500 to-purple-600 bg-clip-text text-transparent">الجميع</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">نلتزم بأعلى معايير الجودة والسلامة لتقديم أفضل تجربة رعاية صحية منزلية</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'ممرضون معتمدون',
                desc: 'جميع ممرضينا يحملون تراخيص مزاولة معتمدة وخبرات عملية موثقة',
                color: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Clock,
                title: 'استجابة سريعة',
                desc: 'نضمن وصول الممرض إليك في أسرع وقت ممكن بعد تأكيد الطلب',
                color: 'from-amber-500 to-orange-600',
                bg: 'bg-amber-50',
              },
              {
                icon: Star,
                title: 'جودة مضمونة',
                desc: 'إشراف إداري دقيق ومتابعة مستمرة لضمان رضاكم عن الخدمة',
                color: 'from-violet-500 to-purple-600',
                bg: 'bg-violet-50',
              },
              {
                icon: Heart,
                title: 'رعاية إنسانية',
                desc: 'نؤمن بأن الرعاية الصحية تبدأ بالتعاطف والاهتمام بكل تفاصيل تجربتكم',
                color: 'from-rose-500 to-pink-600',
                bg: 'bg-rose-50',
              },
              {
                icon: Phone,
                title: 'دعم متواصل',
                desc: 'فريق الدعم الفني متاح على مدار الساعة للإجابة عن استفساراتكم',
                color: 'from-sky-500 to-cyan-600',
                bg: 'bg-sky-50',
              },
              {
                icon: Award,
                title: 'أسعار تنافسية',
                desc: 'نقدم خدمات صحية عالية الجودة بأسعار مناسبة وشفافة بدون رسوم خفية',
                color: 'from-fuchsia-500 to-purple-600',
                bg: 'bg-fuchsia-50',
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={0.05 + i * 0.08}>
                <Card className="group hover:shadow-xl transition-all duration-500 border-slate-100 hover:border-purple-200/50 h-full">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.bg} mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6" style={{ color: item.color.includes('emerald') ? '#10b981' : item.color.includes('amber') ? '#f59e0b' : item.color.includes('violet') ? '#8b5cf6' : item.color.includes('rose') ? '#f43f5e' : item.color.includes('sky') ? '#0ea5e9' : '#d946ef' }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-purple-700 transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.1),transparent_60%)]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <FadeIn>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md mb-8 border border-white/10">
              <Heart className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">ابدأ رحلتك الصحية اليوم</h2>
            <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
              سواء كنت مستفيداً يبحث عن رعاية أو ممرضاً يبحث عن فرص عمل، عافيتك هي المنصة المثالية لك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-l from-rose-500 to-pink-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-2xl shadow-rose-500/30"
                onClick={() => openAuth('beneficiary', 'register')}
              >
                <Heart className="w-5 h-5 ml-2" />
                تسجيل مستفيد
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-l from-violet-500 to-purple-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-2xl shadow-violet-500/30"
                onClick={() => openAuth('nurse', 'register')}
              >
                <Stethoscope className="w-5 h-5 ml-2" />
                تسجيل ممرض
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 backdrop-blur-sm"
                onClick={() => openAuth('admin', 'login')}
              >
                <Shield className="w-5 h-5 ml-2" />
                دخول الإدارة
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
                <span className="text-xl font-bold">عافيتك</span>
              </div>
              <p className="text-white/50 leading-relaxed max-w-md mb-6">
                منصة متكاملة لربط المستفيدين بممرضين مؤهلين لتقديم خدمات صحية منزلية بأعلى معايير الجودة والسلامة
              </p>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/50">للتواصل والدعم الفني</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-white/80">روابط سريعة</h4>
              <ul className="space-y-3">
                {['الرئيسية', 'خدماتنا', 'كيف يعمل'].map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => scrollTo(link === 'الرئيسية' ? 'hero' : link === 'خدماتنا' ? 'services' : 'how-it-works')}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-bold mb-4 text-white/80">حسابك</h4>
              <ul className="space-y-3">
                {[
                  { label: 'تسجيل دخول مستفيد', action: () => openAuth('beneficiary', 'login') },
                  { label: 'تسجيل مستفيد جديد', action: () => openAuth('beneficiary', 'register') },
                  { label: 'تسجيل دخول ممرض', action: () => openAuth('nurse', 'login') },
                  { label: 'تسجيل ممرض جديد', action: () => openAuth('nurse', 'register') },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              &copy; {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
            </p>
            <p className="text-sm text-white/20">
              رعاية صحية منزلية بأعلى المعايير
            </p>
          </div>
        </div>
      </footer>

      {/* ─── BACK TO TOP ─── */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-xl shadow-purple-500/20 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════ */}
      {/* ─── AUTH MODAL / DIALOG ─── */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">تسجيل الدخول أو إنشاء حساب</DialogTitle>
          <DialogDescription className="sr-only">اختر نوع الحساب وسجّل الدخول أو أنشئ حساباً جديداً</DialogDescription>

          {/* Header with close */}
          <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 pb-8">
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
              <p className="text-white/50 text-sm mt-1">رعاية صحية في منزلك</p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-slate-50 border-b border-slate-100">
            {(['beneficiary', 'nurse', 'admin'] as Role[]).map((r) => {
              const config = roleConfig[r]
              const Icon = config.icon
              const isActive = role === r
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); setMode('login'); setRegisterSuccess(false) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-300 relative ${
                    isActive ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? config.textAccent : ''}`} />
                  <span>{config.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="authTab"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-l ${config.gradient}`}
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Auth Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {registerSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-6"
                >
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${roleConfig[role].gradient} mx-auto mb-4 shadow-lg`}>
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">تم التسجيل بنجاح!</h3>
                  <p className="text-muted-foreground mb-6">
                    {role === 'nurse'
                      ? 'سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.'
                      : 'يمكنك الآن تسجيل الدخول وطلب الخدمات الصحية.'}
                  </p>
                  <Button
                    className={`bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90`}
                    onClick={() => { setRegisterSuccess(false); setMode('login') }}
                  >
                    تسجيل الدخول
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key={`${role}-${mode}`}
                  initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Mode Title */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold">
                      {mode === 'login' ? `تسجيل دخول ${roleConfig[role].label}` : `إنشاء حساب ${roleConfig[role].label}`}
                    </h3>
                  </div>

                  {/* ═══ LOGIN FORMS ═══ */}
                  {mode === 'login' && (
                    <div className="space-y-4">
                      {role === 'admin' && (
                        <>
                          <div className="space-y-2">
                            <Label>اسم المستخدم</Label>
                            <Input
                              value={adminForm.username}
                              onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
                              onKeyDown={handleKeyDown}
                              placeholder="أدخل اسم المستخدم"
                              className="h-11"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                value={adminForm.password}
                                onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
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
                        </>
                      )}

                      {role === 'nurse' && (
                        <>
                          <div className="space-y-2">
                            <Label>رقم الهاتف</Label>
                            <Input
                              value={nurseLoginForm.phone}
                              onChange={e => setNurseLoginForm(f => ({ ...f, phone: e.target.value }))}
                              onKeyDown={handleKeyDown}
                              placeholder="7XXXXXXXX"
                              dir="ltr"
                              className="h-11 text-left"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                value={nurseLoginForm.password}
                                onChange={e => setNurseLoginForm(f => ({ ...f, password: e.target.value }))}
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
                        </>
                      )}

                      {role === 'beneficiary' && (
                        <>
                          <div className="space-y-2">
                            <Label>رقم الهاتف</Label>
                            <Input
                              value={beneficiaryLoginForm.phone}
                              onChange={e => setBeneficiaryLoginForm(f => ({ ...f, phone: e.target.value }))}
                              onKeyDown={handleKeyDown}
                              placeholder="7XXXXXXXX"
                              dir="ltr"
                              className="h-11 text-left"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                value={beneficiaryLoginForm.password}
                                onChange={e => setBeneficiaryLoginForm(f => ({ ...f, password: e.target.value }))}
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
                        </>
                      )}

                      <Button
                        className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`}
                        onClick={() => {
                          if (role === 'admin') handleAdminLogin()
                          else if (role === 'nurse') handleNurseLogin()
                          else handleBeneficiaryLogin()
                        }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
                      </Button>

                      {role !== 'admin' && (
                        <div className="text-center">
                          <button
                            onClick={() => setMode('register')}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            ليس لديك حساب؟ إنشاء حساب جديد
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ REGISTER FORMS ═══ */}
                  {mode === 'register' && role === 'nurse' && (
                    <div className="space-y-3">
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
                          <Label className="text-xs">الرقم الوطني *</Label>
                          <Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="الرقم الوطني" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">رقم المزاولة *</Label>
                          <Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">تاريخ انتهاء المزاولة *</Label>
                          <Input type="date" value={nurseRegForm.licenseExpiryDate} onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} dir="ltr" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">كلمة المرور *</Label>
                          <Input type="password" value={nurseRegForm.password} onChange={e => setNurseRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف+" className="h-10" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">تأكيد كلمة المرور *</Label>
                        <Input type="password" value={nurseRegForm.confirmPassword} onChange={e => setNurseRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-10" />
                      </div>
                      <Button
                        className={`w-full h-11 font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`}
                        onClick={handleNurseRegister}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                      </Button>
                      <div className="text-center">
                        <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          لديك حساب؟ تسجيل الدخول
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'register' && role === 'beneficiary' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>الاسم الكامل *</Label>
                        <Input value={beneficiaryRegForm.name} onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>رقم الهاتف *</Label>
                        <Input value={beneficiaryRegForm.phone} onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left" />
                      </div>
                      <div className="space-y-2">
                        <Label>الموقع *</Label>
                        <Input value={beneficiaryRegForm.location} onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة / المنطقة" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>كلمة المرور *</Label>
                        <Input type="password" value={beneficiaryRegForm.password} onChange={e => setBeneficiaryRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف على الأقل" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>تأكيد كلمة المرور *</Label>
                        <Input type="password" value={beneficiaryRegForm.confirmPassword} onChange={e => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-11" />
                      </div>
                      <Button
                        className={`w-full h-12 font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`}
                        onClick={handleBeneficiaryRegister}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                      </Button>
                      <div className="text-center">
                        <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          لديك حساب؟ تسجيل الدخول
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
