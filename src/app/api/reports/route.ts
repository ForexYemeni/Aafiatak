import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { reporterId, reporterType, reportedId, reportedType, type, description, images } = body

    if (!reporterId || !reporterType || !reportedId || !reportedType || !type || !description) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 })
    }

    const validReporterTypes = ['beneficiary', 'nurse']
    const validReportedTypes = ['beneficiary', 'nurse', 'service']
    const validTypes = ['complaint', 'misconduct', 'no-show', 'late', 'quality', 'other']

    if (!validReporterTypes.includes(reporterType)) {
      return NextResponse.json({ error: 'نوع المبلغ غير صالح' }, { status: 400 })
    }
    if (!validReportedTypes.includes(reportedType)) {
      return NextResponse.json({ error: 'نوع المبلغ عنه غير صالح' }, { status: 400 })
    }
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع البلاغ غير صالح' }, { status: 400 })
    }

    // Fetch reporter name
    let reporterName = 'غير معروف'
    const reporterCollection = reporterType === 'beneficiary' ? 'beneficiaries' : 'nurses'
    const reporterDoc = await firestore.collection(reporterCollection).doc(reporterId).get()
    if (reporterDoc.exists) {
      const data = reporterDoc.data()!
      reporterName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
    }

    // Fetch reported entity name
    let reportedName = 'غير معروف'
    const reportedCollection = reportedType === 'beneficiary' ? 'beneficiaries' : reportedType === 'nurse' ? 'nurses' : 'services'
    const reportedDoc = await firestore.collection(reportedCollection).doc(reportedId).get()
    if (reportedDoc.exists) {
      const data = reportedDoc.data()!
      reportedName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()
    }

    const reportData = {
      reporterId,
      reporterType,
      reporterName,
      reportedId,
      reportedType,
      reportedName,
      type,
      description,
      images: images || [],
      status: 'pending',
      adminNotes: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('reports').add(reportData)

    return NextResponse.json({
      id: docRef.id,
      ...reportData,
      message: 'تم إنشاء البلاغ بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create report error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
