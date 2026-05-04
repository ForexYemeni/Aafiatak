import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryById, updateBeneficiary, getNurseById } from '@/lib/firestore'

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

    const favoriteNurseId = (beneficiary as any).favoriteNurseId || null

    let favoriteNurse = null
    if (favoriteNurseId) {
      const nurse = await getNurseById(favoriteNurseId)
      if (nurse) {
        const { password, ...safeNurse } = nurse as any
        favoriteNurse = safeNurse
      }
    }

    return NextResponse.json({
      beneficiaryId,
      favoriteNurseId,
      favoriteNurse,
    })
  } catch (error: any) {
    console.error('Get favorite nurse error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, nurseId } = body

    if (!beneficiaryId || !nurseId) {
      return NextResponse.json({ error: 'معرف المستفيد والممرض مطلوبان' }, { status: 400 })
    }

    // Verify beneficiary exists
    const beneficiary = await getBeneficiaryById(beneficiaryId)
    if (!beneficiary) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Verify nurse exists and is approved
    const nurse = await getNurseById(nurseId)
    if (!nurse) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    if ((nurse as any).status !== 'approved') {
      return NextResponse.json({ error: 'الممرض غير معتمد' }, { status: 400 })
    }

    // Set favorite nurse on beneficiary
    await updateBeneficiary(beneficiaryId, { favoriteNurseId: nurseId })

    const { password, ...safeNurse } = nurse as any

    return NextResponse.json({
      beneficiaryId,
      favoriteNurseId: nurseId,
      favoriteNurse: safeNurse,
      message: 'تم تعيين الممرض المفضل بنجاح',
    })
  } catch (error: any) {
    console.error('Set favorite nurse error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
