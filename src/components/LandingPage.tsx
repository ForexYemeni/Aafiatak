'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Stethoscope, Heart, ArrowLeft, Loader2, UserPlus, Eye, EyeOff, CheckCircle, Database, AlertTriangle, Clock, MapPin, Phone, Star } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

type Role = 'beneficiary' | 'nurse' | 'admin'
type Mode = 'login' | 'register'

export default function LandingPage() {
  const { setView, setUser } = useAppStore()
  const { toast } = useToast()

  const [showAuth, setShowAuth] = useState(false)
  const [role, setRole] = useState<Role>('beneficiary')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  // Login forms
  const [adminForm, setAdminForm] = useState({ username: '', password: '' })
  const [nurseLoginForm, setNurseLoginForm] = useState({ phone: '', password: '' })
  const [beneficiaryLoginForm, setBeneficiaryLoginForm] = useState({ phone: '', password: '' })

  // Register forms
  const [nurseRegForm, setNurseRegForm] = useState({
    firstName: '', secondName: '', thirdName: '', lastName: '',
    phone: '', location: '', nationalId: '', licenseNumber: '',
    licenseExpiryDate: '', password: '', confirmPassword: '',
  })
  const [beneficiaryRegForm, setBeneficiaryRegForm] = useState({
    name: '', phone: '', location: '', password: '', confirmPassword: '',
  })

  // ============ LOGIN HANDLERS ============

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
      if (role === 'admin') handleAdminLogin()
      else if (role === 'nurse') handleNurseLogin()
      else handleBeneficiaryLogin()
    }
  }

  const roleConfig = {
    beneficiary: {
      icon: Heart, label: 'المستفيد',
      gradient: 'from-rose-500 to-pink-600',
      btnGradient: 'from-rose-500 to-pink-600',
      textAccent: 'text-rose-600',
    },
    nurse: {
      icon: Stethoscope, label: 'الممرض',
      gradient: 'from-violet-500 to-purple-600',
      btnGradient: 'from-violet-500 to-purple-600',
      textAccent: 'text-violet-600',
    },
    admin: {
      icon: Shield, label: 'الإدارة',
      gradient: 'from-amber-500 to-orange-600',
      btnGradient: 'from-amber-500 to-orange-600',
      textAccent: 'text-amber-600',
    },
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <AnimatePresence mode="wait">
        {!showAuth ? (
          /* ========== SHOWCASE PAGE ========== */
          <motion.div
            key="showcase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTgtMThjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
              <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  {/* Text */}
                  <div className="flex-1 text-center md:text-right">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span>رعاية صحية منزلية موثوقة</span>
                      </div>
                      <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-l from-rose-400 to-purple-400 bg-clip-text text-transparent">عافيتك</span>
                        <br />
                        <span className="text-3xl md:text-4xl font-medium text-white/80">رعاية صحية في منزلك</span>
                      </h1>
                      <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg mx-auto md:mx-0">
                        منصة متكاملة لربط المستفيدين بممرضين مؤهلين لتقديم خدمات صحية منزلية بأعلى معايير الجودة والسلامة
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button
                          size="lg"
                          className="bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-xl shadow-purple-500/25"
                          onClick={() => { setShowAuth(true); setRole('beneficiary') }}
                        >
                          <Heart className="w-5 h-5 ml-2" />
                          ابدأ الآن
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14"
                          onClick={() => { setShowAuth(true); setRole('nurse') }}
                        >
                          <Stethoscope className="w-5 h-5 ml-2" />
                          سجل كممرض
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Logo */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-purple-500/20 rounded-3xl blur-2xl scale-110" />
                      <Image
                        src="/logo.png"
                        alt="عافيتك"
                        width={220}
                        height={220}
                        className="rounded-3xl shadow-2xl relative z-10"
                        priority
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
              <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">ما يميز <span className="text-rose-600">عافيتك</span></h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">نوفر لك تجربة رعاية صحية منزلية متكاملة وسهلة الاستخدام</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: Heart, title: 'خدمات متنوعة', desc: 'تشخيص وعلاج منزلي، تمريض، علاج طبيعي، ورعاية مسنين بخبرات متعددة', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
                    { icon: Clock, title: 'سرعة الاستجابة', desc: 'اطلب الخدمة من منزلك وسيصلك ممرض مؤهل في أسرع وقت ممكن', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
                    { icon: Star, title: 'كفاءة واحترافية', desc: 'ممرضون معتمدون ومرخصون تحت إشراف إداري دقيق لضمان جودة الخدمة', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full group">
                        <CardContent className="p-8 text-center">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.bg} mb-6 group-hover:scale-110 transition-transform`}>
                            <feature.icon className="w-8 h-8 bg-gradient-to-br bg-clip-text text-transparent" style={{ color: feature.color.includes('rose') ? '#e11d48' : feature.color.includes('violet') ? '#7c3aed' : '#d97706' }} />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-slate-50">
              <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">كيف يعمل التطبيق؟</h2>
                  <p className="text-muted-foreground text-lg">ثلاث خطوات بسيطة للحصول على الرعاية الصحية</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { step: '١', title: 'سجل حسابك', desc: 'أنشئ حسابك كـمستفيد أو ممرض بخطوات بسيطة وسريعة', icon: UserPlus },
                    { step: '٢', title: 'اطلب الخدمة', desc: 'اختر الخدمة الصحية المناسبة وحدد العنوان وطريقة الدفع', icon: MapPin },
                    { step: '٣', title: 'استقبل الرعاية', desc: 'يصلك ممرض مؤهل لتنفيذ الخدمة في منزلك بأعلى جودة', icon: Heart },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-rose-500 text-white text-3xl font-bold mb-6 shadow-lg shadow-purple-500/20">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">ابدأ رحلتك الصحية اليوم</h2>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">سواء كنت مستفيداً يبحث عن رعاية أو ممرضاً يبحث عن فرص عمل، عافيتك هي المنصة المثالية لك</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-rose-500 to-purple-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-xl"
                    onClick={() => { setShowAuth(true); setRole('beneficiary') }}
                  >
                    <Heart className="w-5 h-5 ml-2" />
                    تسجيل مستفيد
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-l from-violet-500 to-indigo-600 text-white hover:opacity-90 text-lg px-8 h-14 shadow-xl"
                    onClick={() => { setShowAuth(true); setRole('nurse') }}
                  >
                    <Stethoscope className="w-5 h-5 ml-2" />
                    تسجيل ممرض
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14"
                    onClick={() => { setShowAuth(true); setRole('admin') }}
                  >
                    <Shield className="w-5 h-5 ml-2" />
                    دخول الإدارة
                  </Button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-slate-900 text-center">
              <p className="text-sm text-white/50">
                &copy; {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
              </p>
            </footer>
          </motion.div>
        ) : (
          /* ========== AUTH PAGE ========== */
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-8"
          >
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-amber-200/30 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-lg relative z-10">
              {/* Logo & Back */}
              <div className="text-center mb-6">
                <Button
                  variant="ghost"
                  className="mb-4 text-muted-foreground hover:text-foreground"
                  onClick={() => { setShowAuth(false); setRegisterSuccess(false); setMode('login') }}
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  العودة للرئيسية
                </Button>
                <div className="inline-block mb-3">
                  <Image src="/logo.png" alt="عافيتك" width={70} height={70} className="rounded-xl shadow-lg" priority />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  عافيتك
                </h1>
              </div>

              {/* Main Auth Card */}
              <Card className="border-0 shadow-2xl shadow-black/5 overflow-hidden">
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
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-300 relative ${
                          isActive ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? config.textAccent : ''}`} />
                        <span>{config.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`}
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
                          <h2 className="text-xl font-bold">
                            {mode === 'login' ? `تسجيل دخول ${roleConfig[role].label}` : `إنشاء حساب ${roleConfig[role].label}`}
                          </h2>
                        </div>

                        {/* ============ LOGIN FORMS ============ */}
                        {mode === 'login' && (
                          <div className="space-y-4">
                            {role === 'admin' && (
                              <>
                                <div className="space-y-2">
                                  <Label>اسم المستخدم</Label>
                                  <Input value={adminForm.username} onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))} onKeyDown={handleKeyDown} placeholder="أدخل اسم المستخدم" className="h-11" disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                  <Label>كلمة المرور</Label>
                                  <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} onKeyDown={handleKeyDown} placeholder="أدخل كلمة المرور" className="h-11 pl-10" disabled={loading} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                                  <Input value={nurseLoginForm.phone} onChange={e => setNurseLoginForm(f => ({ ...f, phone: e.target.value }))} onKeyDown={handleKeyDown} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left" disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                  <Label>كلمة المرور</Label>
                                  <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} value={nurseLoginForm.password} onChange={e => setNurseLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={handleKeyDown} placeholder="أدخل كلمة المرور" className="h-11 pl-10" disabled={loading} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                                  <Input value={beneficiaryLoginForm.phone} onChange={e => setBeneficiaryLoginForm(f => ({ ...f, phone: e.target.value }))} onKeyDown={handleKeyDown} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left" disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                  <Label>كلمة المرور</Label>
                                  <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} value={beneficiaryLoginForm.password} onChange={e => setBeneficiaryLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={handleKeyDown} placeholder="أدخل كلمة المرور" className="h-11 pl-10" disabled={loading} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}

                            <Button
                              className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`}
                              onClick={() => { if (role === 'admin') handleAdminLogin(); else if (role === 'nurse') handleNurseLogin(); else handleBeneficiaryLogin() }}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
                            </Button>

                            {role !== 'admin' && (
                              <div className="text-center">
                                <button onClick={() => setMode('register')} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                                  <UserPlus className="w-3.5 h-3.5" />
                                  ليس لديك حساب؟ إنشاء حساب جديد
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ============ REGISTER FORMS ============ */}
                        {mode === 'register' && role === 'nurse' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5"><Label className="text-xs">الاسم الأول *</Label><Input value={nurseRegForm.firstName} onChange={e => setNurseRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="الاسم الأول" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">الاسم الثاني *</Label><Input value={nurseRegForm.secondName} onChange={e => setNurseRegForm(f => ({ ...f, secondName: e.target.value }))} placeholder="الاسم الثاني" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">الاسم الثالث *</Label><Input value={nurseRegForm.thirdName} onChange={e => setNurseRegForm(f => ({ ...f, thirdName: e.target.value }))} placeholder="الاسم الثالث" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">الاسم الرابع *</Label><Input value={nurseRegForm.lastName} onChange={e => setNurseRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="اللقب" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">رقم الهاتف *</Label><Input value={nurseRegForm.phone} onChange={e => setNurseRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-10 text-left" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">الموقع *</Label><Input value={nurseRegForm.location} onChange={e => setNurseRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">الرقم الوطني *</Label><Input value={nurseRegForm.nationalId} onChange={e => setNurseRegForm(f => ({ ...f, nationalId: e.target.value }))} placeholder="الرقم الوطني" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">رقم المزاولة *</Label><Input value={nurseRegForm.licenseNumber} onChange={e => setNurseRegForm(f => ({ ...f, licenseNumber: e.target.value }))} placeholder="رقم الترخيص" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">تاريخ انتهاء المزاولة *</Label><Input type="date" value={nurseRegForm.licenseExpiryDate} onChange={e => setNurseRegForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} dir="ltr" className="h-10" /></div>
                              <div className="space-y-1.5"><Label className="text-xs">كلمة المرور *</Label><Input type="password" value={nurseRegForm.password} onChange={e => setNurseRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف+" className="h-10" /></div>
                            </div>
                            <div className="space-y-1.5"><Label className="text-xs">تأكيد كلمة المرور *</Label><Input type="password" value={nurseRegForm.confirmPassword} onChange={e => setNurseRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-10" /></div>
                            <Button className={`w-full h-11 font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`} onClick={handleNurseRegister} disabled={loading}>
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                            </Button>
                            <div className="text-center">
                              <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">لديك حساب؟ تسجيل الدخول</button>
                            </div>
                          </div>
                        )}

                        {mode === 'register' && role === 'beneficiary' && (
                          <div className="space-y-4">
                            <div className="space-y-2"><Label>الاسم الكامل *</Label><Input value={beneficiaryRegForm.name} onChange={e => setBeneficiaryRegForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" className="h-11" /></div>
                            <div className="space-y-2"><Label>رقم الهاتف *</Label><Input value={beneficiaryRegForm.phone} onChange={e => setBeneficiaryRegForm(f => ({ ...f, phone: e.target.value }))} placeholder="7XXXXXXXX" dir="ltr" className="h-11 text-left" /></div>
                            <div className="space-y-2"><Label>الموقع *</Label><Input value={beneficiaryRegForm.location} onChange={e => setBeneficiaryRegForm(f => ({ ...f, location: e.target.value }))} placeholder="المدينة / المنطقة" className="h-11" /></div>
                            <div className="space-y-2"><Label>كلمة المرور *</Label><Input type="password" value={beneficiaryRegForm.password} onChange={e => setBeneficiaryRegForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف على الأقل" className="h-11" /></div>
                            <div className="space-y-2"><Label>تأكيد كلمة المرور *</Label><Input type="password" value={beneficiaryRegForm.confirmPassword} onChange={e => setBeneficiaryRegForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="أعد كتابة كلمة المرور" className="h-11" /></div>
                            <Button className={`w-full h-12 font-semibold bg-gradient-to-r ${roleConfig[role].btnGradient} text-white hover:opacity-90 shadow-lg`} onClick={handleBeneficiaryRegister} disabled={loading}>
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الحساب'}
                            </Button>
                            <div className="text-center">
                              <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">لديك حساب؟ تسجيل الدخول</button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
