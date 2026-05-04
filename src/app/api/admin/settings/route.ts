import { NextRequest, NextResponse } from 'next/server'
import { getAdminSettings, updateAdminSettings } from '@/lib/firestore'

export async function GET() {
  try {
    const settings = await getAdminSettings()
    if (!settings) {
      return NextResponse.json({
        phone: '',
        email: '',
        emergencyPhone: '',
        referralBonusPoints: 50,
        referralBonusPointsReceiver: 25,
        referralEnabled: true,
      })
    }
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Get admin settings error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const allowedFields = ['phone', 'email', 'emergencyPhone', 'referralBonusPoints', 'referralBonusPointsReceiver', 'referralEnabled']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const settings = await updateAdminSettings(updateData)
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Update admin settings error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في تحديث الإعدادات' }, { status: 500 })
  }
}
