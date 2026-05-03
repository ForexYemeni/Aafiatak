'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, ClipboardList, User, LogOut, Loader2, Play, CheckCircle } from 'lucide-react'
import { useAppStore, formatPrice, getStatusLabel, getStatusColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

type Tab = 'profile' | 'assignments'

export default function NurseDashboard() {
  const { user, setView, logout } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('assignments')
  const [profile, setProfile] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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
  ]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-teal-700">عافيتك</h2>
              <p className="text-xs text-muted-foreground">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-1" />
            خروج
          </Button>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'profile' && profile && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">الملف الشخصي</h1>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold">
                          {profile.firstName} {profile.secondName} {profile.thirdName} {profile.lastName}
                        </h3>
                        <Badge className={getStatusColor(profile.status)}>{getStatusLabel(profile.status)}</Badge>
                      </div>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">رقم الهاتف:</span> <span className="font-medium">{profile.phone}</span></div>
                        <div><span className="text-muted-foreground">الموقع:</span> <span className="font-medium">{profile.location}</span></div>
                        <div><span className="text-muted-foreground">الرقم الوطني:</span> <span className="font-medium">{profile.nationalId}</span></div>
                        <div><span className="text-muted-foreground">رقم المزاولة:</span> <span className="font-medium">{profile.licenseNumber}</span></div>
                        <div><span className="text-muted-foreground">تاريخ انتهاء المزاولة:</span> <span className="font-medium">{profile.licenseExpiryDate}</span></div>
                        <div><span className="text-muted-foreground">تاريخ التسجيل:</span> <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString('ar-YE')}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">المهام المعينة</h1>
                  {assignments.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-12 text-center text-muted-foreground">
                        لا توجد مهام معينة حالياً
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {assignments.map(assignment => (
                        <Card key={assignment.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                              <div className="flex-1 min-w-64">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{assignment.request?.service?.name}</h3>
                                  <Badge className={getStatusColor(assignment.status)}>
                                    {getStatusLabel(assignment.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                  <span>المستفيد: {assignment.request?.beneficiary?.name}</span>
                                  <span>هاتف المستفيد: {assignment.request?.beneficiary?.phone}</span>
                                  <span>موقع المستفيد: {assignment.request?.beneficiary?.location}</span>
                                  <span>السعر: {formatPrice(assignment.request?.service?.price || 0)}</span>
                                  {assignment.request?.notes && <span>ملاحظات: {assignment.request.notes}</span>}
                                  {assignment.request?.address && <span>العنوان: {assignment.request.address}</span>}
                                </div>
                              </div>
                              {assignment.status === 'assigned' && (
                                <Button
                                  size="sm"
                                  className="bg-teal-600 hover:bg-teal-700"
                                  onClick={() => handleUpdateStatus(assignment.id, 'in_progress')}
                                >
                                  <Play className="w-4 h-4 ml-1" />
                                  بدء التنفيذ
                                </Button>
                              )}
                              {assignment.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                                >
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                  إكمال المهمة
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
