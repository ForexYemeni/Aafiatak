import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, updateNurse } from '@/lib/firestore'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { nurseId, latitude, longitude } = body

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'خطوط الطول والعرض مطلوبة' }, { status: 400 })
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'خطوط الطول والعرض يجب أن تكون أرقاماً' }, { status: 400 })
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'قيم خطوط الطول والعرض غير صالحة' }, { status: 400 })
    }

    const existing = await getNurseById(nurseId)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Update nurse's current location for live tracking
    const currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    }

    await updateNurse(nurseId, { currentLocation })

    return NextResponse.json({
      nurseId,
      currentLocation,
      message: 'تم تحديث الموقع بنجاح',
    })
  } catch (error: any) {
    console.error('Update nurse location error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
