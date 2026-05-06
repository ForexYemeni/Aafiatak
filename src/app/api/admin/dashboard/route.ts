import { NextResponse } from 'next/server'
import { countNurses, countBeneficiaries, countServices, countServiceRequests, getCompletedServiceRevenue, getReports } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

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

    await connectToDatabase()
    const Nurse = mongoose.models.Nurse
    const ServiceRequest = mongoose.models.ServiceRequest
    const EmergencyRequest = mongoose.models.EmergencyRequest

    // Count unverified nurses (approved but not verified)
    let unverifiedNurses = 0
    try {
      if (Nurse) {
        unverifiedNurses = await Nurse.countDocuments({ status: 'approved', isVerified: { $ne: true } })
      }
    } catch {}

    // Count pending complaints/reports
    let pendingComplaints = 0
    try {
      const reports = await getReports('pending')
      pendingComplaints = reports.length
    } catch {}

    // Count pending requests (includes pending, pending_confirmation, pending_payment)
    let allPendingRequests = 0
    try {
      if (ServiceRequest) {
        const [pendingSnap, pendingConfSnap, pendingPaySnap] = await Promise.all([
          ServiceRequest.countDocuments({ status: 'pending' }),
          ServiceRequest.countDocuments({ status: 'pending_confirmation' }),
          ServiceRequest.countDocuments({ status: 'pending_payment' }),
        ])
        allPendingRequests = pendingSnap + pendingConfSnap + pendingPaySnap
      }
    } catch {}
    let pendingPaymentConfirmations = 0
    try {
      if (ServiceRequest) {
        pendingPaymentConfirmations = await ServiceRequest.countDocuments({ status: 'pending_confirmation' })
      }
    } catch {}

    // Count pending emergency requests
    let pendingEmergency = 0
    try {
      if (EmergencyRequest) {
        pendingEmergency = await EmergencyRequest.countDocuments({ status: 'pending' })
      }
    } catch {}

    // Count assigned tasks (needs nurse acceptance)
    let pendingAssignmentAcceptance = 0
    try {
      if (ServiceRequest) {
        pendingAssignmentAcceptance = await ServiceRequest.countDocuments({ status: 'assigned' })
      }
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
      allPendingRequests,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
