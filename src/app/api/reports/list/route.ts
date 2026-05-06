import { NextRequest, NextResponse } from 'next/server'
import { getReports } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const reports = await getReports(status || undefined)

    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Get reports list error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
