import { NextRequest, NextResponse } from 'next/server'
import { getAllPaymentMethods, createPaymentMethod } from '@/lib/firestore'

export async function GET() {
  try {
    const payments = await getAllPaymentMethods()
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, accountInfo, isActive } = body

    if (!name || !accountInfo) {
      return NextResponse.json({ error: 'الاسم ومعلومات الحساب مطلوبان' }, { status: 400 })
    }

    const payment = await createPaymentMethod({
      name,
      accountInfo,
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
