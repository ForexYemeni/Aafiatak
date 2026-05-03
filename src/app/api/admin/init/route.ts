import { NextRequest, NextResponse } from 'next/server'
import { getFirstAdmin, createAdmin } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, name } = body

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const existingAdmin = await getFirstAdmin()
    if (existingAdmin) {
      return NextResponse.json({ error: 'يوجد حساب مدير بالفعل. استخدم تسجيل الدخول.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = await createAdmin({
      username,
      password: hashedPassword,
      name,
      mustChangePassword: true,
    })

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      mustChangePassword: true,
    })
  } catch (error: any) {
    console.error('Admin init error:', error.message)
    const msg = error.message || 'حدث خطأ في الخادم'
    
    if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used') || msg.includes('Cloud Firestore')) {
      return NextResponse.json({
        error: 'يجب تفعيل Firestore Database أولاً من Firebase Console',
        firebaseError: msg,
      }, { status: 500 })
    }
    
    if (msg.includes('Firebase') || msg.includes('غير مهيأ') || msg.includes('credentials')) {
      return NextResponse.json({
        error: 'Firebase غير مهيأ. تأكد من إعداد بيانات الاتصال.',
        firebaseError: msg,
      }, { status: 500 })
    }
    
    return NextResponse.json({
      error: 'حدث خطأ في إنشاء حساب المدير',
      details: msg,
    }, { status: 500 })
  }
}
