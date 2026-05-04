import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkFirebase()
    const { id } = await params
    const body = await request.json()

    const existing = await firestore.collection('paymentMethods').doc(id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    const updateData: Record<string, any> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() }

    // Only update fields that are provided
    const allowedFields = ['type', 'name', 'accountName', 'accountNumber', 'bankName', 'exchangeName', 'walletType', 'instructions', 'isActive']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    await firestore.collection('paymentMethods').doc(id).update(updateData)

    const updated = await firestore.collection('paymentMethods').doc(id).get()
    return NextResponse.json({ id: updated.id, ...updated.data() })
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
    checkFirebase()
    const { id } = await params

    const existing = await firestore.collection('paymentMethods').doc(id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'طريقة الدفع غير موجودة' }, { status: 404 })
    }

    await firestore.collection('paymentMethods').doc(id).delete()
    return NextResponse.json({ message: 'تم حذف طريقة الدفع بنجاح' })
  } catch (error: any) {
    console.error('Delete payment method error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
