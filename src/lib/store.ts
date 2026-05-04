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
  phone?: string
  role?: string
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

interface AppState {
  currentView: AppView
  user: AppUser | null
  userType: 'admin' | 'nurse' | 'beneficiary' | null
  setUser: (user: AppUser | null, type: 'admin' | 'nurse' | 'beneficiary' | null) => void
  setView: (view: AppView) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  user: null,
  userType: null,
  setUser: (user, type) => set({ user, userType: type }),
  setView: (view) => set({ currentView: view }),
  logout: () => set({ user: null, userType: null, currentView: 'landing' }),
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
    blocked: 'محظور',
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
  }
  return map[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}
