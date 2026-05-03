import { NextRequest, NextResponse } from 'next/server'
import { getPaymentMethodById, updatePaymentMethod, deletePaymentMethod } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, accountInfo, isActive } = body

    const existing = await getPaymentMethodById(id)
    if (!existing) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (accountInfo !== undefined) updateData.accountInfo = accountInfo
    if (isActive !== undefined) updateData.isActive = isActive

    const payment = await updatePaymentMethod(id, updateData)

    return NextResponse.json(payment)
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

    const existing = await getPaymentMethodById(id)
    if (!existing) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    await deletePaymentMethod(id)
    return NextResponse.json({ message: 'تم حذف طريقة الدفع بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
