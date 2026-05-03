'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Stethoscope, Heart, Database, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export default function LandingPage() {
  const { setView } = useAppStore()
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  useEffect(() => {
    checkFirebase()
  }, [])

  const checkFirebase = async () => {
    try {
      const res = await fetch('/api/firebase-status')
      if (res.ok) {
        const data = await res.json()
        setFirebaseConnected(data.connected)
        setFirebaseError(data.error)
      } else {
        setFirebaseConnected(false)
        setFirebaseError('فشل الاتصال بالخادم')
      }
    } catch {
      setFirebaseConnected(false)
      setFirebaseError('فشل الاتصال بالخادم')
    }
  }

  const cards = [
    {
      icon: Heart,
      title: 'المستفيد',
      description: 'طلب الخدمات الصحية ومتابعة حالة الطلبات',
      view: 'unified-login' as const,
      color: 'from-rose-500 via-pink-500 to-fuchsia-600',
      bgLight: 'bg-rose-50',
      iconColor: 'text-rose-600',
      role: 'beneficiary',
    },
    {
      icon: Stethoscope,
      title: 'الممرض',
      description: 'تسجيل الدخول أو إنشاء حساب لمتابعة المهام المعينة',
      view: 'unified-login' as const,
      color: 'from-violet-500 via-purple-500 to-indigo-600',
      bgLight: 'bg-violet-50',
      iconColor: 'text-violet-600',
      role: 'nurse',
    },
    {
      icon: Shield,
      title: 'الإدارة',
      description: 'لوحة تحكم المدير لإدارة الخدمات والممرضين والطلبات',
      view: 'unified-login' as const,
      color: 'from-amber-500 via-orange-500 to-red-600',
      bgLight: 'bg-amber-50',
      iconColor: 'text-amber-600',
      role: 'admin',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-amber-200/30 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-6">
            <Image
              src="/logo.png"
              alt="عافيتك"
              width={100}
              height={100}
              className="rounded-2xl shadow-xl"
              priority
            />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            عافيتك
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 font-medium">
            رعاية صحية في منزلك
          </p>
          <p className="text-muted-foreground mt-2 text-base">
            منصة متكاملة لربط المستفيدين بالممرضين المؤهلين
          </p>
        </motion.div>

        {/* Firebase Status Banner - only show when disconnected */}
        {firebaseConnected === false && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mb-6"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-800">قاعدة البيانات غير متصلة</p>
                <p className="text-sm text-red-700 mt-1">
                  {firebaseError || 'لا يمكن الاتصال بـ Firebase. يرجى إعداد قاعدة البيانات أولاً.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setView('firebase-setup')}
                >
                  <Database className="w-4 h-4 ml-1" />
                  إعداد قاعدة البيانات
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Role Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.15 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full"
                onClick={() => setView(card.view)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${card.bgLight} mb-4`}>
                    <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  <Button
                    className={`mt-4 w-full bg-gradient-to-r ${card.color} text-white border-0 hover:opacity-90`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setView(card.view)
                    }}
                  >
                    دخول
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 relative z-10">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
