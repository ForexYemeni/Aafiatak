'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppView =
  | 'landing'
  | 'admin-dashboard'
  | 'admin-change-password'
  | 'firebase-setup'
  | 'nurse-dashboard'
  | 'beneficiary-dashboard'

interface AdminUser {
  id: string
  username?: string
  name: string
  phone?: string
  role?: 'admin' | 'sub-admin'
  adminId?: string
  permissions?: Record<string, boolean>
  mustChangePassword?: boolean
}

interface NurseUser {
  id: string
  firstName: string
  secondName: string
  thirdName: string
  lastName: string
  phone: string
  location: string
  nationalId: string
  licenseNumber: string
  licenseExpiryDate: string
  status: string
  photoUrl?: string
  licensePhotoUrl?: string
  nationalIdPhotoUrl?: string
  isVerified?: boolean
  portfolio?: NursePortfolio
  favoriteBeneficiaryIds?: string[]
}

interface NursePortfolio {
  bio?: string
  experience?: number
  specializations?: string[]
  certifications?: string[]
  workPhotos?: string[]
  completedCases?: number
}

interface BeneficiaryUser {
  id: string
  name: string
  phone: string
  location: string
  favoriteNurseId?: string
}

type AppUser = AdminUser | NurseUser | BeneficiaryUser

interface PushNotification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'admin' | 'system' | 'reminder' | 'emergency' | 'payment' | 'rating' | 'chat'
  read: boolean
  createdAt: string
  requestId?: string
  link?: string
  metadata?: Record<string, any>
}

interface AppState {
  currentView: AppView
  user: AppUser | null
  userType: 'admin' | 'nurse' | 'beneficiary' | null
  darkMode: boolean
  notifications: PushNotification[]
  // Actions
  setUser: (user: AppUser | null, type: 'admin' | 'nurse' | 'beneficiary' | null) => void
  setView: (view: AppView) => void
  logout: () => void
  toggleDarkMode: () => void
  setDarkMode: (mode: boolean) => void
  addNotification: (notification: Omit<PushNotification, 'id'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      user: null,
      userType: null,
      darkMode: false,
      notifications: [],
      setUser: (user, type) => set({ user, userType: type }),
      setView: (view) => set({ currentView: view }),
      logout: () => set({ user: null, userType: null, currentView: 'landing', notifications: [] }),
      toggleDarkMode: () => set((state) => {
        const newMode = !state.darkMode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', newMode)
        }
        return { darkMode: newMode }
      }),
      setDarkMode: (mode) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', mode)
        }
        set({ darkMode: mode })
      },
      addNotification: (notification) => set((state) => ({
        notifications: [
          { ...notification, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          ...state.notifications,
        ].slice(0, 100) // Keep max 100 notifications
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'aafiatak-session',
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        currentView: state.currentView,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode && typeof document !== 'undefined') {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)

export function formatPrice(price: number): string {
  return price.toLocaleString('ar-YE') + ' ر.ي'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'قيد الانتظار',
    approved: 'مقبول',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    assigned: 'معيّن',
    in_progress: 'قيد التنفيذ',
    new: 'جديد',
    active: 'نشط',
    suspended: 'معلّق',
    blocked: 'محظور',
    scheduled: 'مجدول',
    rescheduled: 'معاد جدولته',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    refunded: 'مسترجع',
    open: 'مفتوح',
    closed: 'مغلق',
    resolved: 'تم الحل',
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    assigned: 'bg-purple-100 text-purple-800 border-purple-300',
    in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
    new: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    active: 'bg-green-100 text-green-800 border-green-300',
    suspended: 'bg-amber-100 text-amber-800 border-amber-300',
    blocked: 'bg-red-200 text-red-900 border-red-400',
    scheduled: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    rescheduled: 'bg-teal-100 text-teal-800 border-teal-300',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    unpaid: 'bg-red-100 text-red-800 border-red-300',
    refunded: 'bg-amber-100 text-amber-800 border-amber-300',
    open: 'bg-blue-100 text-blue-800 border-blue-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  }
  return map[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}

export type { PushNotification, NursePortfolio, NurseUser, BeneficiaryUser, AdminUser }
