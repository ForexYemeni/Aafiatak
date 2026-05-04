import { NextRequest, NextResponse } from 'next/server'
import { getNurseRatings } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    const ratings = await getNurseRatings(nurseId)
    return NextResponse.json(ratings)
  } catch (error: any) {
    console.error('Get nurse ratings error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
