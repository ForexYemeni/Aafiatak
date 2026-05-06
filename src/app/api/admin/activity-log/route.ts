import { NextRequest, NextResponse } from 'next/server'
import { getActivityLogs, createActivityLog } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const logs = await getActivityLogs(limit)
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Get activity logs error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, description, userId, userName, metadata } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'النوع والوصف مطلوبان' }, { status: 400 })
    }

    const log = await createActivityLog({
      type,
      description,
      userId: userId || null,
      userName: userName || null,
      metadata: metadata || null,
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error: any) {
    console.error('Create activity log error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
