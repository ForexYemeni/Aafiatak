import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, updateNurse, deleteNurse, blockNurse, unblockNurse, verifyNurse } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await getNurseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Handle identity verification separately
    if (body.isVerified !== undefined) {
      const nurse = await verifyNurse(id, body.isVerified)
      const { password, ...safeNurse } = nurse as any
      return NextResponse.json(safeNurse)
    }

    // Handle status changes
    const { status } = body
    if (status) {
      if (!['approved', 'rejected', 'pending', 'blocked'].includes(status)) {
        return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
      }

      let nurse
      if (status === 'blocked') {
        nurse = await blockNurse(id)
      } else if (status === 'approved' && existing.status === 'blocked') {
        nurse = await unblockNurse(id)
      } else {
        nurse = await updateNurse(id, { status })
      }

      const { password, ...safeNurse } = nurse as any
      return NextResponse.json(safeNurse)
    }

    return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
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

    const existing = await getNurseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    await deleteNurse(id)

    return NextResponse.json({ message: 'تم حذف الممرض بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
