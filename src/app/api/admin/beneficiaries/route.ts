import { NextResponse } from 'next/server'
import { getAllBeneficiaries } from '@/lib/firestore'

export async function GET() {
  try {
    const beneficiaries = await getAllBeneficiaries()
    return NextResponse.json(beneficiaries)
  } catch (error: any) {
    console.error('Get beneficiaries error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
