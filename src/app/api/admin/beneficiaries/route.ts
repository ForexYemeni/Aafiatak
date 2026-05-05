import { NextResponse } from 'next/server'
import { firebaseInitialized } from '@/lib/firebase-admin'
import { getAllBeneficiaries } from '@/lib/firestore'

export async function GET() {
  try {
    if (!firebaseInitialized) {
      return NextResponse.json({ error: 'Firebase غير متصل' }, { status: 500 })
    }

    const beneficiaries = await getAllBeneficiaries()
    return NextResponse.json(beneficiaries)
  } catch (error: any) {
    console.error('Get beneficiaries error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
