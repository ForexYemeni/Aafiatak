import { NextResponse } from 'next/server'
import { getEmergencyRequests } from '@/lib/firestore'

export async function GET() {
  try {
    const requests = await getEmergencyRequests()
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Get emergency requests error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
