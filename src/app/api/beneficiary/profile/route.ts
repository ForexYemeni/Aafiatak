import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryById, updateBeneficiary } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const beneficiary = await getBeneficiaryById(beneficiaryId)

    if (!beneficiary) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Remove password from response
    const { password, ...safeBeneficiary } = beneficiary as any

    return NextResponse.json(safeBeneficiary)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, name, phone, location } = body

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const existing = await getBeneficiaryById(beneficiaryId)
    if (!existing) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location

    const updated = await updateBeneficiary(beneficiaryId, updateData)

    // Remove password from response
    const { password, ...safeBeneficiary } = updated as any

    return NextResponse.json(safeBeneficiary)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
