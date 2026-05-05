/**
 * عافيتك — Update Notification (mark as read, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

// ─── PATCH: Update notification (mark as read) ───
export async function PATCH(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
    }

    await firestore.collection('pushNotifications').doc(notificationId).update({
      isRead: isRead !== undefined ? isRead : true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
