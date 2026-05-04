import { NextResponse } from 'next/server'
import { firestore, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  try {
    if (!firebaseInitialized || !firestore) {
      throw new Error(initializationError || 'Firebase غير مهيأ')
    }

    // Fetch all payment methods without composite index requirement
    const snapshot = await firestore.collection('paymentMethods').get()

    // Filter active methods and sort in memory to avoid needing composite index
    const methods = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.isActive === true)
      .sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      })

    return NextResponse.json(methods)
  } catch (error: any) {
    console.error('Get active payment methods error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
