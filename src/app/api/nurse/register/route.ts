import { NextRequest, NextResponse } from 'next/server'
import { getNurseByPhone, getNurseByNationalId, getNurseByLicenseNumber, createNurse } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      secondName,
      thirdName,
      lastName,
      phone,
      location,
      nationalId,
      licenseNumber,
      licenseExpiryDate,
      password,
    } = body

    if (
      !firstName || !secondName || !thirdName || !lastName ||
      !phone || !location || !nationalId || !licenseNumber ||
      !licenseExpiryDate || !password
    ) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (!/^7\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام' }, { status: 400 })
    }

    const existingPhone = await getNurseByPhone(phone)
    if (existingPhone) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل بالفعل' }, { status: 400 })
    }

    const existingNationalId = await getNurseByNationalId(nationalId)
    if (existingNationalId) {
      return NextResponse.json({ error: 'الرقم الوطني مسجل بالفعل' }, { status: 400 })
    }

    const existingLicense = await getNurseByLicenseNumber(licenseNumber)
    if (existingLicense) {
      return NextResponse.json({ error: 'رقم المزاولة مسجل بالفعل' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const nurse = await createNurse({
      firstName,
      secondName,
      thirdName,
      lastName,
      phone,
      location,
      nationalId,
      licenseNumber,
      licenseExpiryDate,
      password: hashedPassword,
      status: 'approved',
      isVerified: false,
    })

    // Remove password from response
    const { password: _, ...safeNurse } = nurse as any

    return NextResponse.json(safeNurse)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
