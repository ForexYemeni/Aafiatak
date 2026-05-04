import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  return { id: doc.id, ...doc.data() }
}

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
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    // Verify nurse exists
    const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Fetch nurse's appointments
    const appointmentsSnapshot = await firestore.collection('appointments')
      .where('nurseId', '==', nurseId)
      .get()

    // Also fetch assignments as calendar events
    const assignmentsSnapshot = await firestore.collection('serviceAssignments')
      .where('nurseId', '==', nurseId)
      .get()

    const calendarEvents: any[] = []

    // Convert appointments to calendar events
    for (const doc of appointmentsSnapshot.docs) {
      const apt = docToObject(doc)
      const serviceDoc = await firestore.collection('services').doc(apt.serviceId).get()
      const benefDoc = await firestore.collection('beneficiaries').doc(apt.beneficiaryId).get()

      calendarEvents.push({
        id: apt.id,
        type: 'appointment',
        title: serviceDoc.exists ? `موعد: ${serviceDoc.data()!.name}` : 'موعد',
        date: apt.date,
        time: apt.time,
        status: apt.status,
        notes: apt.notes || null,
        beneficiary: benefDoc.exists
          ? { id: benefDoc.id, name: benefDoc.data()!.name }
          : null,
        service: serviceDoc.exists
          ? { id: serviceDoc.id, name: serviceDoc.data()!.name }
          : null,
        createdAt: apt.createdAt,
      })
    }

    // Convert assignments to calendar events
    for (const doc of assignmentsSnapshot.docs) {
      const assignment = docToObject(doc)
      const requestDoc = await firestore.collection('serviceRequests').doc(assignment.requestId).get()

      if (requestDoc.exists) {
        const requestData = requestDoc.data()!
        const serviceDoc = await firestore.collection('services').doc(requestData.serviceId).get()
        const benefDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()

        calendarEvents.push({
          id: assignment.id,
          type: 'assignment',
          title: serviceDoc.exists ? `تعيين: ${serviceDoc.data()!.name}` : 'تعيين',
          date: null, // Assignments may not have a specific date/time
          time: null,
          status: assignment.status,
          notes: requestData.notes || null,
          beneficiary: benefDoc.exists
            ? { id: benefDoc.id, name: benefDoc.data()!.name, phone: benefDoc.data()!.phone }
            : null,
          service: serviceDoc.exists
            ? { id: serviceDoc.id, name: serviceDoc.data()!.name }
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
    checkFirebase()
    const body = await request.json()
    const { nurseId, appointmentId } = body

    if (!nurseId || !appointmentId) {
      return NextResponse.json({ error: 'معرف الممرض والموعد مطلوبان' }, { status: 400 })
    }

    // Verify nurse exists
    const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Verify appointment exists
    const appointmentDoc = await firestore.collection('appointments').doc(appointmentId).get()
    if (!appointmentDoc.exists) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    const appointmentData = appointmentDoc.data()!

    // Verify appointment belongs to this nurse
    if (appointmentData.nurseId !== nurseId) {
      return NextResponse.json({ error: 'هذا الموعد لا ينتمي لهذا الممرض' }, { status: 403 })
    }

    // Fetch related data for calendar event
    const serviceDoc = appointmentData.serviceId
      ? await firestore.collection('services').doc(appointmentData.serviceId).get()
      : null
    const benefDoc = appointmentData.beneficiaryId
      ? await firestore.collection('beneficiaries').doc(appointmentData.beneficiaryId).get()
      : null

    // Create calendar sync record
    const syncData = {
      nurseId,
      appointmentId,
      eventType: 'appointment',
      title: serviceDoc?.exists ? `موعد: ${serviceDoc.data()!.name}` : 'موعد',
      description: appointmentData.notes || '',
      date: appointmentData.date || null,
      time: appointmentData.time || null,
      beneficiary: benefDoc?.exists
        ? { id: benefDoc.id, name: benefDoc.data()!.name }
        : null,
      service: serviceDoc?.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name }
        : null,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'synced',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('calendarSync').add(syncData)

    // Update appointment to mark as synced
    await firestore.collection('appointments').doc(appointmentId).update({
      calendarSynced: true,
      calendarSyncId: docRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      id: docRef.id,
      ...syncData,
      message: 'تم مزامنة الموعد مع التقويم بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Calendar sync error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
