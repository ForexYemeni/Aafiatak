import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data()
  const converted = {} as Record<string, any>
  for (const key of Object.keys(data || {})) {
    const val = data![key]
    if (val && typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
      converted[key] = { seconds: val.seconds, nanoseconds: val.nanoseconds }
    } else if (val && typeof val === 'object' && '_seconds' in val && '_nanoseconds' in val) {
      converted[key] = { seconds: val._seconds, nanoseconds: val._nanoseconds }
    } else {
      converted[key] = val
    }
  }
  return { id: doc.id, ...converted }
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
    const { requestId, beneficiaryId, amount, paymentMethod, transactionRef, senderName, senderPhone, exchangeName, isEmergency } = body

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

    // Determine the request collection based on isEmergency flag
    const requestCollection = isEmergency ? 'emergencyRequests' : 'serviceRequests'

    // Verify request exists
    const requestDoc = await firestore.collection(requestCollection).doc(requestId).get()
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Prevent duplicate transactions for the same request
    const existingTxSnapshot = await firestore.collection('transactions')
      .where('requestId', '==', requestId)
      .where('status', 'in', ['pending', 'pending_confirmation', 'paid'])
      .limit(1)
      .get()
    if (!existingTxSnapshot.empty) {
      return NextResponse.json({ error: 'يوجد معاملة دفع سابقة لهذا الطلب', existingTransactionId: existingTxSnapshot.docs[0].id }, { status: 409 })
    }

    // For wallet/exchange/bank: payment proof submitted via WhatsApp
    // Set to pending_confirmation since user is proving payment
    const isCashOnDelivery = paymentMethod === 'cash'
    const paymentStatus = isCashOnDelivery ? 'pending' : 'pending_confirmation'

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
      isEmergency: isEmergency || false,
      status: paymentStatus,
      confirmedBy: null,
      confirmedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('transactions').add(transactionData)

    // Update the request with payment info and change status to pending_confirmation
    const requestUpdateData: Record<string, any> = {
      paymentStatus: paymentStatus,
      paymentMethod,
      transactionId: docRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    // If electronic payment, change request status to pending_confirmation
    if (!isCashOnDelivery) {
      requestUpdateData.status = 'pending_confirmation'
    } else {
      requestUpdateData.status = 'pending_confirmation'
      requestUpdateData.paymentMethod = 'cash_on_delivery'
    }
    await firestore.collection(requestCollection).doc(requestId).update(requestUpdateData)

    // Re-read to get actual timestamps
    const createdDoc = await firestore.collection('transactions').doc(docRef.id).get()
    const createdData = createdDoc.data()
    return NextResponse.json({
      id: docRef.id,
      ...createdData ? (() => {
        const c = {} as Record<string, any>
        for (const key of Object.keys(createdData)) {
          const val = createdData[key]
          if (val && typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
            c[key] = { seconds: val.seconds, nanoseconds: val.nanoseconds }
          } else {
            c[key] = val
          }
        }
        return c
      })() : transactionData,
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

    // Verify admin exists and has proper role
    const adminDoc = await firestore.collection('admins').doc(adminId).get()
    if (!adminDoc.exists) {
      const subAdminDoc = await firestore.collection('subAdmins').doc(adminId).get()
      if (!subAdminDoc.exists) {
        return NextResponse.json({ error: 'المدير غير موجود أو غير مصرح له' }, { status: 403 })
      }
      const subAdminData = subAdminDoc.data()!
      if (subAdminData.status === 'blocked') {
        return NextResponse.json({ error: 'حساب المدير معطل' }, { status: 403 })
      }
    } else {
      const adminData = adminDoc.data()!
      if (adminData.status === 'blocked') {
        return NextResponse.json({ error: 'حساب المدير معطل' }, { status: 403 })
      }
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

      // Update request payment status to 'paid' (support both service and emergency requests)
      if (transData.requestId) {
        const requestCollection = transData.isEmergency ? 'emergencyRequests' : 'serviceRequests'
        await firestore.collection(requestCollection).doc(transData.requestId).update({
          paymentStatus: 'paid',
          status: 'pending_confirmation',
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

      // Update request payment status to 'rejected' (support both service and emergency requests)
      if (transData.requestId) {
        const requestCollection = transData.isEmergency ? 'emergencyRequests' : 'serviceRequests'
        await firestore.collection(requestCollection).doc(transData.requestId).update({
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
