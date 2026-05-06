/**
 * عافيتك — PWA Install Prompt Component
 *
 * Shows an install banner when the app can be installed from the browser.
 * Works on Chrome, Edge, Samsung Internet, and other Chromium browsers.
 * After installation, the app runs as standalone PWA and notifications
 * work perfectly even when the app is closed.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Bell, Volume2, Wifi } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('aafiatak-install-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      // Show again after 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true)
        return
      }
    }

    // Get the stored install prompt from layout.tsx
    const checkForPrompt = () => {
      const stored = (window as any).__aafiatakInstallPrompt
      if (stored) {
        setInstallPrompt(stored)
        // Show banner after a small delay for better UX
        setTimeout(() => setShowBanner(true), 3000)
      }
    }

    checkForPrompt()

    // Listen for the custom event from layout.tsx
    const handleInstallReady = () => {
      checkForPrompt()
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
    }

    window.addEventListener('pwaInstallReady', handleInstallReady)
    window.addEventListener('pwaInstalled', handleInstalled)

    return () => {
      window.removeEventListener('pwaInstallReady', handleInstallReady)
      window.removeEventListener('pwaInstalled', handleInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return
    setIsInstalling(true)

    try {
      await installPrompt.prompt()
      const choiceResult = await installPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted PWA install')
        setIsInstalled(true)
        setShowBanner(false)
      } else {
        console.log('❌ User dismissed PWA install')
      }
    } catch (error) {
      console.error('PWA install error:', error)
    } finally {
      setIsInstalling(false)
      setInstallPrompt(null)
      ;(window as any).__aafiatakInstallPrompt = null
    }
  }, [installPrompt])

  const handleDismiss = useCallback(() => {
    setShowBanner(false)
    setIsDismissed(true)
    localStorage.setItem('aafiatak-install-dismissed', String(Date.now()))
  }, [])

  // Don't render if already installed or no prompt available
  if (isInstalled || (!installPrompt && !showBanner)) return null

  return (
    <AnimatePresence>
      {showBanner && !isDismissed && installPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-l from-rose-500 to-pink-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">تثبيت التطبيق</span>
              </div>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              <p className="text-sm text-gray-700 font-medium mb-3">
                ثبّت <span className="text-rose-600 font-bold">عافيتك</span> على جهازك للحصول على:
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">إشعارات فورية</p>
                    <p className="text-[10px] text-gray-500">حتى عند إغلاق المتصفح</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">إشعارات صوتية</p>
                    <p className="text-[10px] text-gray-500">تنبيه صوتي تلقائي لكل إشعار</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">وصول سريع</p>
                    <p className="text-[10px] text-gray-500">أيقونة على الشاشة الرئيسية</p>
                  </div>
                </div>
              </div>

              {/* Install Button */}
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full py-3 bg-gradient-to-l from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isInstalling ? 'جارٍ التثبيت...' : 'تثبيت التطبيق الآن'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
