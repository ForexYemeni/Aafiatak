import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentMethod, deletePaymentMethod } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    await connectToDatabase()
    const PaymentMethod = mongoose.models.PaymentMethod

    const existing = PaymentMethod ? await PaymentMethod.findById(id).lean() : null
    if (!existing) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    // Only update fields that are provided
    const allowedFields = ['type', 'name', 'accountName', 'accountNumber', 'bankName', 'exchangeName', 'walletType', 'instructions', 'isActive']
    const updateData: Record<string, any> = { updatedAt: new Date() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updated = await updatePaymentMethod(id, updateData)

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update payment method error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await connectToDatabase()
    const PaymentMethod = mongoose.models.PaymentMethod

    const existing = PaymentMethod ? await PaymentMethod.findById(id).lean() : null
    if (!existing) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    await deletePaymentMethod(id)
    return NextResponse.json({ message: 'تم حذف طريقة الدفع بنجاح' })
  } catch (error: any) {
    console.error('Delete payment method error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
