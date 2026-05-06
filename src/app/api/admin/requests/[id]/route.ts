import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, updateServiceRequest } from '@/lib/firestore'
import { notifyBeneficiaryServer, notifyNurseServer } from '@/lib/server-notifications'

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

    // ─── Send push notifications based on status change ───
    const beneficiaryId = existing.beneficiaryId || (existing.beneficiary as any)?.id
    const nurseId = existing.nurseId || (existing.assignedNurse as any)?.id

    if (status) {
      if (status === 'approved' && beneficiaryId) {
        notifyBeneficiaryServer.orderApproved(beneficiaryId, id).catch(() => {})
      } else if (status === 'rejected' && beneficiaryId) {
        notifyBeneficiaryServer.orderRejected(beneficiaryId, adminNotes || 'لم يتم تحديد السبب').catch(() => {})
      } else if (status === 'in_progress' && beneficiaryId) {
        notifyBeneficiaryServer.orderInProgress(beneficiaryId, id).catch(() => {})
      } else if (status === 'completed' && beneficiaryId) {
        notifyBeneficiaryServer.orderCompleted(beneficiaryId, id).catch(() => {})
      } else if (status === 'cancelled') {
        // Notify both beneficiary and nurse about cancellation
        if (beneficiaryId) {
          notifyBeneficiaryServer.orderRejected(beneficiaryId, adminNotes || 'تم إلغاء الطلب').catch(() => {})
        }
        if (nurseId) {
          const serviceName = existing.service?.name || existing.services?.[0]?.name || 'الخدمة'
          notifyNurseServer.assignmentCancelled(nurseId, serviceName).catch(() => {})
        }
      }
    }

    // Notify beneficiary about payment status changes
    if (paymentStatus && beneficiaryId) {
      if (paymentStatus === 'paid') {
        notifyBeneficiaryServer.paymentConfirmed(beneficiaryId, id).catch(() => {})
      } else if (paymentStatus === 'rejected') {
        notifyBeneficiaryServer.paymentRejected(beneficiaryId, id).catch(() => {})
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
