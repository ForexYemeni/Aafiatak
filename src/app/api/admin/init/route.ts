import { NextRequest, NextResponse } from 'next/server'
import { getFirstAdmin, createAdmin } from '@/lib/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const existingAdmin = await getFirstAdmin()
    if (existingAdmin) {
      return NextResponse.json({ error: 'يوجد حساب مدير بالفعل' }, { status: 400 })
    }

    const body = await request.json()
    const { username, password, name } = body

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
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
    if (msg.includes('PERMISSION_DENIED') || msg.includes('has not been used')) {
      return NextResponse.json({
        error: 'يجب تفعيل Firestore Database أولاً. اذهب إلى Firebase Console → Firestore Database → Create Database',
        firebaseError: msg,
      }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
