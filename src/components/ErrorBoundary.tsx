'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  handleClearData = () => {
    try {
      // Clear all localStorage keys including Zustand persisted state
      localStorage.removeItem('aafiatak-session')
      localStorage.clear()
      // Also clear sessionStorage
      sessionStorage.clear()
    } catch {}
    this.setState({ hasError: false, error: null })
    // Use replace to avoid back-button issues
    window.location.replace('/')
  }

  render() {
    if (this.state.hasError) {
      const isInitError = this.state.error?.message?.includes('before initialization') ||
        this.state.error?.message?.includes('Cannot access')

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20 p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-violet-100 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center"
            >
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </motion.div>

            <h1 className="text-2xl font-black text-slate-800 mb-3">
              حدث خطأ غير متوقع
            </h1>

            <p className="text-slate-500 mb-2 leading-relaxed">
              نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>

            {this.state.error && (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 mb-6 font-mono break-all max-h-24 overflow-y-auto" dir="ltr">
                {this.state.error.message}
              </p>
            )}

            {isInitError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-right">
                <p className="text-xs text-amber-700 font-bold mb-1">💡 نصيحة:</p>
                <p className="text-xs text-amber-600">
                  إذا استمر الخطأ، جرب مسح بيانات التطبيق المخزنة مؤقتاً ثم أعد تحميل الصفحة.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                العودة للرئيسية
              </button>

              {isInitError && (
                <button
                  onClick={this.handleClearData}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح البيانات
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
