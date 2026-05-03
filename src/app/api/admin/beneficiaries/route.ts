import { NextResponse } from 'next/server'
import { firestore, firebaseInitialized } from '@/lib/firebase-admin'

export async function GET() {
  try {
    if (!firebaseInitialized || !firestore) {
      return NextResponse.json({ error: 'Firebase غير متصل' }, { status: 500 })
    }

    const snapshot = await firestore.collection('beneficiaries').orderBy('createdAt', 'desc').get()
    const beneficiaries = snapshot.docs.map(doc => {
      const data = doc.data()
      // Remove password from response
      const { password, ...rest } = data
      return { id: doc.id, ...rest }
    })

    return NextResponse.json(beneficiaries)
  } catch (error: any) {
    console.error('Get beneficiaries error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
