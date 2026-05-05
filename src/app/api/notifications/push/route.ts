/**
 * عافيتك — Send Push Notification API
 * Sends FCM push notifications to users AND stores in Firestore
 * Works even when the app is closed via service worker
 */

import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

// ─── Send FCM push notification to all tokens of a user ───
async function sendFCMNotification(
  userId: string,
  userType: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  try {
    // Get all active FCM tokens for this user
    const tokenSnapshot = await firestore
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .where('userType', '==', userType)
      .where('isActive', '==', true)
      .get()

    if (tokenSnapshot.empty) {
      console.log(`No FCM tokens found for ${userType}/${userId}`)
      return { sent: 0, failed: 0 }
    }

    const tokens = tokenSnapshot.docs.map(doc => doc.data().token)

    // Send to each token individually (better error handling)
    for (const token of tokens) {
      try {
        const message: admin.messaging.Message = {
          token,
          notification: {
            title,
            body,
          },
          data: {
            type,
            userType,
            url: data?.url || '/',
            requestId: data?.requestId || '',
            clickAction: data?.url || '/',
            ...Object.fromEntries(
              Object.entries(data || {}).filter(([_, v]) => typeof v === 'string')
            ),
          },
          webpush: {
            notification: {
              title,
              body,
              icon: '/logo.png',
              badge: '/logo.png',
              dir: 'rtl' as const,
              lang: 'ar',
              requireInteraction: type === 'emergency' || type === 'assignment',
              vibrate: type === 'emergency'
                ? [200, 100, 200, 100, 200, 100, 200]
                : type === 'assignment'
                ? [200, 50, 200]
                : [100],
              tag: `aafiatak-${type}-${Date.now()}`,
              silent: false,
            },
            fcmOptions: {
              link: data?.url || '/',
            },
          },
          android: {
            notification: {
              title,
              body,
              icon: 'logo',
              sound: 'default',
              tag: `aafiatak-${type}`,
              channelId: type === 'emergency' ? 'emergency' : 'default',
            },
          },
        }

        await admin.messaging().send(message)
        sent++
      } catch (error: any) {
        failed++
        console.error(`FCM send failed for token ${token.substring(0, 20)}...:`, error.message)

        // If token is invalid, deactivate it
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          try {
            const tokenDoc = tokenSnapshot.docs.find(d => d.data().token === token)
            if (tokenDoc) {
              await tokenDoc.ref.update({ isActive: false })
            }
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  } catch (error: any) {
    console.error('FCM send error:', error.message)
  }

  return { sent, failed }
}

// ─── Send to multiple users (bulk) ───
async function sendBulkFCMNotification(
  userIds: string[],
  userType: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    const result = await sendFCMNotification(userId, userType, title, body, type, data)
    totalSent += result.sent
    totalFailed += result.failed
  }

  return { sent: totalSent, failed: totalFailed }
}

// ─── POST: Send a push notification ───
export async function POST(request: NextRequest) {
  try {
    checkFirebase()
    const body = await request.json()
    const { userId, userType, title, message, type, data, userIds } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'العنوان والنوع مطلوبان' }, { status: 400 })
    }

    const validTypes = ['appointment', 'assignment', 'payment', 'rating', 'reminder', 'system', 'emergency', 'chat', 'status_change']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع الإشعار غير صالح' }, { status: 400 })
    }

    // Store notification in Firestore
    const notificationData: Record<string, any> = {
      title,
      message: message || '',
      type,
      data: data || null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    let storedCount = 0
    let fcmResult = { sent: 0, failed: 0 }

    // Store and send for single user
    if (userId && userType) {
      const validUserTypes = ['beneficiary', 'nurse', 'admin']
      if (!validUserTypes.includes(userType)) {
        return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
      }

      notificationData.userId = userId
      notificationData.userType = userType

      await firestore.collection('pushNotifications').add(notificationData)
      storedCount = 1

      // Send FCM push notification
      fcmResult = await sendFCMNotification(userId, userType, title, message || '', type, data)
    }

    // Store and send for multiple users
    if (userIds && Array.isArray(userIds) && userType) {
      const bulkNotifications = userIds.map(uid => ({
        ...notificationData,
        userId: uid,
        userType,
      }))

      const batch = firestore.batch()
      bulkNotifications.forEach(notif => {
        batch.create(firestore.collection('pushNotifications').doc(), notif)
      })
      await batch.commit()
      storedCount = userIds.length

      // Send FCM to all users
      fcmResult = await sendBulkFCMNotification(userIds, userType, title, message || '', type, data)
    }

    return NextResponse.json({
      success: true,
      stored: storedCount,
      fcmSent: fcmResult.sent,
      fcmFailed: fcmResult.failed,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Send push notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// Export the send function for server-side use
export { sendFCMNotification, sendBulkFCMNotification }
