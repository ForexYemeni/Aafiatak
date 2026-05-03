import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryByPhone, createBeneficiary } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, location, password } = body

    if (!name || !phone || !location || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (!/^7\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام' }, { status: 400 })
    }

    const existing = await getBeneficiaryByPhone(phone)
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل بالفعل' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const beneficiary = await createBeneficiary({
      name,
      phone,
      location,
      password: hashedPassword,
    })

    // Remove password from response
    const { password: _, ...safeBeneficiary } = beneficiary as any

    return NextResponse.json(safeBeneficiary)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
