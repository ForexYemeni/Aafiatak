'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, ClipboardList, User, LogOut, Loader2, Play, CheckCircle,
  Menu, X, Phone, MapPin, Clock, HelpCircle, Bell, Activity
} from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

type Tab = 'assignments' | 'profile' | 'help'

export default function NurseDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('assignments')
  const [profile, setProfile] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'profile') {
        const res = await fetch(`/api/nurse/profile?nurseId=${(user as any)?.id}`)
        if (res.ok) setProfile(await res.json())
      } else {
        const res = await fetch(`/api/nurse/assignments?nurseId=${(user as any)?.id}`)
        if (res.ok) setAssignments(await res.json())
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, user, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStatus = async (assignmentId: string, status: string) => {
    try {
      const res = await fetch(`/api/nurse/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: status === 'in_progress' ? 'تم بدء تنفيذ المهمة' : 'تم إكمال المهمة' })
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout()
    setView('landing')
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'assignments', label: 'المهام', icon: ClipboardList },
    { key: 'profile', label: 'الملف الشخصي', icon: User },
    { key: 'help', label: 'المساعدة', icon: HelpCircle },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const assignedCount = assignments.filter(a => a.status === 'assigned').length
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length
  const completedCount = assignments.filter(a => a.status === 'completed').length

  const nurseName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-l shadow-sm hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b bg-gradient-to-l from-violet-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="عافيتك" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">عافيتك</h2>
              <p className="text-violet-100 text-xs">حساب الممرض</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-violet-50 text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-right">{tab.label}</span>
              {tab.key === 'assignments' && assignedCount > 0 && (
                <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full">{assignedCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{nurseName}</p>
              <p className="text-muted-foreground text-xs">ممرض</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b bg-gradient-to-l from-violet-500 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="عافيتك" width={28} height={28} className="rounded-lg" />
            <h2 className="text-lg font-bold text-white">عافيتك</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="عافيتك" width={24} height={24} className="rounded" />
          <span className="font-bold text-violet-700">عافيتك</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:mr-72 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
                        <CardContent className="p-4 text-center">
                          <ClipboardList className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-violet-700">{assignments.length}</p>
                          <p className="text-xs text-muted-foreground">إجمالي المهام</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardContent className="p-4 text-center">
                          <Bell className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-amber-700">{assignedCount}</p>
                          <p className="text-xs text-muted-foreground">بانتظار البدء</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-4 text-center">
                          <Activity className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
                          <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                        <CardContent className="p-4 text-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
                          <p className="text-xs text-muted-foreground">مكتملة</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h1 className="text-2xl font-bold mb-1">المهام المعينة</h1>
                      <p className="text-muted-foreground text-sm">المهام المسندة إليك من قبل الإدارة</p>
                    </div>

                    {assignments.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد مهام معينة حالياً</p>
                        <p className="text-sm mt-2">سيتم إشعارك عند تعيين مهمة جديدة لك</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {assignments.map(assignment => (
                          <Card key={assignment.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between flex-wrap gap-4">
                                <div className="flex-1 min-w-64">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                                      <Stethoscope className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold">{assignment.request?.service?.name}</h3>
                                      <Badge className={getStatusColor(assignment.status)}>
                                        {getStatusLabel(assignment.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="font-medium">المستفيد:</span>
                                      <span className="text-muted-foreground">{assignment.request?.beneficiary?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="font-medium">الهاتف:</span>
                                      <span className="text-muted-foreground">{assignment.request?.beneficiary?.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="font-medium">الموقع:</span>
                                      <span className="text-muted-foreground">{assignment.request?.beneficiary?.location}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">السعر:</span>{' '}
                                      <span className="text-emerald-600 font-semibold">{formatPrice(assignment.request?.service?.price || 0)}</span>
                                    </div>
                                    {assignment.request?.notes && (
                                      <div className="col-span-2 bg-amber-50 rounded-lg p-2">
                                        <span className="font-medium text-amber-800">ملاحظات:</span>{' '}
                                        <span className="text-amber-700">{assignment.request.notes}</span>
                                      </div>
                                    )}
                                    {assignment.request?.address && (
                                      <div className="col-span-2 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                        <span className="font-medium">العنوان:</span>
                                        <span className="text-muted-foreground">{assignment.request.address}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {assignment.status === 'assigned' && (
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 shadow-sm"
                                      onClick={() => handleUpdateStatus(assignment.id, 'in_progress')}
                                    >
                                      <Play className="w-4 h-4 ml-1" />
                                      بدء التنفيذ
                                    </Button>
                                  )}
                                  {assignment.status === 'in_progress' && (
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-sm"
                                      onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                                    >
                                      <CheckCircle className="w-4 h-4 ml-1" />
                                      إكمال المهمة
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && profile && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">الملف الشخصي</h1>
                      <p className="text-muted-foreground text-sm">معلوماتك المهنية والشخصية</p>
                    </div>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{profile.firstName?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{profile.firstName} {profile.secondName} {profile.thirdName} {profile.lastName}</h3>
                            <Badge className={getStatusColor(profile.status)}>{getStatusLabel(profile.status)}</Badge>
                          </div>
                        </div>
                        <Separator className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Phone className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">رقم الهاتف</p><p className="font-medium">{profile.phone}</p></div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">الموقع</p><p className="font-medium">{profile.location}</p></div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Stethoscope className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">رقم المزاولة</p><p className="font-medium">{profile.licenseNumber}</p></div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Clock className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">انتهاء المزاولة</p><p className="font-medium">{profile.licenseExpiryDate}</p></div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <User className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">الرقم الوطني</p><p className="font-medium">{profile.nationalId}</p></div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Clock className="w-5 h-5 text-violet-600" />
                            <div><p className="text-muted-foreground text-xs">تاريخ التسجيل</p><p className="font-medium">{new Date(profile.createdAt).toLocaleDateString('ar-YE')}</p></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">المساعدة والدعم</h1>
                      <p className="text-muted-foreground text-sm">معلومات مهمة للممرضين</p>
                    </div>
                    {[
                      { q: 'كيف أبدأ تنفيذ مهمة؟', a: 'عند تعيين مهمة لك، ستظهر في قسم المهام بحالة "معيّن". اضغط على "بدء التنفيذ" للبدء.' },
                      { q: 'كيف أنهي مهمة؟', a: 'بعد بدء التنفيذ، ستظهر حالة المهمة "قيد التنفيذ". عند الانتهاء، اضغط "إكمال المهمة".' },
                      { q: 'لماذا لا أرى أي مهام؟', a: 'يتم تعيين المهام من قبل الإدارة. عند توفر مهمة مناسبة، سيتم إشعارك فوراً.' },
                      { q: 'كيف أتحقق من حالة ترخيصي؟', a: 'يمكنك الاطلاع على معلومات ترخيصك في قسم "الملف الشخصي" بما في ذلك تاريخ انتهاء المزاولة.' },
                    ].map((item, i) => (
                      <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-5">
                          <h3 className="font-bold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-violet-600" />
                            {item.q}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
