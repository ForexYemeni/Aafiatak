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

// Sort helper for timestamps
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
    const beneficiaryId = searchParams.get('beneficiaryId')
    const nurseId = searchParams.get('nurseId')

    if (!beneficiaryId && !nurseId) {
      return NextResponse.json({ error: 'معرف المستفيد أو الممرض مطلوب' }, { status: 400 })
    }

    let snapshot: FirebaseFirestore.QuerySnapshot

    if (beneficiaryId) {
      snapshot = await firestore.collection('appointments')
        .where('beneficiaryId', '==', beneficiaryId)
        .get()
    } else {
      snapshot = await firestore.collection('appointments')
        .where('nurseId', '==', nurseId!)
        .get()
    }

    let appointments = snapshot.docs.map(docToObject)

    // Sort by createdAt descending in code
    appointments = sortByCreatedAt(appointments)

    // Enrich with service and nurse/beneficiary info
    const enriched: any[] = []
    for (const apt of appointments) {
      const enrichedApt: Record<string, any> = { ...apt }

      if (apt.serviceId) {
        const serviceDoc = await firestore.collection('services').doc(apt.serviceId).get()
        enrichedApt.service = serviceDoc.exists
          ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
          : null
      }

      if (apt.nurseId) {
        const nurseDoc = await firestore.collection('nurses').doc(apt.nurseId).get()
        enrichedApt.nurse = nurseDoc.exists
          ? { id: nurseDoc.id, firstName: nurseDoc.data()!.firstName, lastName: nurseDoc.data()!.lastName }
          : null
      }

      if (apt.beneficiaryId) {
        const benefDoc = await firestore.collection('beneficiaries').doc(apt.beneficiaryId).get()
        enrichedApt.beneficiary = benefDoc.exists
          ? { id: benefDoc.id, name: benefDoc.data()!.name }
          : null
      }

      enriched.push(enrichedApt)
    }

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error('Get appointments error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { beneficiaryId, serviceId, nurseId, date, time, notes } = body

    if (!beneficiaryId || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'معرف المستفيد والخدمة والتاريخ والوقت مطلوبون' }, { status: 400 })
    }

    // Verify beneficiary exists
    const benefDoc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
    if (!benefDoc.exists) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Verify service exists
    const serviceDoc = await firestore.collection('services').doc(serviceId).get()
    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 })
    }

    // Verify nurse if provided
    if (nurseId) {
      const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
      if (!nurseDoc.exists) {
        return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
      }
    }

    const appointmentData: Record<string, any> = {
      beneficiaryId,
      serviceId,
      date,
      time,
      notes: notes || null,
      nurseId: nurseId || null,
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('appointments').add(appointmentData)

    // Build response
    const service = serviceDoc.exists
      ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
      : null

    return NextResponse.json({
      id: docRef.id,
      ...appointmentData,
      service,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
