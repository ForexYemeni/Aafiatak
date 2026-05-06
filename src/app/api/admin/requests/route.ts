import { NextResponse } from 'next/server'
import { getAllServiceRequests } from '@/lib/firestore'

export async function GET() {
  try {
    const requests = await getAllServiceRequests()
    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
