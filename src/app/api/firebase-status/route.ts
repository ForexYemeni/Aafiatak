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
  try {
    const { firestore } = await import('@/lib/firebase-admin')
    // Try to read from a system collection (just check connectivity)
    await firestore.collection('_health_check').limit(1).get()
    return NextResponse.json({ connected: true, error: null })
  } catch (error: any) {
    const msg = error.message || ''
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
