import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, updateNurse, deleteNurse, blockNurse, unblockNurse } from '@/lib/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['approved', 'rejected', 'pending', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await getNurseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    let nurse
    if (status === 'blocked') {
      nurse = await blockNurse(id)
    } else if (status === 'approved' && existing.status === 'blocked') {
      nurse = await unblockNurse(id)
    } else {
      nurse = await updateNurse(id, { status })
    }

    // Remove password from response
    const { password, ...safeNurse } = nurse as any

    return NextResponse.json(safeNurse)
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
