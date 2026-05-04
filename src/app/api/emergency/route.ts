import { NextRequest, NextResponse } from 'next/server'
import { createEmergencyRequest, getAdminSettings } from '@/lib/firestore'

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

    // Get admin settings for emergency phone
    let emergencyPhone: string | null = null
    try {
      const settings = await getAdminSettings()
      if (settings && settings.emergencyPhone) {
        emergencyPhone = settings.emergencyPhone
      }
    } catch {
      // Settings not available, continue without emergency phone
    }

    return NextResponse.json({
      ...emergencyRequest,
      emergencyPhone,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
