'use client'

import { create } from 'zustand'

export type AppView =
  | 'landing'
  | 'admin-dashboard'
  | 'admin-change-password'
  | 'firebase-setup'
  | 'nurse-dashboard'
  | 'beneficiary-dashboard'

interface AdminUser {
  id: string
  username: string
  name: string
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
}

interface BeneficiaryUser {
  id: string
  name: string
  phone: string
  location: string
}

type AppUser = AdminUser | NurseUser | BeneficiaryUser

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
  } catch {
    // localStorage unavailable
  }
  return false
}

function applyDarkClass(darkMode: boolean): void {
  if (typeof document === 'undefined') return
  try {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch {
    // document unavailable
  }
}

interface AppState {
  currentView: AppView
  user: AppUser | null
  userType: 'admin' | 'nurse' | 'beneficiary' | null
  darkMode: boolean
  setUser: (user: AppUser | null, type: 'admin' | 'nurse' | 'beneficiary' | null) => void
  setView: (view: AppView) => void
  logout: () => void
  toggleDarkMode: () => void
}

const initialDarkMode = getInitialDarkMode()
applyDarkClass(initialDarkMode)

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'landing',
  user: null,
  userType: null,
  darkMode: initialDarkMode,
  setUser: (user, type) => set({ user, userType: type }),
  setView: (view) => set({ currentView: view }),
  logout: () => set({ user: null, userType: null, currentView: 'landing' }),
  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode
    try {
      localStorage.setItem('darkMode', String(newDarkMode))
    } catch {
      // localStorage unavailable
    }
    applyDarkClass(newDarkMode)
    set({ darkMode: newDarkMode })
  },
}))

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
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800',
    rejected: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
    completed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    assigned: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800',
    in_progress: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
    new: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-800',
    active: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800',
    suspended: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
}
