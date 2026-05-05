import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, getServiceById, getBeneficiaryById } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

function sortByCreatedAt(docs: any[], order: 'asc' | 'desc' = 'desc') {
  docs.sort((a: any, b: any) => {
    const getTime = (t: any) => {
      if (!t) return 0
      if (typeof t === 'object' && t !== null && 'seconds' in t) return t.seconds * 1000
      return new Date(t).getTime() || 0
    }
    return order === 'desc' ? getTime(b.createdAt) - getTime(a.createdAt) : getTime(a.createdAt) - getTime(b.createdAt)
  })
  return docs
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    // Verify nurse exists
    const nurse = await getNurseById(nurseId)
    if (!nurse) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    await connectToDatabase()
    const Appointment = mongoose.models.Appointment
    const ServiceAssignment = mongoose.models.ServiceAssignment
    const ServiceRequest = mongoose.models.ServiceRequest
    const Service = mongoose.models.Service
    const Beneficiary = mongoose.models.Beneficiary

    // Fetch nurse's appointments
    const appointmentsDocs = Appointment ? await Appointment.find({ nurseId }).lean() : []

    // Also fetch assignments as calendar events
    const assignmentsDocs = ServiceAssignment ? await ServiceAssignment.find({ nurseId }).lean() : []

    const calendarEvents: any[] = []

    // Convert appointments to calendar events
    for (const doc of appointmentsDocs) {
      const apt = { id: doc._id.toString(), ...doc }
      const service = apt.serviceId && Service ? await Service.findById(apt.serviceId).lean() : null
      const benef = apt.beneficiaryId && Beneficiary ? await Beneficiary.findById(apt.beneficiaryId).lean() : null

      calendarEvents.push({
        id: apt.id,
        type: 'appointment',
        title: service ? `موعد: ${service.name}` : 'موعد',
        date: apt.date,
        time: apt.time,
        status: apt.status,
        notes: apt.notes || null,
        beneficiary: benef
          ? { id: benef._id.toString(), name: benef.name }
          : null,
        service: service
          ? { id: service._id.toString(), name: service.name }
          : null,
        createdAt: apt.createdAt,
      })
    }

    // Convert assignments to calendar events
    for (const doc of assignmentsDocs) {
      const assignment = { id: doc._id.toString(), ...doc }
      const requestDoc = assignment.requestId && ServiceRequest ? await ServiceRequest.findById(assignment.requestId).lean() : null

      if (requestDoc) {
        const service = requestDoc.serviceId && Service ? await Service.findById(requestDoc.serviceId).lean() : null
        const benef = requestDoc.beneficiaryId && Beneficiary ? await Beneficiary.findById(requestDoc.beneficiaryId).lean() : null

        calendarEvents.push({
          id: assignment.id,
          type: 'assignment',
          title: service ? `تعيين: ${service.name}` : 'تعيين',
          date: null, // Assignments may not have a specific date/time
          time: null,
          status: assignment.status,
          notes: requestDoc.notes || null,
          beneficiary: benef
            ? { id: benef._id.toString(), name: benef.name, phone: benef.phone }
            : null,
          service: service
            ? { id: service._id.toString(), name: service.name }
            : null,
          createdAt: assignment.createdAt,
        })
      }
    }

    // Sort events by createdAt descending
    const sortedEvents = sortByCreatedAt(calendarEvents)

    return NextResponse.json({
      nurseId,
      events: sortedEvents,
      total: sortedEvents.length,
    })
  } catch (error: any) {
    console.error('Get calendar events error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nurseId, appointmentId } = body

    if (!nurseId || !appointmentId) {
      return NextResponse.json({ error: 'معرف الممرض والموعد مطلوبان' }, { status: 400 })
    }

    // Verify nurse exists
    const nurse = await getNurseById(nurseId)
    if (!nurse) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    await connectToDatabase()
    const Appointment = mongoose.models.Appointment
    const Service = mongoose.models.Service
    const Beneficiary = mongoose.models.Beneficiary

    // Verify appointment exists
    const appointmentDoc = Appointment ? await Appointment.findById(appointmentId).lean() : null
    if (!appointmentDoc) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    // Verify appointment belongs to this nurse
    if (appointmentDoc.nurseId !== nurseId) {
      return NextResponse.json({ error: 'هذا الموعد لا ينتمي لهذا الممرض' }, { status: 403 })
    }

    // Fetch related data for calendar event
    const service = appointmentDoc.serviceId && Service
      ? await Service.findById(appointmentDoc.serviceId).lean()
      : null
    const benef = appointmentDoc.beneficiaryId && Beneficiary
      ? await Beneficiary.findById(appointmentDoc.beneficiaryId).lean()
      : null

    // Create calendar sync record (using a generic approach with mongoose)
    // We'll use the AppSetting model pattern for storing calendar sync records
    const calendarSyncSchema = new mongoose.Schema({
      nurseId: String,
      appointmentId: String,
      eventType: String,
      title: String,
      description: String,
      date: String,
      time: String,
      beneficiary: Object,
      service: Object,
      syncedAt: Date,
      status: String,
      createdAt: Date,
    }, { strict: false })
    const CalendarSync = mongoose.models.CalendarSync || mongoose.model('CalendarSync', calendarSyncSchema, 'calendarsync')

    const syncData = {
      nurseId,
      appointmentId,
      eventType: 'appointment',
      title: service ? `موعد: ${service.name}` : 'موعد',
      description: appointmentDoc.notes || '',
      date: appointmentDoc.date || null,
      time: appointmentDoc.time || null,
      beneficiary: benef
        ? { id: benef._id.toString(), name: benef.name }
        : null,
      service: service
        ? { id: service._id.toString(), name: service.name }
        : null,
      syncedAt: new Date(),
      status: 'synced',
      createdAt: new Date(),
    }

    const syncDoc = await CalendarSync.create(syncData)

    // Update appointment to mark as synced
    await Appointment.findByIdAndUpdate(appointmentId, {
      calendarSynced: true,
      calendarSyncId: syncDoc._id.toString(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      id: syncDoc._id.toString(),
      ...syncData,
      message: 'تم مزامنة الموعد مع التقويم بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Calendar sync error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
