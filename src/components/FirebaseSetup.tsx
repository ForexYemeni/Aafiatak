'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, AlertTriangle, Copy, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export default function FirebaseSetup() {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    checkFirebase()
  }, [])

  const checkFirebase = async () => {
    setFirebaseStatus('checking')
    try {
      const res = await fetch('/api/firebase-status')
      if (res.ok) {
        const data = await res.json()
        setFirebaseStatus(data.connected ? 'connected' : 'disconnected')
      } else {
        setFirebaseStatus('disconnected')
      }
    } catch {
      setFirebaseStatus('disconnected')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'تم النسخ!' })
  }

  const steps = [
    {
      title: 'الخطوة ١: إنشاء مشروع Firebase',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            اذهب إلى موقع Firebase Console وأنشئ مشروعاً جديداً مجانياً. Firebase يوفر طبقة مجانية مدى الحياة تسمى Spark Plan.
          </p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>افتح <a href="https://console.firebase.google.com" target="_blank" className="text-emerald-600 underline" rel="noreferrer">Firebase Console</a></li>
            <li>اضغط على &quot;Add Project&quot; (إضافة مشروع)</li>
            <li>أدخل اسم المشروع (مثلاً: aafiatak)</li>
            <li>اختر عدم تفعيل Analytics (اختياري)</li>
            <li>اضغط &quot;Create Project&quot;</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'الخطوة ٢: تفعيل Firestore',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            يجب تفعيل قاعدة بيانات Firestore في المشروع حتى يتم تخزين البيانات.
          </p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>من القائمة الجانبية، اضغط على &quot;Firestore Database&quot;</li>
            <li>اضغط &quot;Create Database&quot;</li>
            <li>اختر <strong>&quot;Start in test mode&quot;</strong> (للتجربة)</li>
            <li>اختر أقرب موقع جغرافي (مثلاً: europe-west1)</li>
            <li>اضغط &quot;Done&quot;</li>
          </ol>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              هذه الخطوة ضرورية جداً! بدون إنشاء Firestore Database ستظهر أخطاء PERMISSION_DENIED.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'الخطوة ٣: الحصول على مفتاح الخدمة',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            هذا المفتاح يسمح للتطبيق بالاتصال بقاعدة البيانات بشكل آمن.
          </p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>اذهب إلى <strong>Project Settings</strong> (⚙️ إعدادات المشروع)</li>
            <li>اختر تبويب &quot;Service Accounts&quot;</li>
            <li>اضغط &quot;Generate New Private Key&quot;</li>
            <li>سيتم تحميل ملف JSON - افتحه</li>
            <li>انسخ القيم الثلاث المطلوبة</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'الخطوة ٤: إدخال بيانات الاتصال',
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              إذا كنت تستخدم Vercel، أضف هذه المتغيرات في Settings → Environment Variables. أما محلياً، أضفها في ملف .env.local
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-sm">FIREBASE_PROJECT_ID</Label>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard('FIREBASE_PROJECT_ID=')}>
                  <Copy className="w-3 h-3 ml-1" /> نسخ
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">من ملف JSON: project_id</p>
              <div className="bg-gray-50 border rounded p-2 text-xs font-mono text-left" dir="ltr">
                aafiatak-26439
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-sm">FIREBASE_CLIENT_EMAIL</Label>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard('FIREBASE_CLIENT_EMAIL=')}>
                  <Copy className="w-3 h-3 ml-1" /> نسخ
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">من ملف JSON: client_email</p>
              <div className="bg-gray-50 border rounded p-2 text-xs font-mono text-left break-all" dir="ltr">
                firebase-adminsdk-fbsvc@aafiatak-26439.iam.gserviceaccount.com
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-sm">FIREBASE_PRIVATE_KEY</Label>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard('FIREBASE_PRIVATE_KEY=')}>
                  <Copy className="w-3 h-3 ml-1" /> نسخ
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">من ملف JSON: private_key - انسخه بالكامل بما فيه -----BEGIN و -----END</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mx-auto mb-3">
              <Database className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold">إعداد قاعدة البيانات</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              اربط التطبيق بـ Firebase Firestore (مجاني مدى الحياة)
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {firebaseStatus === 'disconnected' && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  غير متصل
                </div>
              )}
              {firebaseStatus === 'connected' && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  متصل بنجاح ✅
                </div>
              )}
              {firebaseStatus === 'checking' && (
                <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  جاري التحقق...
                </div>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={checkFirebase}>
                <RefreshCw className="w-3 h-3 ml-1" />
                إعادة التحقق
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step progress */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                    i === step
                      ? 'bg-emerald-600 text-white scale-110'
                      : i < step
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-4">{steps[step].title}</h3>
            {steps[step].content}

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setView('landing')}>
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    السابق
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStep(step + 1)}>
                    التالي
                  </Button>
                ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      checkFirebase()
                      toast({ title: 'جاري التحقق من الاتصال...' })
                    }}
                  >
                    التحقق من الاتصال
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>
}
