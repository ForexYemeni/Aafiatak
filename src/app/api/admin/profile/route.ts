import { NextRequest, NextResponse } from 'next/server'
import { updateAdmin, getAdminById } from '@/lib/firestore'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, name, phone, email } = body

    if (!adminId) {
      return NextResponse.json({ error: 'معرف المسؤول مطلوب' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const admin = await updateAdmin(adminId, updateData)

    // Remove password from response
    const { password, ...safeAdmin } = admin as any

    return NextResponse.json({
      id: safeAdmin.id,
      username: safeAdmin.username,
      name: safeAdmin.name,
      phone: safeAdmin.phone || '',
      email: safeAdmin.email || '',
      mustChangePassword: safeAdmin.mustChangePassword === true,
    })
  } catch (error: any) {
    console.error('Update admin profile error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في تحديث البيانات' }, { status: 500 })
  }
}
