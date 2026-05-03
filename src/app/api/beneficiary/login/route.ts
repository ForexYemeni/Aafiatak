import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryByPhone } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الهاتف وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const beneficiary = await getBeneficiaryByPhone(phone)
    if (!beneficiary) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, beneficiary.password)
    if (!isValid) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    return NextResponse.json({
      id: beneficiary.id,
      name: beneficiary.name,
      phone: beneficiary.phone,
      location: beneficiary.location,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
