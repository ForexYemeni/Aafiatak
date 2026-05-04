import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername, getAdminByPhone, createAdmin, getFirstAdmin, updateAdmin, getSubAdminByPhone } from '@/lib/firestore'
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

    // ── Step 1: Try to find admin by phone first, then by username ──
    let adminUser = await getAdminByPhone(loginIdentifier)
    if (!adminUser) {
      adminUser = await getAdminByUsername(loginIdentifier)
    }

    // If found in admins collection, authenticate as main admin
    if (adminUser) {
      const isValid = await bcrypt.compare(loginPassword, adminUser.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // If admin doesn't have a phone field yet, add it
      if (!adminUser.phone && phone) {
        await updateAdmin(adminUser.id, { phone: loginIdentifier })
      }

      return NextResponse.json({
        id: adminUser.id,
        username: adminUser.username,
        phone: adminUser.phone || loginIdentifier,
        name: adminUser.name,
        mustChangePassword: adminUser.mustChangePassword === true,
        role: 'admin',
        ...(adminUser.mustChangePassword && {
          message: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة',
        }),
      })
    }

    // ── Step 2: Check sub-admins collection ──
    const subAdmin = await getSubAdminByPhone(loginIdentifier)
    if (subAdmin) {
      // Check if sub-admin is blocked
      if (subAdmin.status === 'blocked') {
        return NextResponse.json({ error: 'هذا الحساب محظور. تواصل مع المدير الرئيسي.' }, { status: 403 })
      }

      // Verify password
      const isValid = await bcrypt.compare(loginPassword, subAdmin.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // Return sub-admin data with role and permissions
      return NextResponse.json({
        id: subAdmin.id,
        name: subAdmin.name,
        phone: subAdmin.phone,
        adminId: subAdmin.adminId,
        role: 'sub-admin',
        permissions: subAdmin.permissions || {},
        mustChangePassword: false,
      })
    }

    // ── Step 3: No admin exists at all — auto-create default admin ──
    const existingAdmin = await getFirstAdmin()
    if (!existingAdmin) {
      // No admin in the database yet - auto-seed with default credentials
      if ((loginIdentifier === DEFAULT_PHONE || loginIdentifier === 'admin') && loginPassword === DEFAULT_PASSWORD) {
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
        adminUser = await createAdmin({
          username: DEFAULT_PHONE,
          phone: DEFAULT_PHONE,
          password: hashedPassword,
          name: 'المدير',
          mustChangePassword: true,
        })
        console.log('✅ Default admin account created automatically with phone number')
        return NextResponse.json({
          id: adminUser.id,
          username: adminUser.username,
          phone: adminUser.phone || DEFAULT_PHONE,
          name: adminUser.name,
          mustChangePassword: true,
          role: 'admin',
          message: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة',
        })
      } else {
        return NextResponse.json({
          error: 'لا يوجد حساب مدير بعد. استخدم البيانات الافتراضية: 777000000 / admin123',
          isNoAdmin: true,
        }, { status: 401 })
      }
    }

    // ── Step 4: No match found ──
    return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })

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
