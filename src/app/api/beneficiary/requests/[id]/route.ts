import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestById, updateServiceRequest } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (status !== 'cancelled') {
      return NextResponse.json({ error: 'يمكنك إلغاء الطلب فقط' }, { status: 400 })
    }

    const existing = await getServiceRequestById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'لا يمكن إلغاء الطلب إلا إذا كان قيد الانتظار' }, { status: 400 })
    }

    const updated = await updateServiceRequest(id, { status: 'cancelled' })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
