import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, getAssignmentByRequestId, getNurseById, createAssignment } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, nurseId } = body

    if (!requestId || !nurseId) {
      return NextResponse.json({ error: 'معرف الطلب ومعرف الممرض مطلوبان' }, { status: 400 })
    }

    const serviceRequest = await getServiceRequestById(requestId)
    if (!serviceRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    if (serviceRequest.status !== 'approved') {
      return NextResponse.json({ error: 'يجب أن يكون الطلب مقبولاً أولاً' }, { status: 400 })
    }

    // Check if this nurse has previously rejected this request
    const rejectedNurses = serviceRequest.rejectedNurses || []
    const hasRejected = rejectedNurses.some((rn: any) => rn.nurseId === nurseId)
    if (hasRejected) {
      const nurseInfo = rejectedNurses.find((rn: any) => rn.nurseId === nurseId)
      return NextResponse.json({
        error: `الممرض "${nurseInfo?.nurseName || ''}" رفض هذا الطلب سابقاً بسبب: "${nurseInfo?.reason || 'غير محدد'}". لا يمكن تعيين نفس الممرض مرة أخرى.`
      }, { status: 400 })
    }

    const existingAssignment = await getAssignmentByRequestId(requestId)
    if (existingAssignment) {
      return NextResponse.json({ error: 'تم تعيين ممرض لهذا الطلب بالفعل' }, { status: 400 })
    }

    const nurse = await getNurseById(nurseId)
    if (!nurse || nurse.status !== 'approved') {
      return NextResponse.json({ error: 'الممرض غير موجود أو غير معتمد' }, { status: 400 })
    }

    const assignment = await createAssignment({
      requestId,
      nurseId,
      status: 'assigned',
    })

    // Clear assignmentRejection info from request since we're reassigning
    if (serviceRequest.assignmentRejection) {
      await connectToDatabase()
      const ServiceRequest = mongoose.models.ServiceRequest
      if (ServiceRequest) {
        await ServiceRequest.findByIdAndUpdate(requestId, {
          $unset: { assignmentRejection: '' },
          updatedAt: new Date(),
        })
      }
    }

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
