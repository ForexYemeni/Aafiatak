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
  data?: Record<string, any>,
  voiceText?: string
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
        // ★★★ CRITICAL: Send DATA-ONLY message (NO `notification` field) ★★★
        //
        // When BOTH `notification` AND `data` fields are present, the browser
        // AUTO-HANDLES the notification and onBackgroundMessage() in the SW
        // is NEVER called. This means:
        // - No custom notification with sound/TTS/actions
        // - No system-level notification popup outside the app
        // - No voice alert capability
        //
        // By sending data-only messages:
        // - SW always receives onBackgroundMessage → shows proper notification
        // - Notification appears as system-level popup even when app is closed
        // - SW can play sound, vibrate, and include TTS data
        // - Foreground listener (onForegroundMessage) also receives data
        //
        // For Android (Capacitor APK), the data-only format still works because
        // our AafiatakFirebaseMessagingService processes data messages.
        const message: admin.messaging.Message = {
          data: {
            title,                        // ★ Title in data for SW to use
            body,                         // ★ Body in data for SW to use
            type,
            userType,
            url: data?.url || '/',
            requestId: data?.requestId || '',
            clickAction: data?.url || '/',
            // ★ النص الصوتي - يُرسل مع FCM للإشعارات الخلفية
            voiceText: voiceText || `${title}. ${body || ''}`,
            titleAr: title,
            bodyAr: body,
            titleEn: title,
            bodyEn: body,
            voicePriority: type === 'emergency' ? 'urgent' : type === 'assignment' ? 'high' : 'normal',
            // ★ Notification display options for SW
            notifIcon: '/logo-192.png',
            notifBadge: '/logo-192.png',
            notifDir: 'rtl',
            notifLang: 'ar',
            notifRequireInteraction: (type === 'emergency' || type === 'assignment') ? 'true' : 'false',
            notifSilent: 'false',
            notifTag: `aafiatak-${type}-${Date.now()}`,
            ...Object.fromEntries(
              Object.entries(data || {}).filter(([_, v]) => typeof v === 'string')
            ),
          },
          android: {
            priority: 'high' as const,
            data: {
              title,
              body,
              type,
              channelId,
              voiceText: voiceText || `${title}. ${body || ''}`,
              clickAction: data?.url || '/',
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

    const body = await request.json()
    const { userId, userType, title, message, type, data, userIds, sendToAllOfType,
            voiceText, voicePriority, voiceLang  // ★ حقول الإشعارات الصوتية
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'العنوان والنوع مطلوبان' }, { status: 400 })
    }

    const validTypes = ['appointment', 'assignment', 'payment', 'rating', 'reminder', 'system', 'emergency', 'chat', 'status_change']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع الإشعار غير صالح' }, { status: 400 })
    }

    // ★ إنشاء النص الصوتي تلقائياً
    const autoVoiceText = voiceText || `${title}. ${message || ''}`
    const autoVoicePriority = voicePriority || (type === 'emergency' ? 'urgent' : type === 'assignment' ? 'high' : 'normal')
    const autoVoiceLang = voiceLang || 'ar'

    // Store notification in MongoDB
    const notificationData: Record<string, any> = {
      title,
      message: message || '',
      type,
      data: data || null,
      isRead: false,
      // ★ حقول الإشعارات الصوتية - مخزنة في قاعدة البيانات
      voiceText: autoVoiceText,
      voicePriority: autoVoicePriority,
      voiceLang: autoVoiceLang,
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

      // Find all users of this type — use the correct model per userType
      let targetUsers: any[] = []
      if (userType === 'admin') {
        const Admin = mongoose.models.Admin
        const SubAdmin = mongoose.models.SubAdmin
        const admins = Admin ? await Admin.find({ status: { $ne: 'blocked' } }).select('_id').lean() : []
        const subAdmins = SubAdmin ? await SubAdmin.find({ status: { $ne: 'blocked' } }).select('_id').lean() : []
        targetUsers = [...admins, ...subAdmins]
      } else if (userType === 'nurse') {
        const Nurse = mongoose.models.Nurse
        targetUsers = Nurse ? await Nurse.find({ status: { $ne: 'blocked' } }).select('_id').lean() : []
      } else if (userType === 'beneficiary') {
        const Beneficiary = mongoose.models.Beneficiary
        targetUsers = Beneficiary ? await Beneficiary.find({ status: { $ne: 'blocked' } }).select('_id').lean() : []
      }

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

      // Store notification for each user and collect IDs
      const bulkNotifications = targetUserIds.map((uid: string) => ({
        ...notificationData,
        userId: uid,
        userType,
      }))

      const docs = await PushNotification.insertMany(bulkNotifications)
      storedCount = targetUserIds.length

      // Send FCM to all users of this type (with notification IDs for dedup)
      // We send individually to include each notification's ID
      let totalSent = 0
      let totalFailed = 0
      for (let i = 0; i < targetUserIds.length; i++) {
        const fcmDataWithId = { ...(data || {}) }
        const notifId = docs[i]?._id?.toString()
        if (notifId) {
          fcmDataWithId.id = notifId
        }
        const result = await sendFCMNotification(targetUserIds[i], userType, title, message || '', type, fcmDataWithId, autoVoiceText)
        totalSent += result.sent
        totalFailed += result.failed
      }
      fcmResult = { sent: totalSent, failed: totalFailed }

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

      // ─── DEDUP: Skip if same (userId, title, type) within 60 seconds ───
      const sixtySecondsAgo = new Date(Date.now() - 60000)
      const existing = await PushNotification.findOne({
        userId,
        userType,
        title,
        type,
        createdAt: { $gte: sixtySecondsAgo },
      }).lean()

      if (existing) {
        console.log(`[Dedup/HTTP] Skipping duplicate notification for ${userType}/${userId}: "${title}"`)
        // Still send FCM (the push message might not have been delivered)
        const fcmDataWithId = { ...(data || {}) }
        const existingId = existing._id?.toString()
        if (existingId) fcmDataWithId.id = existingId
        fcmResult = await sendFCMNotification(userId, userType, title, message || '', type, fcmDataWithId, autoVoiceText)
        return NextResponse.json({
          success: true,
          stored: 0,
          fcmSent: fcmResult.sent,
          fcmFailed: fcmResult.failed,
          deduped: true,
        })
      }

      notificationData.userId = userId
      notificationData.userType = userType

      const doc = await PushNotification.create(notificationData)
      storedCount = 1

      // Include notification ID in FCM data for client-side deduplication
      const fcmDataWithId = { ...(data || {}) }
      const notifId = doc._id?.toString()
      if (notifId) {
        fcmDataWithId.id = notifId
      }

      // Send FCM push notification
      fcmResult = await sendFCMNotification(userId, userType, title, message || '', type, fcmDataWithId, autoVoiceText)
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

      const docs = await PushNotification.insertMany(bulkNotifications)
      storedCount = userIds.length

      // Send FCM to all users (with notification IDs for dedup)
      let totalSent = 0
      let totalFailed = 0
      for (let i = 0; i < userIds.length; i++) {
        const fcmDataWithId = { ...(data || {}) }
        const notifId = docs[i]?._id?.toString()
        if (notifId) {
          fcmDataWithId.id = notifId
        }
        const result = await sendFCMNotification(userIds[i], userType, title, message || '', type, fcmDataWithId, autoVoiceText)
        totalSent += result.sent
        totalFailed += result.failed
      }
      fcmResult = { sent: totalSent, failed: totalFailed }
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
