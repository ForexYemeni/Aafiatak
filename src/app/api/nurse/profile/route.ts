import { NextRequest, NextResponse } from 'next/server'
import { getNurseById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    const nurse = await getNurseById(nurseId)

    if (!nurse) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Remove password from response
    const { password, ...safeNurse } = nurse as any

    return NextResponse.json(safeNurse)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
