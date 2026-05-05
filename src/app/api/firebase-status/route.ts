import { NextResponse } from 'next/server'
import { firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  // Basic check: is the SDK initialized?
  if (!firebaseInitialized) {
    return NextResponse.json({
      connected: false,
      error: initializationError || 'Firebase غير مهيأ',
    })
  }

  // Try a lightweight Firestore read to verify the database actually works
  // Use a minimal document fetch to reduce quota usage
  try {
    const { firestore } = await import('@/lib/firebase-admin')
    // Try to read from a dedicated health check document (single doc read = 1 operation vs collection query)
    try {
      await firestore.collection('_health_check').doc('ping').get()
    } catch {
      // If health check doc doesn't exist, try listing admins (which will be queried anyway)
      await firestore.collection('admins').select('username').limit(1).get()
    }
    return NextResponse.json({ connected: true, error: null })
  } catch (error: any) {
    const msg = error.message || ''
    const code = error.code || ''
    
    // Check for Firestore quota exceeded (Spark free plan limit)
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded') || code === '8') {
      return NextResponse.json({
        connected: false,
        error: 'تم تجاوز الحصة المجانية لقاعدة البيانات. يرجى الترقية إلى خطة Blaze في Firebase Console.',
        isQuotaExceeded: true,
      })
    }
    
    if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used')) {
      return NextResponse.json({
        connected: false,
        error: 'يجب تفعيل Firestore Database من Firebase Console مع اختيار Test Mode',
      })
    }
    // SDK initialized but Firestore might have issues
    return NextResponse.json({
      connected: false,
      error: `خطأ في الاتصال بقاعدة البيانات: ${msg.substring(0, 100)}`,
    })
  }
}
