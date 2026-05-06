'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore, type AppView } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import LandingPage from '@/components/LandingPage'
import AdminDashboard from '@/components/AdminDashboard'
import AdminChangePassword from '@/components/AdminChangePassword'
import FirebaseSetup from '@/components/FirebaseSetup'
import NurseDashboard from '@/components/NurseDashboard'
import BeneficiaryDashboard from '@/components/BeneficiaryDashboard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { usePushNotifications } from '@/hooks/use-notifications'

const viewComponents: Record<AppView, React.ComponentType> = {
  landing: LandingPage,
  'admin-dashboard': AdminDashboard,
  'admin-change-password': AdminChangePassword,
  'firebase-setup': FirebaseSetup,
  'nurse-dashboard': NurseDashboard,
  'beneficiary-dashboard': BeneficiaryDashboard,
}

// ─── Pull-to-Refresh Component ───
function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // Reload the current page data by forcing a re-render
    setTimeout(() => {
      setRefreshing(false)
      setPullDistance(0)
      setPulling(false)
      // Force a soft refresh of the page content
      window.dispatchEvent(new CustomEvent('app-refresh'))
    }, 800)
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) {
      setPulling(false)
      setPullDistance(0)
      return
    }
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      // Apply resistance so it's harder to pull
      const resisted = Math.min(diff * 0.4, 100)
      setPullDistance(resisted)
    }
  }, [pulling, refreshing])

  const onTouchEnd = useCallback(() => {
    if (pullDistance >= 60) {
      handleRefresh()
    } else {
      setPullDistance(0)
      setPulling(false)
    }
  }, [pullDistance, handleRefresh])

  const pullOpacity = Math.min(pullDistance / 60, 1)
  const pullRotation = pullDistance * 2

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto overscroll-y-contain"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      {(pulling || refreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            height: refreshing ? 50 : pullDistance,
            opacity: pullOpacity,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <RefreshCw
              className={`w-5 h-5 text-violet-500 ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${refreshing ? 0 : pullRotation}deg)` }}
            />
            <span className="text-[10px] font-bold text-violet-400">
              {refreshing ? 'جارٍ التحديث...' : pullDistance >= 60 ? 'حرر للتحديث' : 'اسحب للتحديث'}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

export default function Home() {
  const { currentView } = useAppStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const Component = viewComponents[currentView]

  // ─── Initialize push notifications (works even when app is closed) ───
  usePushNotifications()

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshEvent = () => {
      setRefreshKey(k => k + 1)
    }
    window.addEventListener('app-refresh', handleRefreshEvent)
    return () => window.removeEventListener('app-refresh', handleRefreshEvent)
  }, [])

  return (
    <ErrorBoundary>
      <PullToRefresh>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentView}-${refreshKey}`}
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
      </PullToRefresh>
    </ErrorBoundary>
  )
}
