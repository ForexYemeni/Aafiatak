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

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'معرف التعيين مطلوب' }, { status: 400 })
    }

    // Fetch assignment
    const assignmentDoc = await firestore.collection('serviceAssignments').doc(assignmentId).get()
    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    const assignmentData = assignmentDoc.data()!
    const nurseId = assignmentData.nurseId

    if (!nurseId) {
      return NextResponse.json({ error: 'لم يتم تعيين ممرض لهذا الطلب' }, { status: 400 })
    }

    // Check assignment status
    if (assignmentData.status === 'completed' || assignmentData.status === 'cancelled') {
      return NextResponse.json({
        nurseId,
        assignmentStatus: assignmentData.status,
        currentLocation: null,
        message: 'التعيين مكتمل أو ملغي',
      })
    }

    // Fetch nurse's current location
    const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const nurseData = nurseDoc.data()!
    const currentLocation = nurseData.currentLocation || null

    return NextResponse.json({
      nurseId,
      nurseName: `${nurseData.firstName || ''} ${nurseData.lastName || ''}`.trim(),
      assignmentStatus: assignmentData.status,
      currentLocation,
    })
  } catch (error: any) {
    console.error('Track nurse error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
