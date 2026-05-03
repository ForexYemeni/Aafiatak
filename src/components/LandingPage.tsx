'use client'

import { motion } from 'framer-motion'
import { Shield, Stethoscope, Heart, Database } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  const { setView } = useAppStore()

  const cards = [
    {
      icon: Shield,
      title: 'الإدارة',
      description: 'لوحة تحكم المدير لإدارة الخدمات والممرضين والطلبات',
      view: 'admin-login' as const,
      color: 'from-emerald-500 to-emerald-700',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Stethoscope,
      title: 'الممرض',
      description: 'تسجيل الدخول أو إنشاء حساب لمتابعة المهام المعينة',
      view: 'nurse-login' as const,
      color: 'from-teal-500 to-teal-700',
      bgLight: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      icon: Heart,
      title: 'المستفيد',
      description: 'طلب الخدمات الصحية ومتابعة حالة الطلبات',
      view: 'beneficiary-login' as const,
      color: 'from-cyan-500 to-cyan-700',
      bgLight: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl mb-6">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            عافيتك
          </h1>
          <p className="text-xl md:text-2xl text-emerald-700 font-medium">
            رعاية صحية في منزلك
          </p>
          <p className="text-muted-foreground mt-2 text-base">
            منصة متكاملة لربط المستفيدين بالممرضين المؤهلين
          </p>
        </motion.div>

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
      <footer className="text-center py-6 flex flex-col items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="border-orange-200 text-orange-700 hover:bg-orange-50 gap-2"
          onClick={() => setView('firebase-setup')}
        >
          <Database className="w-4 h-4" />
          إعداد قاعدة البيانات
        </Button>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} عافيتك - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
