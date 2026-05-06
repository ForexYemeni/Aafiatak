import { NextRequest, NextResponse } from 'next/server'
import { updateAppointment, deleteAppointment, getAppointmentById, getServiceById } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, date, time, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 })
    }

    // Check appointment exists
    const aptDoc = await getAppointmentById(id)
    if (!aptDoc) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    // Build update data with only provided fields
    const updateData: Record<string, any> = {}
    if (status !== undefined) {
      const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `حالة غير صالحة. الحالات المسموحة: ${validStatuses.join(', ')}` }, { status: 400 })
      }
      updateData.status = status
    }
    if (date !== undefined) updateData.date = date
    if (time !== undefined) updateData.time = time
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const updatedApt = await updateAppointment(id, updateData)

    // Enrich with service info
    const result: Record<string, any> = { ...updatedApt }
    if (updatedApt?.serviceId) {
      const service = await getServiceById(updatedApt.serviceId)
      result.service = service
        ? { id: service.id, name: service.name, price: service.price }
        : null
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Update appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 })
    }

    // Check appointment exists
    const aptDoc = await getAppointmentById(id)
    if (!aptDoc) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    await deleteAppointment(id)

    return NextResponse.json({ message: 'تم حذف الموعد بنجاح' })
  } catch (error: any) {
    console.error('Delete appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
