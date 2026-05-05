import { NextResponse } from 'next/server'
import { getActivePaymentMethods } from '@/lib/firestore'

export async function GET() {
  try {
    const methods = await getActivePaymentMethods()
    return NextResponse.json(methods)
  } catch (error: any) {
    console.error('Get active payment methods error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
