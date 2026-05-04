import { NextRequest, NextResponse } from 'next/server'
import { updateSubAdmin, deleteSubAdmin } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['name', 'phone', 'password', 'permissions', 'status']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const subAdmin = await updateSubAdmin(id, updateData)
    return NextResponse.json(subAdmin)
  } catch (error: any) {
    console.error('Update sub-admin error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في تحديث المسؤول الفرعي' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await deleteSubAdmin(id)

    return NextResponse.json({ message: 'تم حذف المسؤول الفرعي بنجاح' })
  } catch (error: any) {
    console.error('Delete sub-admin error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في حذف المسؤول الفرعي' }, { status: 500 })
  }
}
