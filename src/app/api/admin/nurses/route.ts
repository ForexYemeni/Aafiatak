import { NextRequest, NextResponse } from 'next/server'
import { getAllNurses } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const nurses = await getAllNurses(status)

    // Remove password from response
    const safeNurses = nurses.map(({ password, ...rest }: any) => rest)

    return NextResponse.json(safeNurses)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
