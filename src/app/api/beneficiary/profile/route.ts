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
    const { beneficiaryId, location } = body

    if (!beneficiaryId) {
      return NextResponse.json({ error: 'معرف المستفيد مطلوب' }, { status: 400 })
    }

    const existing = await getBeneficiaryById(beneficiaryId)
    if (!existing) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Only allow updating location field
    const updateData: Record<string, any> = {}
    if (location !== undefined) updateData.location = location

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const updated = await updateBeneficiary(beneficiaryId, updateData)

    // Remove password from response
    const { password, ...safeBeneficiary } = updated as any

    return NextResponse.json(safeBeneficiary)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
