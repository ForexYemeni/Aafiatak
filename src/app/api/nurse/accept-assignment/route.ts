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

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { assignmentId, nurseId, action } = body

    if (!assignmentId || !nurseId || !action) {
      return NextResponse.json({ error: 'معرف التعيين والممرض والإجراء مطلوبون' }, { status: 400 })
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'الإجراء يجب أن يكون accept أو reject' }, { status: 400 })
    }

    // Fetch assignment
    const assignmentDoc = await firestore.collection('serviceAssignments').doc(assignmentId).get()
    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    const assignmentData = assignmentDoc.data()!

    // Verify this assignment belongs to the nurse
    if (assignmentData.nurseId !== nurseId) {
      return NextResponse.json({ error: 'هذا التعيين لا ينتمي لهذا الممرض' }, { status: 403 })
    }

    // Check assignment is in a valid state for accept/reject
    if (assignmentData.status !== 'assigned' && assignmentData.status !== 'pending') {
      return NextResponse.json({ error: `لا يمكن تغيير حالة التعيين الحالية: ${assignmentData.status}` }, { status: 400 })
    }

    // Verify nurse exists and is approved
    const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected'

    // Update assignment status
    await firestore.collection('serviceAssignments').doc(assignmentId).update({
      status: newStatus,
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // If accepted, also update the service request status
    if (action === 'accept' && assignmentData.requestId) {
      await firestore.collection('serviceRequests').doc(assignmentData.requestId).update({
        status: 'in-progress',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    // If rejected, optionally update the service request to allow reassignment
    if (action === 'reject' && assignmentData.requestId) {
      await firestore.collection('serviceRequests').doc(assignmentData.requestId).update({
        status: 'approved', // Reset back to approved so admin can reassign
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    // Fetch updated assignment
    const updatedDoc = await firestore.collection('serviceAssignments').doc(assignmentId).get()
    const updatedAssignment = docToObject(updatedDoc)

    return NextResponse.json({
      ...updatedAssignment,
      message: action === 'accept' ? 'تم قبول التعيين بنجاح' : 'تم رفض التعيين',
    })
  } catch (error: any) {
    console.error('Accept/reject assignment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
