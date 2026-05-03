import { NextRequest, NextResponse } from 'next/server'
import { getServiceById, updateService, deleteService } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, category, isActive } = body

    const existing = await getServiceById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (category !== undefined) updateData.category = category
    if (isActive !== undefined) updateData.isActive = isActive

    const service = await updateService(id, updateData)

    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await getServiceById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 })
    }

    await deleteService(id)
    return NextResponse.json({ message: 'تم حذف الخدمة بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
