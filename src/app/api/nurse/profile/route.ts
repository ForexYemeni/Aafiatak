import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, updateNurse } from '@/lib/firestore'

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { nurseId, location } = body

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    const existing = await getNurseById(nurseId)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Only allow updating location field
    const updateData: Record<string, string> = {}
    if (location !== undefined) updateData.location = location

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const updated = await updateNurse(nurseId, updateData)

    // Remove password from response
    const { password, ...safeNurse } = updated as any

    return NextResponse.json(safeNurse)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
