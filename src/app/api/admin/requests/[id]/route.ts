import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, updateServiceRequest } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNotes, paymentStatus, handledBy } = body

    if (!status && !paymentStatus && !adminNotes && !handledBy) {
      return NextResponse.json({ error: 'يجب توفير حقل واحد على الأقل للتحديث' }, { status: 400 })
    }

    const existing = await getServiceRequestById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (status) {
      if (!['approved', 'rejected', 'pending', 'pending_confirmation', 'pending_payment', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
      }
      updateData.status = status
    }
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (handledBy) updateData.handledBy = handledBy

    const updated = await updateServiceRequest(id, updateData)

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
