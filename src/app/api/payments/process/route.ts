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
    const status = searchParams.get('status') // 'pending', 'paid', 'all'

    let query = firestore.collection('transactions').orderBy('createdAt', 'desc')

    const snapshot = await query.limit(200).get()
    let transactions = snapshot.docs.map(docToObject)

    if (status && status !== 'all') {
      transactions = transactions.filter((t: any) => t.status === status)
    }

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Get transactions error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { requestId, beneficiaryId, amount, paymentMethod, transactionRef, senderName, senderPhone, exchangeName } = body

    if (!requestId || !beneficiaryId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'معرف الطلب والمستفيد والمبلغ وطريقة الدفع مطلوبون' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون رقماً أكبر من صفر' }, { status: 400 })
    }

    // Yemen local payment methods
    const validPaymentMethods = [
      'cash',                        // نقدي عند الاستلام
      'wallet-deposit',              // إيداع عبر محفظة (Zain Cash, HalaCash, etc.)
      'exchange-transfer',           // تحويل عبر صراف
      'bank-transfer',               // تحويل بنكي
    ]
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

    // For wallet/exchange/bank: require transaction reference (proof of payment)
    // Payment is 'pending' until admin confirms
    const isCashOnDelivery = paymentMethod === 'cash'
    const paymentStatus = isCashOnDelivery ? 'pending' : (transactionRef ? 'pending_confirmation' : 'pending')

    const transactionData = {
      requestId,
      beneficiaryId,
      beneficiaryName: benefDoc.data()!.name || 'غير معروف',
      amount,
      paymentMethod,
      transactionRef: transactionRef || null,
      senderName: senderName || null,
      senderPhone: senderPhone || null,
      exchangeName: exchangeName || null,
      status: paymentStatus,
      confirmedBy: null,
      confirmedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('transactions').add(transactionData)

    // Update the service request with payment info
    await firestore.collection('serviceRequests').doc(requestId).update({
      paymentStatus: paymentStatus,
      paymentMethod,
      transactionId: docRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      id: docRef.id,
      ...transactionData,
      message: paymentStatus === 'pending_confirmation'
        ? 'تم إرسال إثبات الدفع بنجاح. سيتم مراجعته من قبل الإدارة وتأكيد الطلب'
        : 'تم إنشاء معاملة الدفع بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Process payment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// PUT: Confirm a payment (admin action)
export async function PUT(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { transactionId, action, adminId } = body // action: 'confirm' or 'reject'

    if (!transactionId || !action || !adminId) {
      return NextResponse.json({ error: 'معرف المعاملة والإجراء ومعرف المدير مطلوبون' }, { status: 400 })
    }

    const transDoc = await firestore.collection('transactions').doc(transactionId).get()
    if (!transDoc.exists) {
      return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 })
    }

    const transData = transDoc.data()!

    if (action === 'confirm') {
      // Mark payment as confirmed/paid
      await firestore.collection('transactions').doc(transactionId).update({
        status: 'paid',
        confirmedBy: adminId,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Update service request payment status to 'paid'
      if (transData.requestId) {
        await firestore.collection('serviceRequests').doc(transData.requestId).update({
          paymentStatus: 'paid',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      return NextResponse.json({ message: 'تم تأكيد الدفع بنجاح. يمكن الآن تنفيذ الطلب' })
    } else if (action === 'reject') {
      await firestore.collection('transactions').doc(transactionId).update({
        status: 'rejected',
        confirmedBy: adminId,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Update service request payment status to 'rejected'
      if (transData.requestId) {
        await firestore.collection('serviceRequests').doc(transData.requestId).update({
          paymentStatus: 'rejected',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }

      return NextResponse.json({ message: 'تم رفض الدفع' })
    } else {
      return NextResponse.json({ error: 'إجراء غير صالح. استخدم confirm أو reject' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Confirm payment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
