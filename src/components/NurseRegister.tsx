'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, ArrowRight, Loader2, CheckCircle, MapPin,
  Navigation, Shield, AlertTriangle, Check, X, Phone, CreditCard,
  FileBadge, Lock, ChevronLeft, User, BadgeCheck
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type NurseRegStep = 1 | 2 | 3

// ─── Step Indicator ───
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

export default function NurseRegister() {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [nurseStep, setNurseStep] = useState<NurseRegStep>(1)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    location: '',
    nationalId: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Step validations
  const isStep1Valid = form.fullName.trim().split(/\s+/).length >= 3 && form.phone && form.location
  const isStep2Valid = form.nationalId && form.licenseNumber && form.licenseExpiryDate
  const isLicenseExpired = form.licenseExpiryDate ? new Date(form.licenseExpiryDate) < new Date(new Date().toDateString()) : false
  const isStep3Valid = form.password.length >= 6 && form.password === form.confirmPassword

  const nurseSteps = [
    { num: 1, label: 'الشخصية', icon: User },
    { num: 2, label: 'الترخيص', icon: FileBadge },
    { num: 3, label: 'الحساب', icon: Lock },
  ]

  const handleRegister = async () => {
    if (!form.fullName || !form.phone || !form.location || !form.nationalId || !form.licenseNumber || !form.licenseExpiryDate || !form.password) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    const nameParts = form.fullName.trim().split(/\s+/)
    if (nameParts.length < 3) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم الرباعي كاملاً (3 أسماء على الأقل)', variant: 'destructive' })
      return
    }
    const expiryDate = new Date(form.licenseExpiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate < today) {
      toast({ title: 'ترخيص منتهي', description: 'لا يمكن التسجيل برخصة مزاولة منتهية الصلاحية', variant: 'destructive' })
      return
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' })
      return
    }
    if (form.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const parts = form.fullName.trim().split(/\s+/)
      const res = await fetch('/api/nurse/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: parts[0] || '',
          secondName: parts[1] || '',
          thirdName: parts[2] || '',
          lastName: parts[3] || parts[2] || '',
          phone: form.phone,
          location: form.location,
          nationalId: form.nationalId,
          licenseNumber: form.licenseNumber,
          licenseExpiryDate: form.licenseExpiryDate,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
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

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: 'غير مدعوم', description: 'متصفحك لا يدعم تحديد الموقع', variant: 'destructive' })
      return
    }
    toast({ title: 'جارٍ تحديد الموقع...', description: 'يرجى الانتظار' })
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`)
          const data = await res.json()
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          updateField('location', address)
          toast({ title: 'تم تحديد الموقع بنجاح', description: address.substring(0, 80) })
        } catch {
          updateField('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          toast({ title: 'تم تحديد الموقع', description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
        }
      },
      () => {
        toast({ title: 'خطأ في تحديد الموقع', description: 'يرجى السماح بالوصول إلى الموقع أو إدخاله يدوياً', variant: 'destructive' })
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }, [toast])

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="border-0 shadow-xl text-center bg-white/70 backdrop-blur-2xl rounded-3xl p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 mx-auto mb-6 shadow-2xl shadow-blue-500/25"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black mb-2">تم التسجيل بنجاح!</h2>
            <p className="text-slate-500 mb-6 leading-relaxed">سيتم مراجعة حسابك من قبل الإدارة. سيتم إشعارك عند الموافقة.</p>
            <Button className="bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/25 rounded-xl px-8 h-12 font-bold" onClick={() => setView('landing')}>
              العودة لتسجيل الدخول
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50 flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="border-0 shadow-xl bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 p-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-3">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">تسجيل حساب ممرض جديد</h2>
            <p className="text-blue-100 text-xs mt-1">أدخل بياناتك الكاملة للتسجيل</p>
          </div>

          <div className="p-5">
            {/* Step Indicator */}
            <StepIndicator currentStep={nurseStep} steps={nurseSteps} />

            <AnimatePresence mode="wait">
              {/* STEP 1: Personal Info */}
              {nurseStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-4 border border-blue-100/60 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-700">المعلومات الشخصية</p>
                        <p className="text-[10px] text-blue-400">الخطوة 1 من 3</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                          الاسم الرباعي *
                        </Label>
                        <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="أدخل اسمك الرباعي كاملاً" className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl text-sm" />
                        <div className="flex items-center gap-1.5">
                          {form.fullName.trim().split(/\s+/).filter(Boolean).length >= 3 ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <X className="w-3 h-3 text-slate-300" />
                          )}
                          <p className="text-[10px] text-gray-400">يجب أن يحتوي على 3 أسماء على الأقل</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          رقم الهاتف *
                        </Label>
                        <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="7XXXXXXXX" dir="ltr" className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 text-left rounded-xl text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          الموقع *
                        </Label>
                        <div className="flex gap-2">
                          <Input value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="المدينة أو العنوان" className="h-11 bg-white/70 backdrop-blur-sm border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl text-sm flex-1" />
                          <Button type="button" variant="outline" className="shrink-0 h-11 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 px-3" onClick={getLocation}>
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl rounded-xl shadow-lg shadow-blue-500/25 border-0" onClick={() => setNurseStep(2)} disabled={!isStep1Valid}>
                    <span className="flex items-center gap-2">التالي - معلومات الترخيص<ChevronLeft className="w-4 h-4" /></span>
                  </Button>
                </motion.div>
              )}

              {/* STEP 2: License Info */}
              {nurseStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl p-4 border border-amber-100/60 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                        <FileBadge className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-700">معلومات الترخيص</p>
                        <p className="text-[10px] text-amber-400">الخطوة 2 من 3</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            رقم الهوية *
                          </Label>
                          <Input value={form.nationalId} onChange={e => updateField('nationalId', e.target.value)} placeholder="رقم الهوية" className="h-11 bg-white/70 backdrop-blur-sm border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            رقم الترخيص *
                          </Label>
                          <Input value={form.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} placeholder="رقم الترخيص" className="h-11 bg-white/70 backdrop-blur-sm border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          تاريخ انتهاء الترخيص *
                        </Label>
                        <div className="relative">
                          <Input type="date" value={form.licenseExpiryDate} onChange={e => updateField('licenseExpiryDate', e.target.value)} className={`h-11 bg-white/70 backdrop-blur-sm rounded-xl ${form.licenseExpiryDate && isLicenseExpired ? 'border-red-300 focus:border-red-400' : 'border-amber-200/50 focus:border-amber-400'}`} />
                          {form.licenseExpiryDate && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              {isLicenseExpired ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
                            </div>
                          )}
                        </div>
                        {form.licenseExpiryDate && isLicenseExpired && (
                          <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-xs text-red-600 font-bold">ترخيص منتهي! لا يمكن التسجيل برخصة منتهية الصلاحية</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setNurseStep(1)}>
                      <ArrowRight className="w-4 h-4 ml-1" />السابق
                    </Button>
                    <Button className="flex-[2] h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl rounded-xl shadow-lg shadow-blue-500/25 border-0" onClick={() => setNurseStep(3)} disabled={!isStep2Valid || isLicenseExpired}>
                      <span className="flex items-center gap-2">التالي - إعداد الحساب<ChevronLeft className="w-4 h-4" /></span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Account Setup */}
              {nurseStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-4 border border-emerald-100/60 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">إعداد الحساب</p>
                        <p className="text-[10px] text-emerald-400">الخطوة 3 من 3</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white/50 rounded-xl p-3 border border-emerald-100/40">
                        <p className="text-[10px] font-bold text-slate-400 mb-2">ملخص البيانات</p>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 truncate">{form.fullName.substring(0, 20)}</span></div>
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><span className="text-slate-500">{form.phone}</span></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" />كلمة المرور *</Label>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="6 أحرف على الأقل" className="h-11 bg-white/70 backdrop-blur-sm border-emerald-200/50 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl text-sm pl-10" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" />تأكيد كلمة المرور *</Label>
                        <Input type="password" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="أعد كتابة كلمة المرور" className="h-11 bg-white/70 backdrop-blur-sm border-emerald-200/50 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl text-sm" />
                        {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6 && (
                          <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /><p className="text-[10px] text-emerald-500 font-bold">كلمتا المرور متطابقتان</p></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setNurseStep(2)}>
                      <ArrowRight className="w-4 h-4 ml-1" />السابق
                    </Button>
                    <Button className="flex-[2] h-12 font-bold bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 text-white hover:shadow-xl rounded-xl shadow-lg shadow-blue-500/25 border-0" onClick={handleRegister} disabled={loading || !isStep3Valid}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />إنشاء الحساب</span>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-4">
              <Button variant="ghost" className="flex-1 text-sm" onClick={() => setView('landing')}>
                <ArrowRight className="w-4 h-4 ml-2" />الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
