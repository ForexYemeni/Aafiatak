import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const beneficiary = await getBeneficiaryById(beneficiaryId)

    if (!beneficiary) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Remove password from response
    const { password, ...safeBeneficiary } = beneficiary as any

    return NextResponse.json(safeBeneficiary)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
