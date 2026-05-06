import { NextRequest, NextResponse } from 'next/server'
import { getAllServices, createService } from '@/lib/firestore'

export async function GET() {
  try {
    const services = await getAllServices()
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, isActive } = body

    if (!name || !description || price === undefined) {
      return NextResponse.json({ error: 'الاسم والوصف والسعر مطلوبون' }, { status: 400 })
    }

    const service = await createService({
      name,
      description,
      price: parseFloat(price),
      category: category || 'عام',
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
