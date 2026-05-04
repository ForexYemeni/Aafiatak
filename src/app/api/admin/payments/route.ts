import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

export async function GET() {
  try {
    checkFirebase()
    const snapshot = await firestore.collection('paymentMethods').orderBy('createdAt', 'desc').get()
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Get payment methods error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const {
      type,           // 'wallet-deposit' | 'exchange-transfer' | 'bank-transfer' | 'cash'
      name,           // Display name
      accountName,    // Name on account
      accountNumber,  // Account/phone number
      bankName,       // Bank name (for bank-transfer)
      exchangeName,   // Exchange shop name (for exchange-transfer)
      walletType,     // 'one-cash' | 'cash-wallet' | 'jawali' | 'yemen-wallet' | 'saba-cash' | 'mahfathati' | 'pyes' | 'floosak' | 'jaib' | 'shamil-money' | 'em-pay' | 'bin-dowal-pay' | 'national-wallet' | 'other'
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
    if (type === 'wallet-deposit' && !accountNumber) {
      return NextResponse.json({ error: 'رقم المحفظة مطلوب لطريقة الإيداع عبر محفظة' }, { status: 400 })
    }
    if (type === 'exchange-transfer' && !exchangeName) {
      return NextResponse.json({ error: 'اسم الصراف مطلوب لطريقة التحويل عبر صراف' }, { status: 400 })
    }
    if (type === 'bank-transfer' && !accountNumber) {
      return NextResponse.json({ error: 'رقم الحساب البنكي مطلوب' }, { status: 400 })
    }

    const paymentData = {
      type,
      name: autoName,
      accountName: accountName || '',
      accountNumber: accountNumber || '',
      bankName: bankName || '',
      exchangeName: exchangeName || '',
      walletType: walletType || '',
      instructions: instructions || '',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('paymentMethods').add(paymentData)
    return NextResponse.json({ id: docRef.id, ...paymentData })
  } catch (error: any) {
    console.error('Create payment method error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
