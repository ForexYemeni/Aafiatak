import { NextRequest, NextResponse } from 'next/server'
import { getAllRatings, getNurseRatings } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    let ratings
    if (nurseId) {
      ratings = await getNurseRatings(nurseId)
    } else {
      ratings = await getAllRatings()
    }

    return NextResponse.json(ratings)
  } catch (error: any) {
    console.error('Get ratings error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
