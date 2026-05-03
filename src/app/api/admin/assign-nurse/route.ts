import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, getAssignmentByRequestId, getNurseById, createAssignment } from '@/lib/firestore'

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

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
