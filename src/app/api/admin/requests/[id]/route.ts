import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, updateServiceRequest } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, adminNotes } = body

    if (!['approved', 'rejected', 'pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await getServiceRequestById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, any> = { status }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    const updated = await updateServiceRequest(id, updateData)

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
