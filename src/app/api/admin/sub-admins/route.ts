import { NextRequest, NextResponse } from 'next/server'
import { getSubAdmins, createSubAdmin } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'معرف المسؤول مطلوب' }, { status: 400 })
    }

    const subAdmins = await getSubAdmins(adminId)
    return NextResponse.json(subAdmins)
  } catch (error: any) {
    console.error('Get sub-admins error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, name, phone, password, permissions } = body

    if (!adminId || !name || !phone || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const subAdmin = await createSubAdmin({
      adminId,
      name,
      phone,
      password,
      permissions: permissions || {},
    })

    return NextResponse.json(subAdmin)
  } catch (error: any) {
    console.error('Create sub-admin error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المسؤول الفرعي' }, { status: 500 })
  }
}
