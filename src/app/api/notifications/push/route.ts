/**
 * عافيتك — Send Push Notification API
 * Sends FCM push notifications to users AND stores in MongoDB
 * Works even when the app is closed via service worker
 *
 * Supports:
 * - Single user: { userId, userType, title, message, type }
 * - Bulk users: { userIds[], userType, title, message, type }
 * - All of type: { sendToAllOfType: true, userType, title, message, type }
 */

import { NextRequest, NextResponse } from 'next/server'
import { messaging, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'
import { connectToDatabase, docToObject } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

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
    if (!firebaseInitialized || !messaging) {
      console.warn('FCM not initialized, skipping push notification')
      return { sent: 0, failed: 0 }
    }

    if (!userId) {
      console.warn('FCM: No userId provided, skipping')
      return { sent: 0, failed: 0 }
    }

    await connectToDatabase()
    const FcmToken = mongoose.models.FcmToken

    // Get all active FCM tokens for this user
    const tokens = await FcmToken.find({ userId, userType, isActive: true }).lean()

    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for ${userType}/${userId}`)
      return { sent: 0, failed: 0 }
    }

    // Determine the correct Android channel ID based on type
    let channelId = 'aafiatak_default'
    if (type === 'emergency') channelId = 'aafiatak_emergency'
    else if (type === 'assignment') channelId = 'aafiatak_assignment'
    else if (type === 'chat') channelId = 'aafiatak_chat'
    else if (type === 'payment') channelId = 'aafiatak_payment'

    // Send to each token individually (better error handling)
    for (const tokenDoc of tokens) {
      const token = tokenDoc.token
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
              icon: 'ic_launcher',
              sound: 'default',
              tag: `aafiatak-${type}`,
              channelId,
            },
          },
        }

        await messaging.send(message)
        sent++
      } catch (error: any) {
        failed++
        console.error(`FCM send failed for token ${token?.substring(0, 20)}...:`, error.message)

        // If token is invalid, deactivate it
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          try {
            await FcmToken.updateOne({ _id: tokenDoc._id }, { isActive: false })
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
    await connectToDatabase()
    const PushNotification = mongoose.models.PushNotification
    const User = mongoose.models.User

    const body = await request.json()
    const { userId, userType, title, message, type, data, userIds, sendToAllOfType } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'العنوان والنوع مطلوبان' }, { status: 400 })
    }

    const validTypes = ['appointment', 'assignment', 'payment', 'rating', 'reminder', 'system', 'emergency', 'chat', 'status_change']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع الإشعار غير صالح' }, { status: 400 })
    }

    // Store notification in MongoDB
    const notificationData: Record<string, any> = {
      title,
      message: message || '',
      type,
      data: data || null,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    let storedCount = 0
    let fcmResult = { sent: 0, failed: 0 }

    // ══════════════════════════════════════════
    // Send to ALL users of a specific type
    // (e.g., notify ALL admins when a new order comes in)
    // ══════════════════════════════════════════
    if (sendToAllOfType && userType) {
      const validUserTypes = ['beneficiary', 'nurse', 'admin']
      if (!validUserTypes.includes(userType)) {
        return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
      }

      // Find all users of this type
      const targetUsers = await User.find({ role: userType, isActive: { $ne: false } })
        .select('_id')
        .lean()

      const targetUserIds = targetUsers.map((u: any) => String(u._id))

      if (targetUserIds.length === 0) {
        console.log(`No active ${userType} users found for sendToAllOfType`)
        return NextResponse.json({
          success: true,
          stored: 0,
          fcmSent: 0,
          fcmFailed: 0,
          message: `لا يوجد مستخدمين من نوع ${userType}`,
        })
      }

      // Store notification for each user
      const bulkNotifications = targetUserIds.map((uid: string) => ({
        ...notificationData,
        userId: uid,
        userType,
      }))

      await PushNotification.insertMany(bulkNotifications)
      storedCount = targetUserIds.length

      // Send FCM to all users of this type
      fcmResult = await sendBulkFCMNotification(targetUserIds, userType, title, message || '', type, data)

      return NextResponse.json({
        success: true,
        stored: storedCount,
        fcmSent: fcmResult.sent,
        fcmFailed: fcmResult.failed,
      }, { status: 201 })
    }

    // ══════════════════════════════════════════
    // Store and send for single user
    // ══════════════════════════════════════════
    if (userId && userType) {
      const validUserTypes = ['beneficiary', 'nurse', 'admin']
      if (!validUserTypes.includes(userType)) {
        return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
      }

      notificationData.userId = userId
      notificationData.userType = userType

      await PushNotification.create(notificationData)
      storedCount = 1

      // Send FCM push notification
      fcmResult = await sendFCMNotification(userId, userType, title, message || '', type, data)
    }

    // ══════════════════════════════════════════
    // Store and send for multiple users
    // ══════════════════════════════════════════
    if (userIds && Array.isArray(userIds) && userType) {
      const bulkNotifications = userIds.map((uid: string) => ({
        ...notificationData,
        userId: uid,
        userType,
      }))

      await PushNotification.insertMany(bulkNotifications)
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
