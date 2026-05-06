'use client'

import { useAppStore } from '@/lib/store'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useAppStore()

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
      whileTap={{ scale: 0.9 }}
      aria-label={darkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0, scale: darkMode ? 0 : 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute"
      >
        <Sun className="w-5 h-5 text-amber-500" />
      </motion.div>

      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 0 : -180, scale: darkMode ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute"
      >
        <Moon className="w-5 h-5 text-blue-300" />
      </motion.div>
    </motion.button>
  )
}
