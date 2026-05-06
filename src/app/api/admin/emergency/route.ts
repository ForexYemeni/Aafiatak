import { NextRequest, NextResponse } from 'next/server'
import { getEmergencyRequests, updateEmergencyRequest, getEmergencyRequestById, getNurseById, createEmergencyAssignment } from '@/lib/firestore'
import { notifyNurseServer, notifyBeneficiaryServer, notifyAdminServer } from '@/lib/server-notifications'

export async function GET() {
  try {
    const requests = await getEmergencyRequests()
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Get emergency requests error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, nurseId, adminNotes, handledBy } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 })
    }

    // If nurseId is provided, assign nurse to emergency request
    if (nurseId) {
      const nurse = await getNurseById(nurseId)
      if (!nurse || nurse.status !== 'approved') {
        return NextResponse.json({ error: 'الممرض غير موجود أو غير معتمد' }, { status: 400 })
      }

      // Create emergency assignment
      const assignment = await createEmergencyAssignment({
        emergencyRequestId: id,
        nurseId,
        status: 'assigned',
      })

      // Update emergency request status
      const nurseName = `${nurse.firstName || ''} ${nurse.lastName || ''}`
      const updateData: Record<string, any> = { status: status || 'in_progress', nurseId, nurseName }
      if (adminNotes) updateData.adminNotes = adminNotes
      await updateEmergencyRequest(id, updateData)

      // ─── Send push notifications ───
      // Get emergency request to find beneficiary info
      const emergencyReq = await getEmergencyRequestById(id)
      const beneficiaryId = emergencyReq?.beneficiaryId || (emergencyReq?.beneficiary as any)?.id
      const beneficiaryName = emergencyReq?.beneficiaryName || (emergencyReq?.beneficiary as any)?.name || 'مستفيد'

      // Notify the nurse about emergency assignment
      notifyNurseServer.emergencyAssignment(nurseId, beneficiaryName, id).catch(() => {})

      // Notify the beneficiary that help is on the way
      if (beneficiaryId) {
        notifyBeneficiaryServer.emergencyAccepted(beneficiaryId, nurseName).catch(() => {})
      }

      return NextResponse.json({ ...assignment, nurse: { id: nurse.id, firstName: nurse.firstName, lastName: nurse.lastName } })
    }

    // Simple status update
    if (!status) {
      return NextResponse.json({ error: 'الحالة مطلوبة' }, { status: 400 })
    }

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const updateData: Record<string, any> = { status }
    if (adminNotes) updateData.adminNotes = adminNotes
    if (handledBy) updateData.handledBy = handledBy
    const updated = await updateEmergencyRequest(id, updateData)

    // ─── Send push notifications for status changes ───
    const emergencyReq = await getEmergencyRequestById(id)
    const beneficiaryId = emergencyReq?.beneficiaryId || (emergencyReq?.beneficiary as any)?.id

    if (status === 'completed' && beneficiaryId) {
      notifyBeneficiaryServer.emergencyCompleted(beneficiaryId).catch(() => {})
    } else if (status === 'rejected' && beneficiaryId) {
      notifyBeneficiaryServer.orderRejected(beneficiaryId, adminNotes || 'تم رفض طلب الطوارئ').catch(() => {})
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update emergency request error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
