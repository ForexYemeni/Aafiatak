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
    const { requestId, beneficiaryId, amount, paymentMethod, transactionRef } = body

    if (!requestId || !beneficiaryId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'معرف الطلب والمستفيد والمبلغ وطريقة الدفع مطلوبون' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون رقماً أكبر من صفر' }, { status: 400 })
    }

    const validPaymentMethods = ['cash', 'card', 'wallet', 'bank-transfer']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'طريقة الدفع غير صالحة' }, { status: 400 })
    }

    // Verify beneficiary exists
    const benefDoc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
    if (!benefDoc.exists) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Verify service request exists
    const requestDoc = await firestore.collection('serviceRequests').doc(requestId).get()
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Determine payment status: paid if transactionRef provided, otherwise pending
    const paymentStatus = transactionRef ? 'paid' : 'pending'

    const transactionData = {
      requestId,
      beneficiaryId,
      beneficiaryName: benefDoc.data()!.name || 'غير معروف',
      amount,
      paymentMethod,
      transactionRef: transactionRef || null,
      status: paymentStatus,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('transactions').add(transactionData)

    // If payment is successful, update the service request status
    if (paymentStatus === 'paid') {
      await firestore.collection('serviceRequests').doc(requestId).update({
        paymentStatus: 'paid',
        paymentMethod,
        transactionId: docRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({
      id: docRef.id,
      ...transactionData,
      message: paymentStatus === 'paid'
        ? 'تمت عملية الدفع بنجاح'
        : 'تم إنشاء معاملة الدفع في انتظار التأكيد',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Process payment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
