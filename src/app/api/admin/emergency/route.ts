import { NextRequest, NextResponse } from 'next/server'
import { getEmergencyRequests, updateEmergencyRequest } from '@/lib/firestore'

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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'معرف الطلب والحالة مطلوبان' }, { status: 400 })
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
