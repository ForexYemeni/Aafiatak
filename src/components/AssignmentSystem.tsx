'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, X, Clock, User, MapPin, DollarSign, 
  CheckCircle, AlertCircle, Loader, Users,
  Stethoscope, Heart, Activity, Ambulance
} from 'lucide-react'

// Types
interface Assignment {
  _id: string
  requesterId: string
  requesterName: string
  requesterRole: string
  type: string
  department: string
  shiftHours: number
  gender: string
  requirements: string
  notes?: string
  offeredAmount?: number
  adminFee?: number
  status: string
  assignedNurseId?: string
  assignedNurseName?: string
  assignedNursePhone?: string
  createdAt: string
}

const DEPARTMENTS = [
  { value: 'ICU', label: 'العناية المركزة', icon: Heart },
  { value: 'Nursing', label: 'تمريض عام', icon: Stethoscope },
  { value: 'Emergency', label: 'طوارئ', icon: Ambulance },
  { value: 'Surgery', label: 'عمليات', icon: Activity },
  { value: 'Care', label: 'رعاية', icon: Users },
  { value: 'Other', label: 'أخرى', icon: Activity },
]

const SHIFT_HOURS = [
  { value: 8, label: '8 ساعات' },
  { value: 12, label: '12 ساعة' },
  { value: 16, label: '16 ساعة' },
  { value: 24, label: '24 ساعة' },
]

const GENDER_OPTIONS = [
  { value: 'any', label: 'أي جنسي' },
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
]

export default function AssignmentSystem() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [form, setForm] = useState({
    type: 'nursing',
    department: 'Nursing',
    shiftHours: 12,
    gender: 'any',
    requirements: '',
    notes: '',
    offeredAmount: 10000,
  })
  const [formErrors, setFormErrors] = useState<string[]>([])

  useEffect(() => {
    const user = localStorage.getItem('aafiatak_user')
    if (user) {
      const parsed = JSON.parse(user)
      setCurrentUser(parsed)
      fetchAssignments(parsed.id, parsed.role)
    }
  }, [])

  const fetchAssignments = async (userId: string, role: string) => {
    try {
      setLoading(true)
      const url = `/api/assignments?userId=${userId}&role=${role}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setAssignments(data.data)
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    
    // Validation errors
    const errors: string[] = []
    if (!form.department) errors.push('يرجى اختيار القسم')
    if (!form.shiftHours) errors.push('يرجى اختيار ساعات العمل')
    if (!form.gender) errors.push('يرجى اختيار الجنس المفضل')
    if (!form.offeredAmount || form.offeredAmount < 5000) errors.push('المبلغ يجب أن يكون 5000 ريال أو أكثر')
    
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }
    
    setFormErrors([])
    setSubmitting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser.id,
          requesterName: currentUser.name,
          requesterRole: currentUser.role,
          ...form,
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setShowForm(false)
        fetchAssignments(currentUser.id, currentUser.role)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelect = async (assignment: Assignment) => {
    if (!currentUser) return
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select',
          assignmentId: assignment._id,
          nurseId: currentUser.id,
          nurseName: currentUser.name,
          nursePhone: currentUser.phone || currentUser.phoneNumber,
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchAssignments(currentUser.id, currentUser.role)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ' })
    } finally {
      setSubmitting(false)
    }
  }

  const getDepartmentIcon = (value: string) => {
    const dept = DEPARTMENTS.find(d => d.value === value)
    const Icon = dept?.icon || Activity
    return <Icon className="w-5 h-5" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      paid: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'بانتظار الموافقة',
      approved: 'متاح',
      assigned: 'م assigned',
      paid: 'مدفوع',
      completed: 'مكتمل',
      cancelled: 'ملغى',
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">التكليفات</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            تكليف جديد
          </button>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-lg mb-4 flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
              <button onClick={() => setMessage({ type: '', text: '' })} className="mr-auto">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignments List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>لا توجد تكليفات حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-card card-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-violet-100 rounded-lg text-violet-600">
                      {getDepartmentIcon(assignment.department)}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {DEPARTMENTS.find(d => d.value === assignment.department)?.label || assignment.department}
                      </h3>
                      <p className="text-sm text-gray-500">{assignment.requesterName}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(assignment.status)}`}>
                    {getStatusLabel(assignment.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{assignment.shiftHours} ساعة</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>
                      {GENDER_OPTIONS.find(g => g.value === assignment.gender)?.label}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{assignment.requirements}</p>

                {assignment.offeredAmount && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-violet-600">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-bold">{assignment.offeredAmount.toLocaleString()}</span>
                    </div>
                    {currentUser?.role === 'nurse' && assignment.status === 'approved' && (
                      <button
                        onClick={() => handleSelect(assignment)}
                        disabled={submitting}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                      >
                        {submitting ? '...' : 'أقبل'}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">تكليف جديد</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Validation Errors */}
                  {formErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <ul className="text-sm text-red-600 space-y-1">
                        {formErrors.map((err, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">القسم <span className="text-red-500">*</span></label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value, type: e.target.value.toLowerCase() })}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                    >
                      <option value="">اختر القسم...</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ساعات العمل <span className="text-red-500">*</span></label>
                    <select
                      value={form.shiftHours}
                      onChange={(e) => setForm({ ...form, shiftHours: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                    >
                      <option value={0}>اختر الساعات...</option>
                      {SHIFT_HOURS.map((shift) => (
                        <option key={shift.value} value={shift.value}>
                          {shift.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الجنس المفضل <span className="text-red-500">*</span></label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                    >
                      {GENDER_OPTIONS.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المطلوبات <span className="text-gray-400 text-xs">(اختياري)</span>
                    </label>
                    <textarea
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      placeholder="أي متطلبات خاصة أو خبرات مطلوبة..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات <span className="text-gray-400 text-xs">(اختياري)</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="أي ملاحظات إضافية..."
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ المعروض (ريال)</label>
                    <input
                      type="number"
                      value={form.offeredAmount}
                      onChange={(e) => setForm({ ...form, offeredAmount: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg input-focus"
                      min={5000}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        إنشاء التكليف
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}