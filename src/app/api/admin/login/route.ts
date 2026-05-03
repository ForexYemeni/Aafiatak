import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const admin = await getAdminByUsername(username)
    if (!admin) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      mustChangePassword: admin.mustChangePassword === true,
      ...(admin.mustChangePassword && {
        message: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة',
      }),
    })
  } catch (error: any) {
    console.error('Admin login error:', error.message)
    const msg = error.message || 'حدث خطأ في الخادم'
    return NextResponse.json({
      error: msg.includes('Firebase') || msg.includes('غير مهيأ')
        ? 'قاعدة البيانات غير متصلة. تأكد من إعداد Firebase بشكل صحيح.'
        : 'حدث خطأ في الخادم. حاول مرة أخرى.',
      details: msg,
    }, { status: 500 })
  }
}
