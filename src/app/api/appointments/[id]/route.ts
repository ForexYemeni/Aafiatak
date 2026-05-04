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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkFirebase()
    const { id } = await params
    const body = await request.json()
    const { status, date, time, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 })
    }

    // Check appointment exists
    const aptDoc = await firestore.collection('appointments').doc(id).get()
    if (!aptDoc.exists) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    // Build update data with only provided fields
    const updateData: Record<string, any> = {}
    if (status !== undefined) {
      const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `حالة غير صالحة. الحالات المسموحة: ${validStatuses.join(', ')}` }, { status: 400 })
      }
      updateData.status = status
    }
    if (date !== undefined) updateData.date = date
    if (time !== undefined) updateData.time = time
    if (notes !== undefined) updateData.notes = notes

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await firestore.collection('appointments').doc(id).update(updateData)

    // Fetch and return updated document
    const updatedDoc = await firestore.collection('appointments').doc(id).get()
    const updatedApt = docToObject(updatedDoc)

    // Enrich with service info
    if (updatedApt.serviceId) {
      const serviceDoc = await firestore.collection('services').doc(updatedApt.serviceId).get()
      updatedApt.service = serviceDoc.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
        : null
    }

    return NextResponse.json(updatedApt)
  } catch (error: any) {
    console.error('Update appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkFirebase()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 })
    }

    // Check appointment exists
    const aptDoc = await firestore.collection('appointments').doc(id).get()
    if (!aptDoc.exists) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }

    await firestore.collection('appointments').doc(id).delete()

    return NextResponse.json({ message: 'تم حذف الموعد بنجاح' })
  } catch (error: any) {
    console.error('Delete appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
