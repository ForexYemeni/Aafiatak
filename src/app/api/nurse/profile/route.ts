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
    const { nurseId, firstName, secondName, thirdName, lastName, phone, location } = body

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    const existing = await getNurseById(nurseId)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, string> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (secondName !== undefined) updateData.secondName = secondName
    if (thirdName !== undefined) updateData.thirdName = thirdName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location

    const updated = await updateNurse(nurseId, updateData)

    // Remove password from response
    const { password, ...safeNurse } = updated as any

    return NextResponse.json(safeNurse)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
