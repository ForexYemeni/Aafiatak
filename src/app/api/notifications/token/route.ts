/**
 * عافيتك — FCM Token Management API
 * Saves, updates, and removes FCM tokens in Firestore
 */

import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

// ─── POST: Save or update FCM token ───
export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { userId, userType, token } = body

    if (!userId || !userType || !token) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const validUserTypes = ['beneficiary', 'nurse', 'admin']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
    }

    // Check if token already exists for this user
    const existingTokens = await firestore
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .where('userType', '==', userType)
      .limit(10)
      .get()

    // If this exact token already exists, just update the timestamp
    let tokenUpdated = false
    const batch = firestore.batch()

    existingTokens.docs.forEach((doc) => {
      const data = doc.data()
      if (data.token === token) {
        batch.update(doc.ref, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
        })
        tokenUpdated = true
      }
    })

    if (tokenUpdated) {
      await batch.commit()
      return NextResponse.json({ message: 'تم تحديث الرمز', updated: true })
    }

    // Deactivate old tokens for this user (keep only latest 5)
    if (existingTokens.size >= 5) {
      const oldest = existingTokens.docs
        .sort((a, b) => {
          const aTime = a.data().createdAt?._seconds || 0
          const bTime = b.data().createdAt?._seconds || 0
          return aTime - bTime
        })
      for (let i = 0; i < oldest.length - 4; i++) {
        batch.delete(oldest[i].ref)
      }
    }

    // Add new token
    const docRef = firestore.collection('fcmTokens').doc()
    batch.set(docRef, {
      userId,
      userType,
      token,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await batch.commit()

    return NextResponse.json({ message: 'تم حفظ الرمز بنجاح', id: docRef.id }, { status: 201 })
  } catch (error: any) {
    console.error('FCM token save error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── DELETE: Remove FCM tokens for a user ───
export async function DELETE(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { userId, userType, token } = body

    if (!userId || !userType) {
      return NextResponse.json({ error: 'معرف المستخدم ونوعه مطلوبان' }, { status: 400 })
    }

    let query = firestore
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .where('userType', '==', userType)

    if (token) {
      query = query.where('token', '==', token)
    }

    const snapshot = await query.get()

    const batch = firestore.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    return NextResponse.json({ message: `تم حذف ${snapshot.size} رمز`, deleted: snapshot.size })
  } catch (error: any) {
    console.error('FCM token delete error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── GET: Check token status ───
export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!userId || !userType) {
      return NextResponse.json({ error: 'معرف المستخدم ونوعه مطلوبان' }, { status: 400 })
    }

    const snapshot = await firestore
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .where('userType', '==', userType)
      .where('isActive', '==', true)
      .get()

    return NextResponse.json({
      hasToken: snapshot.size > 0,
      tokenCount: snapshot.size,
    })
  } catch (error: any) {
    console.error('FCM token check error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
