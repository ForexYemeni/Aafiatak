import { NextRequest, NextResponse } from 'next/server'
import { getNurseByPhone } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الهاتف وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const nurse = await getNurseByPhone(phone)
    if (!nurse) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, nurse.password)
    if (!isValid) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (nurse.status === 'blocked') {
      return NextResponse.json({
        error: 'تم حظر حسابك. يرجى التواصل مع الإدارة',
      }, { status: 403 })
    }

    if (nurse.status !== 'approved') {
      return NextResponse.json({
        error: 'تم رفض حسابك، يرجى التواصل مع الإدارة',
      }, { status: 403 })
    }

    return NextResponse.json({
      id: nurse.id,
      firstName: nurse.firstName,
      secondName: nurse.secondName,
      thirdName: nurse.thirdName,
      lastName: nurse.lastName,
      phone: nurse.phone,
      location: nurse.location,
      nationalId: nurse.nationalId,
      licenseNumber: nurse.licenseNumber,
      licenseExpiryDate: nurse.licenseExpiryDate,
      status: nurse.status,
      isVerified: nurse.isVerified || false,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
