import { NextRequest, NextResponse } from 'next/server'
import { createRating, getBeneficiaryById, getNurseById, getServiceRequestById, getServiceById } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, nurseId, beneficiaryId, rating, comment } = body

    if (!requestId || !nurseId || !beneficiaryId || !rating) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 })
    }

    // Get beneficiary name
    const beneficiary = await getBeneficiaryById(beneficiaryId)
    const beneficiaryName = beneficiary ? beneficiary.name : 'غير معروف'

    // Get nurse name
    const nurse = await getNurseById(nurseId)
    const nurseName = nurse
      ? `${nurse.firstName} ${nurse.secondName} ${nurse.thirdName} ${nurse.lastName}`
      : 'غير معروف'

    // Get service name
    const serviceRequest = await getServiceRequestById(requestId)
    let serviceName: string | undefined
    if (serviceRequest) {
      const service = await getServiceById(serviceRequest.serviceId)
      serviceName = service ? service.name : undefined
    }

    const newRating = await createRating({
      requestId,
      nurseId,
      beneficiaryId,
      beneficiaryName,
      nurseName,
      rating,
      comment: comment || undefined,
      serviceName,
    })

    return NextResponse.json(newRating)
  } catch (error: any) {
    console.error('Create rating error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء التقييم' }, { status: 500 })
  }
}
