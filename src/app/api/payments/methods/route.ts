import { NextResponse } from 'next/server'
import { firestore, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  try {
    if (!firebaseInitialized || !firestore) {
      throw new Error(initializationError || 'Firebase غير مهيأ')
    }

    const snapshot = await firestore.collection('paymentMethods')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get()

    const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(methods)
  } catch (error: any) {
    console.error('Get active payment methods error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
