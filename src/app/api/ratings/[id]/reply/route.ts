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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkFirebase()
    const { id } = await params
    const body = await request.json()
    const { nurseId, reply } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف التقييم مطلوب' }, { status: 400 })
    }

    if (!nurseId || !reply) {
      return NextResponse.json({ error: 'معرف الممرض والرد مطلوبان' }, { status: 400 })
    }

    if (typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json({ error: 'الرد يجب أن يكون نصاً غير فارغ' }, { status: 400 })
    }

    // Fetch the rating
    const ratingDoc = await firestore.collection('ratings').doc(id).get()
    if (!ratingDoc.exists) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 })
    }

    const ratingData = ratingDoc.data()!

    // Verify the nurse owns this rating
    if (ratingData.nurseId !== nurseId) {
      return NextResponse.json({ error: 'لا يمكنك الرد على تقييم لا يخصك' }, { status: 403 })
    }

    // Check if already replied
    if (ratingData.nurseReply) {
      return NextResponse.json({ error: 'تم الرد على هذا التقييم مسبقاً' }, { status: 400 })
    }

    // Add nurse reply
    await firestore.collection('ratings').doc(id).update({
      nurseReply: {
        text: reply.trim(),
        repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Fetch and return updated rating
    const updatedDoc = await firestore.collection('ratings').doc(id).get()
    const updatedRating = docToObject(updatedDoc)

    return NextResponse.json({
      ...updatedRating,
      message: 'تم إضافة الرد بنجاح',
    })
  } catch (error: any) {
    console.error('Reply to rating error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
