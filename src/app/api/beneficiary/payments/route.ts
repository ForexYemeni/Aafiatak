import { NextResponse } from 'next/server'
import { getActivePaymentMethods } from '@/lib/firestore'

export async function GET() {
  try {
    const payments = await getActivePaymentMethods()
    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
