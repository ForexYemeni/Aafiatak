import { NextRequest, NextResponse } from 'next/server'
import { createEmergencyRequest } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, serviceType, address, notes } = body

    if (!beneficiaryId || !serviceType || !address) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    const emergencyRequest = await createEmergencyRequest({
      beneficiaryId,
      serviceType,
      address,
      notes: notes || undefined,
    })

    return NextResponse.json(emergencyRequest)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
