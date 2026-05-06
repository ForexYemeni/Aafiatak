import { NextRequest, NextResponse } from 'next/server'
import { getLoyaltyPoints, redeemLoyaltyPoints, getLoyaltyBalance, addLoyaltyPoints } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const [balance, history] = await Promise.all([
      getLoyaltyBalance(beneficiaryId),
      getLoyaltyPoints(beneficiaryId),
    ])

    return NextResponse.json({ balance, history })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, points, action } = body

    if (!beneficiaryId || !points) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    if (action === 'redeem') {
      if (points < 100) {
        return NextResponse.json({ error: 'الحد الأدنى للاستبدال 100 نقطة' }, { status: 400 })
      }
      const result = await redeemLoyaltyPoints(beneficiaryId, Number(points))
      return NextResponse.json(result)
    }

    // Default: add points (admin action)
    const result = await addLoyaltyPoints(beneficiaryId, Number(points), body.reason || 'إضافة نقاط')
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
