import { NextRequest, NextResponse } from 'next/server'
import { getAllPaymentMethods, createPaymentMethod } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function GET() {
  try {
    const payments = await getAllPaymentMethods()
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Get payment methods error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,           // 'wallet-deposit' | 'exchange-transfer' | 'bank-transfer' | 'cash'
      name,           // Display name
      accountName,    // Name on account
      accountNumber,  // Account/phone number
      bankName,       // Bank name (for bank-transfer)
      exchangeName,   // Exchange shop name (for exchange-transfer)
      walletType,     // 'one-cash' | 'cash-wallet' | 'jawali' | etc.
      instructions,   // Payment instructions for beneficiary
      isActive,
    } = body

    if (!type) {
      return NextResponse.json({ error: 'النوع مطلوب' }, { status: 400 })
    }

    // Auto-generate name from walletType, bankName, or exchangeName if not provided
    const walletTypeLabels: Record<string, string> = {
      'one-cash': 'ون كاش',
      'cash-wallet': 'محفظة كاش',
      'jawali': 'جوالي',
      'yemen-wallet': 'يمن والت',
      'saba-cash': 'سبأكاش',
      'mahfathati': 'محفظتي',
      'pyes': 'بيس',
      'floosak': 'فلوسك',
      'jaib': 'جيب',
      'shamil-money': 'شامل مالي',
      'em-pay': 'إم باي',
      'bin-dowal-pay': 'بن دول باي',
      'national-wallet': 'المحفظة الوطنية',
      'other': 'أخرى',
    }
    let autoName = name || ''
    if (!autoName) {
      if (type === 'wallet-deposit' && walletType) {
        autoName = walletTypeLabels[walletType] || walletType
      } else if (type === 'exchange-transfer' && exchangeName) {
        autoName = `صراف ${exchangeName}`
      } else if (type === 'bank-transfer' && bankName) {
        autoName = bankName
      } else if (type === 'cash') {
        autoName = 'نقدي'
      } else {
        autoName = 'طريقة دفع'
      }
    }

    const validTypes = ['wallet-deposit', 'exchange-transfer', 'bank-transfer', 'cash']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع طريقة الدفع غير صالح' }, { status: 400 })
    }

    // Validate required fields per type
    if (type === 'wallet-deposit' && !accountName) {
      return NextResponse.json({ error: 'اسم صاحب المحفظة مطلوب' }, { status: 400 })
    }
    if (type === 'wallet-deposit' && !accountNumber) {
      return NextResponse.json({ error: 'رقم المحفظة مطلوب لطريقة الإيداع عبر محفظة' }, { status: 400 })
    }
    if (type === 'exchange-transfer' && !exchangeName) {
      return NextResponse.json({ error: 'اسم الصراف مطلوب لطريقة التحويل عبر صراف' }, { status: 400 })
    }
    if (type === 'bank-transfer' && !accountNumber) {
      return NextResponse.json({ error: 'رقم الحساب البنكي مطلوب' }, { status: 400 })
    }

    // Create payment method using the firestore helper, then add extra fields
    await connectToDatabase()
    const PaymentMethod = mongoose.models.PaymentMethod

    const paymentData: Record<string, any> = {
      type,
      name: autoName,
      accountName: accountName || '',
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      exchangeName: exchangeName || '',
      walletType: walletType || '',
      instructions: instructions || '',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const doc = PaymentMethod ? await PaymentMethod.create(paymentData) : null
    const docId = doc ? doc._id.toString() : ''

    // Re-read to get the actual document
    const createdDoc = doc ? await PaymentMethod.findById(docId).lean() : null
    const result: Record<string, any> = { id: docId }
    if (createdDoc) {
      const { _id, __v, ...rest } = createdDoc
      Object.assign(result, rest)
    } else {
      Object.assign(result, paymentData)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Create payment method error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
