import { NextResponse } from 'next/server'
import { countNurses, countBeneficiaries, countServices, countServiceRequests, getCompletedServiceRevenue } from '@/lib/firestore'

export async function GET() {
  try {
    const [
      totalNurses,
      approvedNurses,
      pendingNurses,
      totalBeneficiaries,
      totalServices,
      activeServices,
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
    ] = await Promise.all([
      countNurses(),
      countNurses('approved'),
      countNurses('pending'),
      countBeneficiaries(),
      countServices(),
      countServices(true),
      countServiceRequests(),
      countServiceRequests('pending'),
      countServiceRequests('approved'),
      countServiceRequests('completed'),
    ])

    const totalRevenue = await getCompletedServiceRevenue()

    return NextResponse.json({
      totalNurses,
      approvedNurses,
      pendingNurses,
      totalBeneficiaries,
      totalServices,
      activeServices,
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedRequests,
      totalRevenue,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
