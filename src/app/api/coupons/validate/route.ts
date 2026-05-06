import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'يرجى إدخال كود الكوبون' }, { status: 400 })
    }

    const coupon = await validateCoupon(code.trim().toUpperCase())

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'كوبون غير صالح أو منتهي الصلاحية' }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        expiresAt: coupon.expiresAt,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
