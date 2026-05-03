'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from '@/components/LandingPage'
import AdminLogin from '@/components/AdminLogin'
import AdminDashboard from '@/components/AdminDashboard'
import AdminChangePassword from '@/components/AdminChangePassword'
import FirebaseSetup from '@/components/FirebaseSetup'
import NurseLogin from '@/components/NurseLogin'
import NurseRegister from '@/components/NurseRegister'
import NurseDashboard from '@/components/NurseDashboard'
import BeneficiaryLogin from '@/components/BeneficiaryLogin'
import BeneficiaryRegister from '@/components/BeneficiaryRegister'
import BeneficiaryDashboard from '@/components/BeneficiaryDashboard'

const viewComponents: Record<AppView, React.ComponentType> = {
  landing: LandingPage,
  'admin-login': AdminLogin,
  'admin-dashboard': AdminDashboard,
  'admin-change-password': AdminChangePassword,
  'firebase-setup': FirebaseSetup,
  'nurse-login': NurseLogin,
  'nurse-register': NurseRegister,
  'nurse-dashboard': NurseDashboard,
  'beneficiary-login': BeneficiaryLogin,
  'beneficiary-register': BeneficiaryRegister,
  'beneficiary-dashboard': BeneficiaryDashboard,
}

export default function Home() {
  const { currentView } = useAppStore()
  const Component = viewComponents[currentView]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
        dir="rtl"
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  )
}
