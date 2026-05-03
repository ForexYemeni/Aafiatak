import { NextRequest, NextResponse } from 'next/server'
import { getAllCoupons, createCoupon } from '@/lib/firestore'

export async function GET() {
  try {
    const coupons = await getAllCoupons()
    return NextResponse.json(coupons)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, discountPercent, maxUses, expiresAt, isActive } = body

    if (!code || !discountPercent || !maxUses || !expiresAt) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    if (discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ error: 'نسبة الخصم يجب أن تكون بين 1 و 100' }, { status: 400 })
    }

    const coupon = await createCoupon({
      code: code.toUpperCase().trim(),
      discountPercent: Number(discountPercent),
      maxUses: Number(maxUses),
      expiresAt,
      isActive: isActive !== false,
    })

    return NextResponse.json(coupon)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
