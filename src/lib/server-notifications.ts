/**
 * عافيتك — Server-Side Push Notification Utility
 * Used by API routes to send FCM push notifications directly from the server
 * Unlike client-side notifications.ts, this calls FCM directly via firebase-admin
 * without going through the /api/notifications/push HTTP endpoint
 *
 * This avoids the client→server roundtrip and ensures notifications are sent
 * even when the user who triggered the action doesn't have FCM configured
 */

import { messaging, admin, firebaseInitialized } from '@/lib/firebase-admin'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

// ─── Send FCM push to all tokens of a specific user ───
async function sendFCMToUser(
  userId: string,
  userType: string,
  title: string,
  body: string,
  type: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  try {
    if (!firebaseInitialized || !messaging) {
      console.warn('⚠️ FCM not initialized, skipping push notification')
      return { sent: 0, failed: 0 }
    }

    if (!userId) return { sent: 0, failed: 0 }

    await connectToDatabase()
    const FcmToken = mongoose.models.FcmToken
    if (!FcmToken) return { sent: 0, failed: 0 }

    const tokens = await FcmToken.find({ userId, userType, isActive: true }).lean()
    if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 }

    // Android channel ID by type
    let channelId = 'aafiatak_default'
    if (type === 'emergency') channelId = 'aafiatak_emergency'
    else if (type === 'assignment') channelId = 'aafiatak_assignment'
    else if (type === 'chat') channelId = 'aafiatak_chat'
    else if (type === 'payment') channelId = 'aafiatak_payment'

    for (const tokenDoc of tokens) {
      try {
        const message: admin.messaging.Message = {
          notification: { title, body },
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
              title, body,
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
            fcmOptions: { link: data?.url || '/' },
          },
          android: {
            notification: {
              title, body,
              icon: 'ic_launcher',
              sound: 'default',
              tag: `aafiatak-${type}`,
              channelId,
            },
            priority: 'high' as const,
          },
        }

        await messaging.send(message)
        sent++
      } catch (error: any) {
        failed++
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          try { await FcmToken.updateOne({ _id: tokenDoc._id }, { isActive: false }) } catch {}
        }
      }
    }
  } catch (error: any) {
    console.error('Server notification FCM error:', error.message)
  }

  return { sent, failed }
}

// ─── Store notification in MongoDB + send FCM ───
// Includes server-side dedup: skips creation if same (userId, title, type) exists within 60s
export async function pushNotification(params: {
  userId: string
  userType: 'beneficiary' | 'nurse' | 'admin'
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'system' | 'reminder' | 'emergency' | 'payment' | 'rating' | 'chat' | 'appointment'
  data?: Record<string, string>
}): Promise<void> {
  try {
    if (!params.userId) return

    await connectToDatabase()
    const PushNotification = mongoose.models.PushNotification
    let notificationId = ''

    if (PushNotification) {
      // ─── DEDUP: Check if a very similar notification was recently created ───
      const sixtySecondsAgo = new Date(Date.now() - 60000)
      const existing = await PushNotification.findOne({
        userId: params.userId,
        userType: params.userType,
        title: params.title,
        type: params.type,
        createdAt: { $gte: sixtySecondsAgo },
      }).lean()

      if (existing) {
        console.log(`[Dedup] Skipping duplicate notification for ${params.userType}/${params.userId}: "${params.title}"`)
        // Still send FCM even for deduped notifications (the FCM message might not have been delivered)
        const fcmData = { ...params.data }
        const existingId = existing._id?.toString()
        if (existingId) fcmData.id = existingId
        await sendFCMToUser(params.userId, params.userType, params.title, params.message, params.type, fcmData)
        return
      }

      const doc = await PushNotification.create({
        userId: params.userId,
        userType: params.userType,
        title: params.title,
        message: params.message || '',
        type: params.type,
        data: params.data || null,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      notificationId = doc._id?.toString() || ''
    }

    // Include the notification ID in FCM data so the client can deduplicate
    const fcmData = { ...params.data }
    if (notificationId) {
      fcmData.id = notificationId
    }

    await sendFCMToUser(params.userId, params.userType, params.title, params.message, params.type, fcmData)
  } catch (error: any) {
    console.error('pushNotification error:', error.message)
  }
}

// ─── Push notification to ALL admins ───
// Includes dedup: skips creation if same (userId, title, type) exists within 60s
export async function pushToAllAdmins(params: {
  title: string
  message: string
  type: 'appointment' | 'assignment' | 'system' | 'emergency' | 'payment'
  data?: Record<string, string>
}): Promise<void> {
  try {
    await connectToDatabase()
    const Admin = mongoose.models.Admin
    const SubAdmin = mongoose.models.SubAdmin
    const PushNotification = mongoose.models.PushNotification

    // Collect all admin IDs (main admins + sub-admins)
    const adminIds: string[] = []

    if (Admin) {
      const admins = await Admin.find({ status: { $ne: 'blocked' } }).select('_id').lean()
      admins.forEach((a: any) => adminIds.push(String(a._id)))
    }
    if (SubAdmin) {
      const subAdmins = await SubAdmin.find({ status: { $ne: 'blocked' } }).select('_id').lean()
      subAdmins.forEach((a: any) => adminIds.push(String(a._id)))
    }

    if (adminIds.length === 0) return

    // ─── DEDUP: Check for recently created notifications for each admin ───
    const sixtySecondsAgo = new Date(Date.now() - 60000)
    const notificationIds: Record<string, string> = {} // adminId -> notificationId

    if (PushNotification) {
      // Check for existing recent notifications for ALL admins in one query
      const existingNotifs = await PushNotification.find({
        userType: 'admin',
        title: params.title,
        type: params.type,
        createdAt: { $gte: sixtySecondsAgo },
      }).lean()

      // Build a set of admin IDs that already have this notification
      const adminsWithExisting = new Set(
        existingNotifs.map((n: any) => String(n.userId))
      )

      // Only create notifications for admins that don't have one yet
      const adminsNeedingNotification = adminIds.filter(id => !adminsWithExisting.has(id))

      if (adminsNeedingNotification.length > 0) {
        const bulkData = adminsNeedingNotification.map(uid => ({
          userId: uid,
          userType: 'admin',
          title: params.title,
          message: params.message || '',
          type: params.type,
          data: params.data || null,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
        const docs = await PushNotification.insertMany(bulkData)
        docs.forEach((doc: any, i: number) => {
          notificationIds[adminsNeedingNotification[i]] = doc._id?.toString() || ''
        })
      }

      // For admins that already have the notification, use their existing ID
      existingNotifs.forEach((n: any) => {
        const adminId = String(n.userId)
        notificationIds[adminId] = n._id?.toString() || ''
      })

      if (adminsWithExisting.size > 0) {
        console.log(`[Dedup/Admins] Skipped ${adminsWithExisting.size} duplicate admin notifications for "${params.title}"`)
      }
    }

    // Send FCM to each admin with the notification ID for dedup
    for (const adminId of adminIds) {
      const fcmData = { ...params.data }
      const notifId = notificationIds[adminId]
      if (notifId) {
        fcmData.id = notifId
      }
      await sendFCMToUser(adminId, 'admin', params.title, params.message, params.type, fcmData)
    }
  } catch (error: any) {
    console.error('pushToAllAdmins error:', error.message)
  }
}

// ══════════════════════════════════════════════════════════
//  PRE-BUILT SERVER-SIDE NOTIFICATION FUNCTIONS
//  These mirror the client-side templates but run on the server
// ══════════════════════════════════════════════════════════

// ─── Beneficiary Notifications ───
export const notifyBeneficiaryServer = {
  orderApproved: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم قبول طلبك ✓',
      message: 'تمت الموافقة على طلبك وسيتم تعيين ممرض قريباً',
      type: 'status_change',
      data: { requestId: orderId, url: '/' },
    }),

  orderRejected: (beneficiaryId: string, reason: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم رفض الطلب ❌',
      message: `سبب الرفض: ${reason}`,
      type: 'status_change',
    }),

  nurseAssigned: (beneficiaryId: string, nurseName: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم تعيين ${nurseName} 🏥`,
      message: `الممرض/ة ${nurseName} في طريقه إليك`,
      type: 'assignment',
      data: { requestId: orderId, url: '/' },
    }),

  nurseEnRoute: (beneficiaryId: string, nurseName: string, eta: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'الممرض في الطريق 🚗',
      message: `${nurseName} سيصل خلال ${eta}`,
      type: 'status_change',
      data: { url: '/' },
    }),

  orderCompleted: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم إكمال الخدمة ✅',
      message: 'تم إكمال الخدمة بنجاح. يرجى تقييم تجربتك!',
      type: 'rating',
      data: { requestId: orderId, url: '/' },
    }),

  orderInProgress: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'بدء تنفيذ الطلب 🔄',
      message: 'تم بدء تنفيذ طلبك، الممرض في الطريق إليك',
      type: 'status_change',
      data: { requestId: orderId, url: '/' },
    }),

  paymentConfirmed: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم تأكيد الدفع 💰',
      message: 'تم تأكيد استلام الدفع بنجاح',
      type: 'payment',
      data: { requestId: orderId, url: '/' },
    }),

  paymentRejected: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم رفض الدفع ❌',
      message: 'تم رفض إثبات الدفع. يرجى إعادة الإرسال أو التواصل مع الإدارة',
      type: 'payment',
      data: { requestId: orderId, url: '/' },
    }),

  accountBlocked: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم حظر الحساب 🚫',
      message: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل',
      type: 'system',
    }),

  accountUnblocked: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم تفعيل الحساب ✓',
      message: 'تم تفعيل حسابك مرة أخرى. يمكنك الآن استخدام التطبيق',
      type: 'system',
    }),

  newCoupon: (beneficiaryId: string, code: string, discount: number) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'كوبون خصم جديد! 🎁',
      message: `كوبون ${code} بنسبة خصم ${discount}% — استخدمه في طلبك القادم!`,
      type: 'system',
    }),

  assignmentAccepted: (beneficiaryId: string, nurseName: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم قبول المهمة من ${nurseName} ✓`,
      message: `الممرض/ة ${nurseName} قبل المهمة وسيكون في طريقه قريباً`,
      type: 'assignment',
      data: { requestId: orderId, url: '/' },
    }),

  assignmentRejectedByNurse: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'جارٍ البحث عن ممرض بديل 🔄',
      message: 'الممرض المعيّن لم يتمكن من تنفيذ الطلب. سيتم تعيين ممرض بديل',
      type: 'status_change',
      data: { requestId: orderId, url: '/' },
    }),

  emergencyAccepted: (beneficiaryId: string, nurseName: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم الاستجابة للطوارئ 🚨`,
      message: `الممرض/ة ${nurseName} في طريقه إليك الآن!`,
      type: 'emergency',
      data: { url: '/' },
    }),

  emergencyCompleted: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم إنهاء حالة الطوارئ ✅',
      message: 'تم إكمال معالجة حالة الطوارئ بنجاح',
      type: 'status_change',
      data: { url: '/' },
    }),
}

// ─── Nurse Notifications ───
export const notifyNurseServer = {
  accountApproved: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم تفعيل حسابك! 🎉',
      message: 'تمت الموافقة على حسابك. يمكنك الآن استقبال المهام',
      type: 'system',
    }),

  accountRejected: (nurseId: string, reason: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم رفض الحساب ❌',
      message: reason || 'تم رفض طلب تسجيلك',
      type: 'system',
    }),

  accountBlocked: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم حظر الحساب 🚫',
      message: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل',
      type: 'system',
    }),

  accountUnblocked: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم تفعيل الحساب ✓',
      message: 'تم تفعيل حسابك مرة أخرى',
      type: 'system',
    }),

  identityVerified: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم توثيق الهوية ✓',
      message: 'تم توثيق هويتك بنجاح. حسابك موثوق الآن!',
      type: 'system',
    }),

  newAssignment: (nurseId: string, serviceName: string, orderId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'مهمة جديدة! 📋',
      message: `لديك مهمة جديدة: ${serviceName}`,
      type: 'assignment',
      data: { requestId: orderId, url: '/?tab=assignments' },
    }),

  emergencyAssignment: (nurseId: string, beneficiaryName: string, orderId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: '🚨 مهمة طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة!`,
      type: 'emergency',
      data: { requestId: orderId, url: '/?tab=assignments' },
    }),

  assignmentCancelled: (nurseId: string, serviceName: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم إلغاء المهمة ❌',
      message: `تم إلغاء مهمة "${serviceName}". سيتم تعيين مهمة بديلة قريباً`,
      type: 'status_change',
    }),

  newRating: (nurseId: string, rating: number) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: `تقييم جديد ⭐ ${rating}/5`,
      message: 'تلقيت تقييماً جديداً من مستفيد',
      type: 'rating',
    }),

  paymentReceived: (nurseId: string, amount: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم استلام الدفع 💰',
      message: `تم تأكيد استلام مبلغ ${amount} ر.ي`,
      type: 'payment',
    }),

  taskReminder: (nurseId: string, serviceName: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تذكير ⏰',
      message: `مهمة "${serviceName}" بانتظار البدء`,
      type: 'reminder',
    }),
}

// ─── Admin Notifications ───
export const notifyAdminServer = {
  newOrder: (beneficiaryName: string, serviceName: string, orderId: string) =>
    pushToAllAdmins({
      title: 'طلب جديد! 📥',
      message: `${beneficiaryName} طلب ${serviceName}`,
      type: 'appointment',
      data: { requestId: orderId, url: '/?tab=requests' },
    }),

  newRegistration: (name: string, role: string) =>
    pushToAllAdmins({
      title: 'تسجيل جديد 👤',
      message: `${name} سجّل كـ${role}`,
      type: 'system',
    }),

  emergencyRequest: (beneficiaryName: string, orderId: string) =>
    pushToAllAdmins({
      title: '🚨 طلب طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة`,
      type: 'emergency',
      data: { requestId: orderId, url: '/?tab=emergency' },
    }),

  paymentProof: (beneficiaryName: string, amount: string) =>
    pushToAllAdmins({
      title: 'إثبات دفع جديد 💳',
      message: `${beneficiaryName} أرسل إثبات دفع بمبلغ ${amount}`,
      type: 'payment',
    }),

  nurseRejectedTask: (nurseName: string, reason: string) =>
    pushToAllAdmins({
      title: `رفض مهمة من ${nurseName} ⚠️`,
      message: `السبب: ${reason}`,
      type: 'assignment',
    }),

  nurseAcceptedTask: (nurseName: string, serviceName: string) =>
    pushToAllAdmins({
      title: `قبول مهمة من ${nurseName} ✓`,
      message: `قبل مهمة: ${serviceName}`,
      type: 'assignment',
    }),

  newComplaint: (fromName: string) =>
    pushToAllAdmins({
      title: 'شكوى جديدة 📝',
      message: `شكوى من ${fromName}`,
      type: 'system',
    }),

  newRating: (nurseName: string, rating: number) =>
    pushToAllAdmins({
      title: `تقييم جديد ⭐ ${rating}/5`,
      message: `تقييم جديد للممرض/ة ${nurseName}`,
      type: 'rating',
    }),

  paymentConfirmed: (beneficiaryName: string, amount: string) =>
    pushToAllAdmins({
      title: 'تأكيد دفع 💰',
      message: `تم تأكيد دفع ${amount} ر.ي من ${beneficiaryName}`,
      type: 'payment',
    }),

  requestStatusChanged: (status: string, beneficiaryName: string, orderId: string) =>
    pushToAllAdmins({
      title: `تحديث حالة طلب 🔄`,
      message: `طلب ${beneficiaryName}: ${status}`,
      type: 'status_change',
      data: { requestId: orderId },
    }),
}
