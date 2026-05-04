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
    const { userId, userType, title, message, type, data } = body

    if (!userId || !userType || !title || !message || !type) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 })
    }

    const validUserTypes = ['beneficiary', 'nurse', 'admin']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
    }

    const validTypes = ['appointment', 'assignment', 'payment', 'rating', 'reminder', 'system', 'emergency', 'chat']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع الإشعار غير صالح' }, { status: 400 })
    }

    const notificationData = {
      userId,
      userType,
      title,
      message,
      type,
      data: data || null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await firestore.collection('pushNotifications').add(notificationData)

    return NextResponse.json({
      id: docRef.id,
      ...notificationData,
      message: 'تم إرسال الإشعار بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Send push notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
