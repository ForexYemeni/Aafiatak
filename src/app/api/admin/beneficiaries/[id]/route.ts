import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryById, blockBeneficiary, unblockBeneficiary, deleteBeneficiary } from '@/lib/firestore'
import { notifyBeneficiaryServer } from '@/lib/server-notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['active', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة. الحالات المسموحة: active, blocked' }, { status: 400 })
    }

    const existing = await getBeneficiaryById(id)
    if (!existing) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    let beneficiary
    if (status === 'blocked') {
      beneficiary = await blockBeneficiary(id)
      // Notify beneficiary about account block
      notifyBeneficiaryServer.accountBlocked(id).catch(() => {})
    } else {
      beneficiary = await unblockBeneficiary(id)
      // Notify beneficiary about account unblock
      notifyBeneficiaryServer.accountUnblocked(id).catch(() => {})
    }

    // Remove password from response
    const { password, ...safeBeneficiary } = beneficiary as any

    return NextResponse.json(safeBeneficiary)
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

    const existing = await getBeneficiaryById(id)
    if (!existing) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    await deleteBeneficiary(id)

    return NextResponse.json({ message: 'تم حذف المستفيد بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
