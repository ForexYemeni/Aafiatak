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
    const {
      beneficiaryId,
      serviceId,          // single service (backward compat)
      serviceIds,         // multiple services (array)
      paymentMethod,
      paymentMethodId,
      notes,
      address,
      couponCode,
      requestFavoriteNurse,
      dynamicPrice,
      pricingBreakdown,
      commission,
    } = body

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    // Support both single and multiple services
    const svcIds: string[] = serviceIds || (serviceId ? [serviceId] : [])
    if (svcIds.length === 0) {
      return NextResponse.json({ error: 'يجب اختيار خدمة واحدة على الأقل' }, { status: 400 })
    }

    // Validate all services exist and are active
    const validServices: Array<{ id: string; name: string; price: number }> = []
    for (const sid of svcIds) {
      const service = await getServiceById(sid)
      if (!service || !service.isActive) {
        return NextResponse.json({ error: `الخدمة غير متاحة: ${sid}` }, { status: 400 })
      }
      validServices.push({ id: sid, name: service.name, price: service.price || 0 })
    }

    // For multiple services, create a single grouped request
    const isMultiService = validServices.length > 1

    // Determine initial status based on payment method
    // Cash on delivery: goes directly to pending_confirmation (no payment needed upfront)
    // Electronic payment: stays at pending_payment until payment is confirmed
    const isCashPayment = paymentMethod === 'cash'
    const initialStatus = isCashPayment ? 'pending_confirmation' : 'pending_payment'
    const initialPaymentStatus = isCashPayment ? 'cash_on_delivery' : 'unpaid'

    const serviceRequest = await createServiceRequest({
      beneficiaryId,
      serviceId: validServices[0].id, // primary service
      serviceIds: svcIds,             // all services
      services: validServices,        // service details
      isMultiService,
      paymentMethod: paymentMethod || null,
      paymentMethodId: paymentMethodId || null,
      notes: notes || null,
      address: address || null,
      couponCode: couponCode || null,
      requestFavoriteNurse: requestFavoriteNurse || null,
      dynamicPrice: dynamicPrice || null,
      pricingBreakdown: pricingBreakdown || null,
      commission: commission || null,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
    })

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error('Create service request error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
