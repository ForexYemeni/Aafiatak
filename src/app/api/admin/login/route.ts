import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername, getAdminByPhone, createAdmin, getFirstAdmin, updateAdmin } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

// Default admin credentials for first-time setup
const DEFAULT_PHONE = '777000000'
const DEFAULT_PASSWORD = 'admin123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, username } = body

    // Support both phone and username login
    const loginIdentifier = phone || username
    const loginPassword = password

    if (!loginIdentifier || !loginPassword) {
      return NextResponse.json({ error: 'رقم الهاتف وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // Try to find admin by phone first, then by username (backward compat)
    let admin = await getAdminByPhone(loginIdentifier)
    if (!admin) {
      admin = await getAdminByUsername(loginIdentifier)
    }

    // If no admin exists at all, auto-create the default admin
    if (!admin) {
      const existingAdmin = await getFirstAdmin()
      if (!existingAdmin) {
        // No admin in the database yet - auto-seed with default credentials
        // Accept either the new default phone or legacy username 'admin'
        if ((loginIdentifier === DEFAULT_PHONE || loginIdentifier === 'admin') && loginPassword === DEFAULT_PASSWORD) {
          const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
          admin = await createAdmin({
            username: DEFAULT_PHONE,
            phone: DEFAULT_PHONE,
            password: hashedPassword,
            name: 'المدير',
            mustChangePassword: true,
          })
          console.log('✅ Default admin account created automatically with phone number')
        } else {
          return NextResponse.json({
            error: 'لا يوجد حساب مدير بعد. استخدم البيانات الافتراضية: 777000000 / admin123',
            isNoAdmin: true,
          }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(loginPassword, admin.password)
    if (!isValid) {
      return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // If admin doesn't have a phone field yet, add it
    if (!admin.phone && phone) {
      await updateAdmin(admin.id, { phone: loginIdentifier })
    }

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      phone: admin.phone || loginIdentifier,
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
