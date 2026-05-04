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
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'رقم الهاتف والرسالة مطلوبان' }, { status: 400 })
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[0-9]{10,15}$/
    if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 })
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'الرسالة يجب أن تكون نصاً غير فارغ' }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'الرسالة طويلة جداً (الحد الأقصى 1000 حرف)' }, { status: 400 })
    }

    // Create WhatsApp message record in queue
    const queueData = {
      phone: phone.replace(/[\s\-()]/g, ''),
      message: message.trim(),
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      lastAttemptAt: null,
      sentAt: null,
      error: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('whatsappQueue').add(queueData)

    return NextResponse.json({
      id: docRef.id,
      ...queueData,
      message: 'تم إضافة الرسالة إلى قائمة الانتظار',
    }, { status: 201 })
  } catch (error: any) {
    console.error('WhatsApp notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
