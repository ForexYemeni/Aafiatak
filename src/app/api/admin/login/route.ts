import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername, createAdmin, getFirstAdmin } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

// Default admin credentials for first-time setup
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // Try to find admin in database
    let admin = await getAdminByUsername(username)

    // If no admin exists at all, auto-create the default admin
    if (!admin) {
      const existingAdmin = await getFirstAdmin()
      if (!existingAdmin) {
        // No admin in the database yet - auto-seed with default credentials
        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
          const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
          admin = await createAdmin({
            username: DEFAULT_USERNAME,
            password: hashedPassword,
            name: 'المدير',
            mustChangePassword: true,
          })
          console.log('✅ Default admin account created automatically')
        } else {
          return NextResponse.json({
            error: 'لا يوجد حساب مدير بعد. استخدم البيانات الافتراضية: admin / admin123',
            isNoAdmin: true,
          }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
      }
    }

    // Verify password
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

    // Check for common Firebase/Firestore errors
    if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used') || msg.includes('Cloud Firestore')) {
      return NextResponse.json({
        error: 'يجب تفعيل Firestore Database أولاً من Firebase Console مع اختيار Test Mode',
        details: msg,
        isFirestoreNotCreated: true,
      }, { status: 500 })
    }

    if (msg.includes('Firebase') || msg.includes('غير مهيأ') || msg.includes('credentials') || msg.includes('initialize')) {
      return NextResponse.json({
        error: 'قاعدة البيانات غير متصلة. تأكد من إعداد متغيرات Firebase البيئية بشكل صحيح.',
        details: msg,
        isFirebaseError: true,
      }, { status: 500 })
    }

    return NextResponse.json({
      error: 'حدث خطأ في الخادم. حاول مرة أخرى.',
      details: msg,
    }, { status: 500 })
  }
}
