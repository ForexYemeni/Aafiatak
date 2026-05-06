import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'
import { notifyBeneficiaryServer, notifyAdminServer, notifyNurseServer } from '@/lib/server-notifications'

function docToObject(doc: any) {
  if (!doc) return null
  const obj = doc.toObject ? doc.toObject() : doc
  const { _id, __v, ...rest } = obj
  return { id: _id.toString(), ...rest }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignmentId, nurseId, action, rejectionReason } = body

    if (!assignmentId || !nurseId || !action) {
      return NextResponse.json({ error: 'معرف التعيين والممرض والإجراء مطلوبون' }, { status: 400 })
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'الإجراء يجب أن يكون accept أو reject' }, { status: 400 })
    }

    // Require rejection reason when rejecting
    if (action === 'reject' && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json({ error: 'يرجى إدخال سبب الرفض' }, { status: 400 })
    }

    await connectToDatabase()
    const ServiceAssignment = mongoose.models.ServiceAssignment
    const ServiceRequest = mongoose.models.ServiceRequest
    const Nurse = mongoose.models.Nurse

    // Fetch assignment
    const assignmentDoc = ServiceAssignment ? await ServiceAssignment.findById(assignmentId).lean() : null
    if (!assignmentDoc) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    // Verify this assignment belongs to the nurse
    if (assignmentDoc.nurseId !== nurseId) {
      return NextResponse.json({ error: 'هذا التعيين لا ينتمي لهذا الممرض' }, { status: 403 })
    }

    // Check assignment is in a valid state for accept/reject
    if (assignmentDoc.status !== 'assigned' && assignmentDoc.status !== 'pending') {
      return NextResponse.json({ error: `لا يمكن تغيير حالة التعيين الحالية: ${assignmentDoc.status}` }, { status: 400 })
    }

    // Verify nurse exists and is approved
    const nurseDoc = Nurse ? await Nurse.findById(nurseId).lean() : null
    if (!nurseDoc) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const nurseName = `${nurseDoc.firstName || ''} ${nurseDoc.lastName || ''}`.trim()
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'

    // Update assignment status
    const updateData: Record<string, any> = {
      status: newStatus,
      respondedAt: new Date(),
      updatedAt: new Date(),
    }

    // Save rejection reason if rejecting
    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason.trim()
      updateData.rejectedAt = new Date()
    }

    if (ServiceAssignment) {
      await ServiceAssignment.findByIdAndUpdate(assignmentId, updateData)
    }

    // If accepted, also update the service request status
    if (action === 'accept' && assignmentDoc.requestId) {
      if (ServiceRequest) {
        await ServiceRequest.findByIdAndUpdate(assignmentDoc.requestId, {
          status: 'in_progress',
          updatedAt: new Date(),
        })
      }

      // ─── Notify beneficiary that nurse accepted ───
      const requestDoc = ServiceRequest ? await ServiceRequest.findById(assignmentDoc.requestId).lean() : null
      const beneficiaryId = requestDoc?.beneficiaryId
      if (beneficiaryId) {
        notifyBeneficiaryServer.assignmentAccepted(beneficiaryId, nurseName, assignmentDoc.requestId.toString()).catch(() => {})
      }

      // ─── Notify admins that nurse accepted task ───
      const serviceName = requestDoc?.services?.[0]?.name || requestDoc?.service?.name || 'خدمة'
      notifyAdminServer.nurseAcceptedTask(nurseName, serviceName).catch(() => {})
    }

    // If rejected, update the service request to allow reassignment and store rejection info
    if (action === 'reject' && assignmentDoc.requestId) {
      // Get existing rejected nurses list
      const requestDoc = ServiceRequest ? await ServiceRequest.findById(assignmentDoc.requestId).lean() : null
      const rejectedNurses = requestDoc?.rejectedNurses || []

      // Add this nurse to the rejected list if not already there
      if (!rejectedNurses.some((rn: any) => rn.nurseId === nurseId)) {
        rejectedNurses.push({
          nurseId,
          nurseName,
          reason: rejectionReason.trim(),
          rejectedAt: new Date().toISOString(),
        })
      }

      if (ServiceRequest) {
        await ServiceRequest.findByIdAndUpdate(assignmentDoc.requestId, {
          status: 'approved', // Reset back to approved so admin can reassign
          rejectedNurses,
          assignmentRejection: {
            nurseId,
            nurseName,
            reason: rejectionReason.trim(),
            rejectedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
      }

      // ─── Notify admins that nurse rejected task ───
      notifyAdminServer.nurseRejectedTask(nurseName, rejectionReason.trim()).catch(() => {})

      // ─── Notify beneficiary about reassignment ───
      const beneficiaryId = requestDoc?.beneficiaryId
      if (beneficiaryId) {
        notifyBeneficiaryServer.assignmentRejectedByNurse(beneficiaryId, assignmentDoc.requestId.toString()).catch(() => {})
      }
    }

    // Fetch updated assignment
    const updatedDoc = ServiceAssignment ? await ServiceAssignment.findById(assignmentId).lean() : null
    const updatedAssignment = updatedDoc ? docToObject(updatedDoc) : null

    return NextResponse.json({
      ...updatedAssignment,
      message: action === 'accept' ? 'تم قبول التعيين بنجاح' : 'تم رفض التعيين',
    })
  } catch (error: any) {
    console.error('Accept/reject assignment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
