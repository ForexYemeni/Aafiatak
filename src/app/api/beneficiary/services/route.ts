import { NextResponse } from 'next/server'
import { getActiveServices } from '@/lib/firestore'

export async function GET() {
  try {
    const services = await getActiveServices()
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
