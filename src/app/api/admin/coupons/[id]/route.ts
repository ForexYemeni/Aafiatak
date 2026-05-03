import { NextRequest, NextResponse } from 'next/server'
import { updateCoupon, deleteCoupon, getCouponById } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await getCouponById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الكوبون غير موجود' }, { status: 404 })
    }

    const updated = await updateCoupon(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await getCouponById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الكوبون غير موجود' }, { status: 404 })
    }

    await deleteCoupon(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
