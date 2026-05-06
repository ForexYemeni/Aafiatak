import { NextRequest, NextResponse } from 'next/server'
import { getEmergencyRequestsByBeneficiary } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const requests = await getEmergencyRequestsByBeneficiary(beneficiaryId)
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Get beneficiary emergency requests error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
