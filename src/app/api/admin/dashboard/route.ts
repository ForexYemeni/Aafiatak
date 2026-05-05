import { NextResponse } from 'next/server'
import { countNurses, countBeneficiaries, countServices, countServiceRequests, getCompletedServiceRevenue, getReports } from '@/lib/firestore'
import { firestore } from '@/lib/firebase-admin'

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

    // Count unverified nurses (approved but not verified)
    let unverifiedNurses = 0
    try {
      const unverifiedSnapshot = await firestore.collection('nurses')
        .where('status', '==', 'approved')
        .where('isVerified', '==', false)
        .get()
      unverifiedNurses = unverifiedSnapshot.size
    } catch {}

    // Count pending complaints/reports
    let pendingComplaints = 0
    try {
      const reports = await getReports('pending')
      pendingComplaints = reports.length
    } catch {}

    // Count pending payment confirmations
    let pendingPaymentConfirmations = 0
    try {
      const pendingPaySnapshot = await firestore.collection('serviceRequests')
        .where('status', '==', 'pending_confirmation')
        .get()
      pendingPaymentConfirmations = pendingPaySnapshot.size
    } catch {}

    // Count pending emergency requests
    let pendingEmergency = 0
    try {
      const emSnapshot = await firestore.collection('emergencyRequests')
        .where('status', '==', 'pending')
        .get()
      pendingEmergency = emSnapshot.size
    } catch {}

    // Count assigned tasks (needs nurse acceptance)
    let pendingAssignmentAcceptance = 0
    try {
      const assignedSnapshot = await firestore.collection('serviceRequests')
        .where('status', '==', 'assigned')
        .get()
      pendingAssignmentAcceptance = assignedSnapshot.size
    } catch {}

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
      unverifiedNurses,
      pendingComplaints,
      pendingPaymentConfirmations,
      pendingEmergency,
      pendingAssignmentAcceptance,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
