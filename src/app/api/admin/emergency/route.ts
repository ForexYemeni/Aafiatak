import { NextRequest, NextResponse } from 'next/server'
import { getEmergencyRequests, updateEmergencyRequest, getEmergencyRequestById, getNurseById, createEmergencyAssignment } from '@/lib/firestore'

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
    const { id, status, nurseId } = body

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
      await updateEmergencyRequest(id, { status: status || 'in_progress', nurseId, nurseName: `${nurse.firstName} ${nurse.lastName}` })

      return NextResponse.json({ ...assignment, nurse: { id: nurse.id, firstName: nurse.firstName, lastName: nurse.lastName } })
    }

    // Simple status update
    if (!status) {
      return NextResponse.json({ error: 'الحالة مطلوبة' }, { status: 400 })
    }

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const updated = await updateEmergencyRequest(id, { status })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Update emergency request error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
