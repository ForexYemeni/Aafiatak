'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, AlertTriangle, Copy, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export default function FirebaseSetup() {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    // Check Firebase connection
    fetch('/api/admin/init', { method: 'GET' })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('not connected')
      })
      .then(data => {
        setFirebaseStatus(data.connected ? 'connected' : 'disconnected')
      })
      .catch(() => setFirebaseStatus('disconnected'))
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'تم النسخ' })
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
            <li>أدخل اسم المشروع (مثلاً: afiyatak)</li>
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
            يجب تفعيل قاعدة بيانات Firestore في المشروع.
          </p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>من القائمة الجانبية، اضغط على &quot;Firestore Database&quot;</li>
            <li>اضغط &quot;Create Database&quot;</li>
            <li>اختر <strong>&quot;Start in test mode&quot;</strong> (للتجربة)</li>
            <li>اختر أقرب موقع جغرافي (مثلاً: europe-west1)</li>
            <li>اضغط &quot;Done&quot;</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'الخطوة ٣: الحصول على مفتاح الخدمة',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            هذا هو المفتاح الذي يسمح للتطبيق بالاتصال بقاعدة البيانات.
          </p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>اذهب إلى إعدادات المشروع ⚙️</li>
            <li>اختر تبويب &quot;Service Accounts&quot;</li>
            <li>اضغط &quot;Generate New Private Key&quot;</li>
            <li>سيتم تحميل ملف JSON - افتحه</li>
            <li>انسخ القيم الثلاث المطلوبة أدناه</li>
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
              أدخل بيانات مفتاح الخدمة من ملف JSON الذي تم تحميله. هذه البيانات تُحفظ في ملف .env.local على الخادم فقط ولا تُعرض للمستخدمين.
            </p>
          </div>
          <div className="space-y-2">
            <Label>project_id</Label>
            <div className="flex gap-2">
              <Input placeholder="مثال: afiyatak-12345" className="text-left" dir="ltr" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard('FIREBASE_PROJECT_ID=')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>client_email</Label>
            <div className="flex gap-2">
              <Input placeholder="مثال: firebase-adminsdk@afiyatak.iam.gserviceaccount.com" className="text-left" dir="ltr" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard('FIREBASE_CLIENT_EMAIL=')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>private_key</Label>
            <Textarea placeholder="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----" className="text-left font-mono text-xs" dir="ltr" rows={4} />
          </div>
          <p className="text-xs text-muted-foreground">
            بعد إدخال البيانات، أضفها إلى ملف .env.local بالصيغة الموضحة أعلاه ثم أعد تشغيل الخادم.
          </p>
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
            {firebaseStatus === 'disconnected' && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                غير متصل
              </div>
            )}
            {firebaseStatus === 'connected' && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                متصل بنجاح
              </div>
            )}
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
              <Button
                variant="ghost"
                onClick={() => setView('landing')}
              >
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
                      toast({ title: 'تم الحفظ', description: 'أعد تشغيل الخادم لتطبيق التغييرات' })
                    }}
                  >
                    حفظ الإعدادات
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
