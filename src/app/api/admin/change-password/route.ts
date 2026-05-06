import { NextRequest, NextResponse } from 'next/server'
import { getAdminById, updateAdmin, getSubAdminById, updateSubAdmin } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, currentPassword, newPassword, userType } = body

    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // Support both admin and sub-admin password changes
    if (userType === 'sub-admin') {
      const subAdmin = await getSubAdminById(adminId)
      if (!subAdmin) {
        return NextResponse.json({ error: 'المدير الفرعي غير موجود' }, { status: 404 })
      }

      const isValid = await bcrypt.compare(currentPassword, subAdmin.password)
      if (!isValid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await updateSubAdmin(adminId, { password: hashedPassword })

      return NextResponse.json({
        message: 'تم تغيير كلمة المرور بنجاح',
        mustChangePassword: false,
      })
    }

    // Default: main admin
    const admin = await getAdminById(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'المدير غير موجود' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isValid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await updateAdmin(adminId, {
      password: hashedPassword,
      mustChangePassword: false,
    })

    return NextResponse.json({
      message: 'تم تغيير كلمة المرور بنجاح',
      mustChangePassword: false,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
