import { NextRequest, NextResponse } from 'next/server'
import { searchNurses, searchServices } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim().toLowerCase() || ''
    const type = searchParams.get('type') || 'all' // 'nurses', 'services', or 'all'

    if (!q) {
      return NextResponse.json({ error: 'نص البحث مطلوب' }, { status: 400 })
    }

    const results: {
      nurses: any[]
      services: any[]
    } = {
      nurses: [],
      services: [],
    }

    // Search nurses
    if (type === 'nurses' || type === 'all') {
      try {
        const nurseResults = await searchNurses(q)
        results.nurses = nurseResults.map((nurse: any) => {
          const { password, ...safeNurse } = nurse
          return safeNurse
        })
      } catch {
        results.nurses = []
      }
    }

    // Search services
    if (type === 'services' || type === 'all') {
      try {
        results.services = await searchServices(q)
      } catch {
        results.services = []
      }
    }

    return NextResponse.json({
      query: q,
      type,
      results,
      totalNurses: results.nurses.length,
      totalServices: results.services.length,
    })
  } catch (error: any) {
    console.error('Search error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
