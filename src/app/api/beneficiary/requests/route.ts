import { NextRequest, NextResponse } from 'next/server'
import { getServiceRequestsByBeneficiary, createServiceRequest, getServiceById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const requests = await getServiceRequestsByBeneficiary(beneficiaryId)

    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, serviceId, paymentMethod, notes, address } = body

    if (!beneficiaryId || !serviceId) {
      return NextResponse.json({ error: 'معرف المستفيد ومعرف الخدمة مطلوبان' }, { status: 400 })
    }

    const service = await getServiceById(serviceId)
    if (!service || !service.isActive) {
      return NextResponse.json({ error: 'الخدمة غير متاحة' }, { status: 400 })
    }

    const serviceRequest = await createServiceRequest({
      beneficiaryId,
      serviceId,
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      address: address || null,
      status: 'pending',
    })

    return NextResponse.json(serviceRequest)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
