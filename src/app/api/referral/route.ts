import { NextRequest, NextResponse } from 'next/server'
import { generateReferralCode, getReferralByBeneficiary, applyReferralCode } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    // Get existing referral code or generate one
    let referral = await getReferralByBeneficiary(beneficiaryId)
    if (!referral) {
      referral = await generateReferralCode(beneficiaryId)
    }

    return NextResponse.json(referral)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, beneficiaryId } = body

    if (!code || !beneficiaryId) {
      return NextResponse.json({ error: 'يرجى إدخال كود الإحالة ومعرف المستفيد' }, { status: 400 })
    }

    const result = await applyReferralCode(code.trim().toUpperCase(), beneficiaryId)

    if (!result) {
      return NextResponse.json({ error: 'كود الإحالة غير صالح' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'تم تطبيق كود الإحالة بنجاح! حصلت على 25 نقطة مكافأة', referral: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
