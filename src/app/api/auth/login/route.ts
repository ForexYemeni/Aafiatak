import { NextRequest, NextResponse } from 'next/server'
import {
  getBeneficiaryByPhone,
  getNurseByPhone,
  getAdminByPhone,
  getAdminByUsername,
  getSubAdminByPhone,
  getFirstAdmin,
  createAdmin,
  updateAdmin,
} from '@/lib/firestore'
import bcrypt from 'bcryptjs'

// Default admin credentials for first-time setup
const DEFAULT_PHONE = '777000000'
const DEFAULT_PASSWORD = 'admin123'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'رقم الهاتف وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // ═══════════════════════════════════════════
    //  Step 1: Check ADMINS collection (by phone then username)
    // ═══════════════════════════════════════════
    let adminUser = await getAdminByPhone(phone)
    if (!adminUser) {
      adminUser = await getAdminByUsername(phone)
    }

    if (adminUser) {
      const isValid = await bcrypt.compare(password, adminUser.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      // If admin doesn't have a phone field yet, add it
      if (!adminUser.phone && phone) {
        await updateAdmin(adminUser.id, { phone })
      }

      return NextResponse.json({
        id: adminUser.id,
        username: adminUser.username,
        phone: adminUser.phone || phone,
        name: adminUser.name,
        mustChangePassword: adminUser.mustChangePassword === true,
        role: 'admin',
        userType: 'admin',
        ...(adminUser.mustChangePassword && {
          message: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة',
        }),
      })
    }

    // ═══════════════════════════════════════════
    //  Step 2: Check SUB-ADMINS collection
    // ═══════════════════════════════════════════
    const subAdmin = await getSubAdminByPhone(phone)
    if (subAdmin) {
      if (subAdmin.status === 'blocked') {
        return NextResponse.json({ error: 'هذا الحساب محظور. تواصل مع المدير الرئيسي.' }, { status: 403 })
      }

      const isValid = await bcrypt.compare(password, subAdmin.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      return NextResponse.json({
        id: subAdmin.id,
        name: subAdmin.name,
        phone: subAdmin.phone,
        adminId: subAdmin.adminId,
        role: 'sub-admin',
        userType: 'admin',
        permissions: subAdmin.permissions || {},
        mustChangePassword: false,
      })
    }

    // ═══════════════════════════════════════════
    //  Step 3: Check NURSES collection
    // ═══════════════════════════════════════════
    const nurse = await getNurseByPhone(phone)
    if (nurse) {
      const isValid = await bcrypt.compare(password, nurse.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      if (nurse.status === 'blocked') {
        return NextResponse.json({ error: 'تم حظر حسابك. يرجى التواصل مع الإدارة' }, { status: 403 })
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
        userType: 'nurse',
      })
    }

    // ═══════════════════════════════════════════
    //  Step 4: Check BENEFICIARIES collection
    // ═══════════════════════════════════════════
    const beneficiary = await getBeneficiaryByPhone(phone)
    if (beneficiary) {
      const isValid = await bcrypt.compare(password, beneficiary.password)
      if (!isValid) {
        return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })
      }

      if (beneficiary.status === 'blocked') {
        return NextResponse.json({ error: 'تم حظر حسابك. يرجى التواصل مع الإدارة' }, { status: 403 })
      }

      return NextResponse.json({
        id: beneficiary.id,
        name: beneficiary.name,
        phone: beneficiary.phone,
        location: beneficiary.location,
        userType: 'beneficiary',
      })
    }

    // ═══════════════════════════════════════════
    //  Step 5: No admin exists at all — auto-create default admin
    // ═══════════════════════════════════════════
    const existingAdmin = await getFirstAdmin()
    if (!existingAdmin) {
      if ((phone === DEFAULT_PHONE || phone === 'admin') && password === DEFAULT_PASSWORD) {
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
        adminUser = await createAdmin({
          username: DEFAULT_PHONE,
          phone: DEFAULT_PHONE,
          password: hashedPassword,
          name: 'المدير',
          mustChangePassword: true,
        })
        console.log('Default admin account created automatically via unified login')
        return NextResponse.json({
          id: adminUser.id,
          username: adminUser.username,
          phone: adminUser.phone || DEFAULT_PHONE,
          name: adminUser.name,
          mustChangePassword: true,
          role: 'admin',
          userType: 'admin',
          message: 'يجب تغيير كلمة المرور الافتراضية قبل المتابعة',
        })
      } else {
        return NextResponse.json({
          error: 'لا يوجد حساب مدير بعد. استخدم البيانات الافتراضية: 777000000 / admin123',
          isNoAdmin: true,
        }, { status: 401 })
      }
    }

    // ═══════════════════════════════════════════
    //  Step 6: No match found in any collection
    // ═══════════════════════════════════════════
    return NextResponse.json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 })

  } catch (error: any) {
    console.error('Unified login error:', error.message, error.code || '')
    const msg = error.message || 'حدث خطأ في الخادم'
    const code = error.code || error.codePrefix || ''

    // Check for MongoDB connection errors
    if (msg.includes('MONGODB_URI') || msg.includes('فشل الاتصال بقاعدة البيانات') || msg.includes('MongoServerError')) {
      return NextResponse.json({
        error: 'فشل الاتصال بقاعدة البيانات. تأكد من إعدادات MONGODB_URI.',
        details: msg,
        isDatabaseError: true,
      }, { status: 503 })
    }

    // Check for authentication errors in MongoDB
    if (msg.includes('Authentication failed') || msg.includes('bad auth') || msg.includes('AuthenticationFailure')) {
      return NextResponse.json({
        error: 'فشل المصادقة مع قاعدة البيانات. تأكد من صحة اسم المستخدم وكلمة المرور في رابط الاتصال.',
        details: msg,
        isDatabaseError: true,
      }, { status: 503 })
    }

    // Check for network/connection errors
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('network') || msg.includes('serverSelectionTimeout')) {
      return NextResponse.json({
        error: 'فشل الاتصال بقاعدة البيانات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
        details: msg,
        isNetworkError: true,
      }, { status: 503 })
    }

    return NextResponse.json({
      error: 'حدث خطأ في الخادم. حاول مرة أخرى.',
      details: msg,
    }, { status: 500 })
  }
}
