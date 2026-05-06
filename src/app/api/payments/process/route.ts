import { NextRequest, NextResponse } from 'next/server'
import { getBeneficiaryById, updateServiceRequest, updateEmergencyRequest } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'
import { convertTimestamps } from '@/lib/mongodb'
import { notifyBeneficiaryServer, notifyAdminServer, notifyNurseServer } from '@/lib/server-notifications'

function docToObject(doc: any) {
  if (!doc) return null
  const obj = doc.toObject ? doc.toObject() : doc
  const { _id, __v, ...rest } = obj
  return { id: _id.toString(), ...rest }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'paid', 'all'

    await connectToDatabase()
    const Transaction = mongoose.models.Transaction

    let transactions = Transaction
      ? await Transaction.find().sort({ createdAt: -1 }).limit(200).lean()
      : []

    let result = transactions.map(docToObject).map(convertTimestamps)

    if (status && status !== 'all') {
      result = result.filter((t: any) => t.status === status)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get transactions error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const benef = await getBeneficiaryById(beneficiaryId)
    if (!benef) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    await connectToDatabase()
    const Transaction = mongoose.models.Transaction
    const ServiceRequest = mongoose.models.ServiceRequest
    const EmergencyRequest = mongoose.models.EmergencyRequest

    // Determine the request model based on isEmergency flag
    const RequestModel = isEmergency ? EmergencyRequest : ServiceRequest

    // Verify request exists
    const requestDoc = RequestModel ? await RequestModel.findById(requestId).lean() : null
    if (!requestDoc) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Prevent duplicate transactions for the same request
    const existingTx = Transaction ? await Transaction.findOne({
      requestId,
      status: { $in: ['pending', 'pending_confirmation', 'paid'] },
    }).lean() : null
    if (existingTx) {
      return NextResponse.json({ error: 'يوجد معاملة دفع سابقة لهذا الطلب', existingTransactionId: existingTx._id.toString() }, { status: 409 })
    }

    // For wallet/exchange/bank: payment proof submitted via WhatsApp
    // Set to pending_confirmation since user is proving payment
    const isCashOnDelivery = paymentMethod === 'cash'
    const paymentStatus = isCashOnDelivery ? 'pending' : 'pending_confirmation'

    const transactionData: Record<string, any> = {
      requestId,
      beneficiaryId,
      beneficiaryName: benef.name || 'غير معروف',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const doc = Transaction ? await Transaction.create(transactionData) : null
    const docId = doc ? doc._id.toString() : ''

    // Update the request with payment info and change status to pending_confirmation
    const requestUpdateData: Record<string, any> = {
      paymentStatus: paymentStatus,
      paymentMethod,
      transactionId: docId,
      updatedAt: new Date(),
    }
    // If electronic payment, change request status to pending_confirmation
    if (!isCashOnDelivery) {
      requestUpdateData.status = 'pending_confirmation'
    } else {
      requestUpdateData.status = 'pending_confirmation'
      requestUpdateData.paymentMethod = 'cash_on_delivery'
    }
    if (RequestModel) {
      await RequestModel.findByIdAndUpdate(requestId, requestUpdateData)
    }

    // ─── Send push notifications ───
    // Notify admins about new payment proof
    const amountStr = `${amount} ر.ي`
    notifyAdminServer.paymentProof(benef.name || 'مستفيد', amountStr).catch(() => {})

    // Return the created transaction data
    const createdData = doc ? convertTimestamps(docToObject(doc)) : transactionData

    return NextResponse.json({
      id: docId,
      ...createdData,
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
    const body = await request.json()
    const { transactionId, action, adminId } = body // action: 'confirm' or 'reject'

    if (!transactionId || !action || !adminId) {
      return NextResponse.json({ error: 'معرف المعاملة والإجراء ومعرف المدير مطلوبون' }, { status: 400 })
    }

    await connectToDatabase()
    const Transaction = mongoose.models.Transaction
    const Admin = mongoose.models.Admin
    const SubAdmin = mongoose.models.SubAdmin
    const ServiceRequest = mongoose.models.ServiceRequest
    const EmergencyRequest = mongoose.models.EmergencyRequest

    // Verify admin exists and has proper role
    const adminDoc = Admin ? await Admin.findById(adminId).lean() : null
    if (!adminDoc) {
      const subAdminDoc = SubAdmin ? await SubAdmin.findById(adminId).lean() : null
      if (!subAdminDoc) {
        return NextResponse.json({ error: 'المدير غير موجود أو غير مصرح له' }, { status: 403 })
      }
      if (subAdminDoc.status === 'blocked') {
        return NextResponse.json({ error: 'حساب المدير معطل' }, { status: 403 })
      }
    } else {
      if (adminDoc.status === 'blocked') {
        return NextResponse.json({ error: 'حساب المدير معطل' }, { status: 403 })
      }
    }

    const transDoc = Transaction ? await Transaction.findById(transactionId).lean() : null
    if (!transDoc) {
      return NextResponse.json({ error: 'المعاملة غير موجودة' }, { status: 404 })
    }

    if (action === 'confirm') {
      // Mark payment as confirmed/paid
      if (Transaction) {
        await Transaction.findByIdAndUpdate(transactionId, {
          status: 'paid',
          confirmedBy: adminId,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Update request payment status to 'paid' (support both service and emergency requests)
      if (transDoc.requestId) {
        const RequestModel = transDoc.isEmergency ? EmergencyRequest : ServiceRequest
        if (RequestModel) {
          await RequestModel.findByIdAndUpdate(transDoc.requestId, {
            paymentStatus: 'paid',
            status: 'pending_confirmation',
            updatedAt: new Date(),
          })
        }
      }

      // ─── Send push notifications ───
      // Notify beneficiary about payment confirmation
      const beneficiaryId = transDoc.beneficiaryId?.toString()
      if (beneficiaryId) {
        notifyBeneficiaryServer.paymentConfirmed(beneficiaryId, transDoc.requestId?.toString() || '').catch(() => {})
      }
      // Notify admins about payment confirmation
      notifyAdminServer.paymentConfirmed(transDoc.beneficiaryName || 'مستفيد', `${transDoc.amount || 0} ر.ي`).catch(() => {})

      return NextResponse.json({ message: 'تم تأكيد الدفع بنجاح. يمكن الآن تنفيذ الطلب' })
    } else if (action === 'reject') {
      if (Transaction) {
        await Transaction.findByIdAndUpdate(transactionId, {
          status: 'rejected',
          confirmedBy: adminId,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Update request payment status to 'rejected' (support both service and emergency requests)
      if (transDoc.requestId) {
        const RequestModel = transDoc.isEmergency ? EmergencyRequest : ServiceRequest
        if (RequestModel) {
          await RequestModel.findByIdAndUpdate(transDoc.requestId, {
            paymentStatus: 'rejected',
            updatedAt: new Date(),
          })
        }
      }

      // ─── Send push notifications ───
      // Notify beneficiary about payment rejection
      const rejBeneficiaryId = transDoc.beneficiaryId?.toString()
      if (rejBeneficiaryId) {
        notifyBeneficiaryServer.paymentRejected(rejBeneficiaryId, transDoc.requestId?.toString() || '').catch(() => {})
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
