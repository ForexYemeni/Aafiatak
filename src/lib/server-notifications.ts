/**
 * عافيتك — Server-Side Push Notification Utility v2.0
 * نظام الإشعارات المتكامل عبر قاعدة البيانات
 *
 * v2.0 CHANGES:
 * =============
 * 1. ✅ كل إشعار يحتوي على voiceText مخزن في MongoDB
 * 2. ✅ الخادم يحدد النص الصوتي وليس العميل
 * 3. ✅ FCM data يحتوي على voiceText للإشعارات الخلفية
 * 4. ✅ حتى لو فشل FCM، العميل يحصل على النص الصوتي من MongoDB
 * 5. ✅ قاعدة بيانات واحدة متكاملة للإشعارات المنبثقة والصوتية
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
  voiceText: string,
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
        // ★★★ CRITICAL FIX: Send DATA-ONLY message (no `notification` field)
        // When both `notification` and `data` are present, the browser auto-handles
        // the notification and onBackgroundMessage is NEVER called in the SW.
        // By sending data-only, the SW always receives the message and can create
        // the notification with custom options (sound, TTS, actions, etc.)
        const message: admin.messaging.Message = {
          data: {
            title,                        // ★ Title in data for SW to use
            body,                         // ★ Body in data for SW to use
            type,
            userType,
            url: data?.url || '/',
            requestId: data?.requestId || '',
            clickAction: data?.url || '/',
            // ★ النص الصوتي من قاعدة البيانات - يُرسل مع FCM
            voiceText: voiceText || '',
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
              title, body,
              type,
              channelId,
              voiceText: voiceText || '',
              clickAction: data?.url || '/',
            },
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

// ══════════════════════════════════════════════════════════
//  STORE NOTIFICATION IN MONGODB + SEND FCM
//  Includes voiceText for TTS - stored in database
// ══════════════════════════════════════════════════════════

export async function pushNotification(params: {
  userId: string
  userType: 'beneficiary' | 'nurse' | 'admin'
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'system' | 'reminder' | 'emergency' | 'payment' | 'rating' | 'chat' | 'appointment'
  voiceText?: string      // ★ النص الصوتي المخصص - يُخزن في MongoDB
  voicePriority?: 'low' | 'normal' | 'high' | 'urgent'  // ★ أولوية الصوت
  voiceLang?: 'ar' | 'en'  // ★ لغة الصوت
  data?: Record<string, string>
}): Promise<void> {
  try {
    if (!params.userId) return

    await connectToDatabase()
    const PushNotification = mongoose.models.PushNotification
    let notificationId = ''

    // ★ إنشاء النص الصوتي تلقائياً إذا لم يتم توفيره
    const autoVoiceText = params.voiceText || `${params.title}. ${params.message}`
    const voicePriority = params.voicePriority || (params.type === 'emergency' ? 'urgent' : params.type === 'assignment' ? 'high' : 'normal')
    const voiceLang = params.voiceLang || 'ar'

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
        // Still send FCM even for deduped notifications
        const fcmData = { ...params.data }
        const existingId = existing._id?.toString()
        if (existingId) fcmData.id = existingId
        await sendFCMToUser(params.userId, params.userType, params.title, params.message, params.type, autoVoiceText, fcmData)
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
        // ★ حقول الإشعارات الصوتية - مخزنة في قاعدة البيانات
        voiceText: autoVoiceText,
        voicePriority: voicePriority,
        voiceLang: voiceLang,
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

    await sendFCMToUser(params.userId, params.userType, params.title, params.message, params.type, autoVoiceText, fcmData)
  } catch (error: any) {
    console.error('pushNotification error:', error.message)
  }
}

// ─── Push notification to ALL admins ───
export async function pushToAllAdmins(params: {
  title: string
  message: string
  type: 'appointment' | 'assignment' | 'system' | 'emergency' | 'payment'
  voiceText?: string      // ★ النص الصوتي المخصص
  voicePriority?: 'low' | 'normal' | 'high' | 'urgent'
  voiceLang?: 'ar' | 'en'
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

    // ★ إنشاء النص الصوتي تلقائياً
    const autoVoiceText = params.voiceText || `${params.title}. ${params.message}`
    const voicePriority = params.voicePriority || (params.type === 'emergency' ? 'urgent' : 'normal')
    const voiceLang = params.voiceLang || 'ar'

    // ─── DEDUP: Check for recently created notifications for each admin ───
    const sixtySecondsAgo = new Date(Date.now() - 60000)
    const notificationIds: Record<string, string> = {} // adminId -> notificationId

    if (PushNotification) {
      const existingNotifs = await PushNotification.find({
        userType: 'admin',
        title: params.title,
        type: params.type,
        createdAt: { $gte: sixtySecondsAgo },
      }).lean()

      const adminsWithExisting = new Set(
        existingNotifs.map((n: any) => String(n.userId))
      )

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
          // ★ حقول الإشعارات الصوتية
          voiceText: autoVoiceText,
          voicePriority: voicePriority,
          voiceLang: voiceLang,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
        const docs = await PushNotification.insertMany(bulkData)
        docs.forEach((doc: any, i: number) => {
          notificationIds[adminsNeedingNotification[i]] = doc._id?.toString() || ''
        })
      }

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
      await sendFCMToUser(adminId, 'admin', params.title, params.message, params.type, autoVoiceText, fcmData)
    }
  } catch (error: any) {
    console.error('pushToAllAdmins error:', error.message)
  }
}

// ══════════════════════════════════════════════════════════
//  PRE-BUILT SERVER-SIDE NOTIFICATION FUNCTIONS
//  ★ كل دالة تحتوي على voiceText مخصص مخزن في قاعدة البيانات
// ══════════════════════════════════════════════════════════

// ─── Beneficiary Notifications ───
export const notifyBeneficiaryServer = {
  orderApproved: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم قبول طلبك ✓',
      message: 'تمت الموافقة على طلبك وسيتم تعيين ممرض قريباً',
      type: 'status_change',
      voiceText: 'تم قبول طلبك بنجاح. سيتم تعيين ممرض لك قريباً. يرجى الانتظار.',
      voicePriority: 'high',
      data: { requestId: orderId, url: '/' },
    }),

  orderRejected: (beneficiaryId: string, reason: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم رفض الطلب ❌',
      message: `سبب الرفض: ${reason}`,
      type: 'status_change',
      voiceText: `تم رفض طلبك. السبب: ${reason}. يرجى التواصل مع الإدارة للمزيد من التفاصيل.`,
      data: {},
    }),

  nurseAssigned: (beneficiaryId: string, nurseName: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم تعيين ${nurseName} 🏥`,
      message: `الممرض/ة ${nurseName} في طريقه إليك`,
      type: 'assignment',
      voiceText: `تم تعيين الممرض ${nurseName} لطلبك. هو في الطريق إليك الآن.`,
      voicePriority: 'high',
      data: { requestId: orderId, url: '/' },
    }),

  nurseEnRoute: (beneficiaryId: string, nurseName: string, eta: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'الممرض في الطريق 🚗',
      message: `${nurseName} سيصل خلال ${eta}`,
      type: 'status_change',
      voiceText: `الممرض ${nurseName} في الطريق إليك. سيصل خلال ${eta}. تأكد من تواجدك في العنوان المحدد.`,
      voicePriority: 'high',
      data: { url: '/' },
    }),

  orderCompleted: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم إكمال الخدمة ✅',
      message: 'تم إكمال الخدمة بنجاح. يرجى تقييم تجربتك!',
      type: 'rating',
      voiceText: 'تم إكمال الخدمة بنجاح. يرجى تقييم تجربتك مع الممرض لمساعدتنا في تحسين الخدمة.',
      data: { requestId: orderId, url: '/' },
    }),

  orderInProgress: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'بدء تنفيذ الطلب 🔄',
      message: 'تم بدء تنفيذ طلبك، الممرض في الطريق إليك',
      type: 'status_change',
      voiceText: 'تم بدء تنفيذ طلبك. الممرض في الطريق إليك الآن.',
      voicePriority: 'high',
      data: { requestId: orderId, url: '/' },
    }),

  paymentConfirmed: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم تأكيد الدفع 💰',
      message: 'تم تأكيد استلام الدفع بنجاح',
      type: 'payment',
      voiceText: 'تم تأكيد الدفع بنجاح. شكراً لك.',
      data: { requestId: orderId, url: '/' },
    }),

  paymentRejected: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم رفض الدفع ❌',
      message: 'تم رفض إثبات الدفع. يرجى إعادة الإرسال أو التواصل مع الإدارة',
      type: 'payment',
      voiceText: 'تم رفض إثبات الدفع. يرجى إعادة إرسال إثبات الدفع أو التواصل مع الإدارة.',
      voicePriority: 'high',
      data: { requestId: orderId, url: '/' },
    }),

  accountBlocked: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم حظر الحساب 🚫',
      message: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل',
      type: 'system',
      voiceText: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل والمساعدة.',
      voicePriority: 'high',
    }),

  accountUnblocked: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم تفعيل الحساب ✓',
      message: 'تم تفعيل حسابك مرة أخرى. يمكنك الآن استخدام التطبيق',
      type: 'system',
      voiceText: 'تم تفعيل حسابك مرة أخرى. يمكنك الآن استخدام التطبيق بشكل طبيعي.',
    }),

  newCoupon: (beneficiaryId: string, code: string, discount: number) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'كوبون خصم جديد! 🎁',
      message: `كوبون ${code} بنسبة خصم ${discount}% — استخدمه في طلبك القادم!`,
      type: 'system',
      voiceText: `لديك كوبون خصم جديد! الكوبون ${code} بنسبة خصم ${discount} بالمئة. استخدمه في طلبك القادم!`,
    }),

  assignmentAccepted: (beneficiaryId: string, nurseName: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم قبول المهمة من ${nurseName} ✓`,
      message: `الممرض/ة ${nurseName} قبل المهمة وسيكون في طريقه قريباً`,
      type: 'assignment',
      voiceText: `الممرض ${nurseName} قبل المهمة وسيكون في طريقه إليك قريباً.`,
      voicePriority: 'high',
      data: { requestId: orderId, url: '/' },
    }),

  assignmentRejectedByNurse: (beneficiaryId: string, orderId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'جارٍ البحث عن ممرض بديل 🔄',
      message: 'الممرض المعيّن لم يتمكن من تنفيذ الطلب. سيتم تعيين ممرض بديل',
      type: 'status_change',
      voiceText: 'الممرض المعين لم يتمكن من تنفيذ الطلب. جار البحث عن ممرض بديل لك.',
      data: { requestId: orderId, url: '/' },
    }),

  emergencyAccepted: (beneficiaryId: string, nurseName: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: `تم الاستجابة للطوارئ 🚨`,
      message: `الممرض/ة ${nurseName} في طريقه إليك الآن!`,
      type: 'emergency',
      voiceText: `تنبيه طوارئ! الممرض ${nurseName} استجاب لطلب الطوارئ وهو في الطريق إليك الآن!`,
      voicePriority: 'urgent',
      data: { url: '/' },
    }),

  emergencyCompleted: (beneficiaryId: string) =>
    pushNotification({
      userId: beneficiaryId, userType: 'beneficiary',
      title: 'تم إنهاء حالة الطوارئ ✅',
      message: 'تم إكمال معالجة حالة الطوارئ بنجاح',
      type: 'status_change',
      voiceText: 'تم إكمال معالجة حالة الطوارئ بنجاح. نتمنى لك السلامة.',
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
      voiceText: 'تهانينا! تم تفعيل حسابك بنجاح. يمكنك الآن استقبال المهام الجديدة.',
    }),

  accountRejected: (nurseId: string, reason: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم رفض الحساب ❌',
      message: reason || 'تم رفض طلب تسجيلك',
      type: 'system',
      voiceText: `تم رفض طلب تسجيلك. السبب: ${reason || 'غير محدد'}. يرجى التواصل مع الإدارة.`,
      voicePriority: 'high',
    }),

  accountBlocked: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم حظر الحساب 🚫',
      message: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل',
      type: 'system',
      voiceText: 'تم حظر حسابك. يرجى التواصل مع الإدارة لمزيد من التفاصيل.',
      voicePriority: 'high',
    }),

  accountUnblocked: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم تفعيل الحساب ✓',
      message: 'تم تفعيل حسابك مرة أخرى',
      type: 'system',
      voiceText: 'تم تفعيل حسابك مرة أخرى. يمكنك الآن متابعة عملك بشكل طبيعي.',
    }),

  identityVerified: (nurseId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم توثيق الهوية ✓',
      message: 'تم توثيق هويتك بنجاح. حسابك موثوق الآن!',
      type: 'system',
      voiceText: 'تم توثيق هويتك بنجاح. حسابك موثوق الآن وسيظهر للمستفيدين بشكل موثوق.',
    }),

  newAssignment: (nurseId: string, serviceName: string, orderId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'مهمة جديدة! 📋',
      message: `لديك مهمة جديدة: ${serviceName}`,
      type: 'assignment',
      voiceText: `لديك مهمة جديدة! الخدمة المطلوبة: ${serviceName}. يرجى الاطلاع على التفاصيل والرد في أقرب وقت.`,
      voicePriority: 'high',
      data: { requestId: orderId, url: '/?tab=assignments' },
    }),

  emergencyAssignment: (nurseId: string, beneficiaryName: string, orderId: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: '🚨 مهمة طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة!`,
      type: 'emergency',
      voiceText: `تنبيه طوارئ عاجل! المستفيد ${beneficiaryName} يحتاج مساعدة طارئة! يرجى الاستجابة فوراً!`,
      voicePriority: 'urgent',
      data: { requestId: orderId, url: '/?tab=assignments' },
    }),

  assignmentCancelled: (nurseId: string, serviceName: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم إلغاء المهمة ❌',
      message: `تم إلغاء مهمة "${serviceName}". سيتم تعيين مهمة بديلة قريباً`,
      type: 'status_change',
      voiceText: `تم إلغاء مهمة "${serviceName}". سيتم تعيين مهمة بديلة لك قريباً.`,
    }),

  newRating: (nurseId: string, rating: number) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: `تقييم جديد ⭐ ${rating}/5`,
      message: 'تلقيت تقييماً جديداً من مستفيد',
      type: 'rating',
      voiceText: `تلقيت تقييماً جديداً من مستفيد. التقييم ${rating} من 5.`,
    }),

  paymentReceived: (nurseId: string, amount: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تم استلام الدفع 💰',
      message: `تم تأكيد استلام مبلغ ${amount} ر.ي`,
      type: 'payment',
      voiceText: `تم تأكيد استلام مبلغ ${amount} ريال يمني في حسابك.`,
    }),

  taskReminder: (nurseId: string, serviceName: string) =>
    pushNotification({
      userId: nurseId, userType: 'nurse',
      title: 'تذكير ⏰',
      message: `مهمة "${serviceName}" بانتظار البدء`,
      type: 'reminder',
      voiceText: `تذكير: مهمة "${serviceName}" بانتظار البدء. يرجى البدء في التنفيذ.`,
      voicePriority: 'high',
    }),
}

// ─── Admin Notifications ───
export const notifyAdminServer = {
  newOrder: (beneficiaryName: string, serviceName: string, orderId: string) =>
    pushToAllAdmins({
      title: 'طلب جديد! 📥',
      message: `${beneficiaryName} طلب ${serviceName}`,
      type: 'appointment',
      voiceText: `طلب جديد! المستفيد ${beneficiaryName} طلب خدمة ${serviceName}. يرجى المراجعة والرد.`,
      voicePriority: 'high',
      data: { requestId: orderId, url: '/?tab=requests' },
    }),

  newRegistration: (name: string, role: string) =>
    pushToAllAdmins({
      title: 'تسجيل جديد 👤',
      message: `${name} سجّل كـ${role}`,
      type: 'system',
      voiceText: `تسجيل جديد! ${name} سجل كـ${role}. يرجى مراجعة الطلب.`,
    }),

  emergencyRequest: (beneficiaryName: string, orderId: string) =>
    pushToAllAdmins({
      title: '🚨 طلب طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة`,
      type: 'emergency',
      voiceText: `تنبيه طوارئ! المستفيد ${beneficiaryName} يحتاج مساعدة طارئة! يرجى التعامل مع الطلب فوراً!`,
      voicePriority: 'urgent',
      data: { requestId: orderId, url: '/?tab=emergency' },
    }),

  paymentProof: (beneficiaryName: string, amount: string) =>
    pushToAllAdmins({
      title: 'إثبات دفع جديد 💳',
      message: `${beneficiaryName} أرسل إثبات دفع بمبلغ ${amount}`,
      type: 'payment',
      voiceText: `إثبات دفع جديد من ${beneficiaryName} بمبلغ ${amount} ريال يمني. يرجى المراجعة والتأكيد.`,
      voicePriority: 'high',
    }),

  nurseRejectedTask: (nurseName: string, reason: string) =>
    pushToAllAdmins({
      title: `رفض مهمة من ${nurseName} ⚠️`,
      message: `السبب: ${reason}`,
      type: 'assignment',
      voiceText: `الممرض ${nurseName} رفض المهمة. السبب: ${reason}. يرجى تعيين ممرض بديل.`,
      voicePriority: 'high',
    }),

  nurseAcceptedTask: (nurseName: string, serviceName: string) =>
    pushToAllAdmins({
      title: `قبول مهمة من ${nurseName} ✓`,
      message: `قبل مهمة: ${serviceName}`,
      type: 'assignment',
      voiceText: `الممرض ${nurseName} قبل مهمة ${serviceName}.`,
    }),

  newComplaint: (fromName: string) =>
    pushToAllAdmins({
      title: 'شكوى جديدة 📝',
      message: `شكوى من ${fromName}`,
      type: 'system',
      voiceText: `شكوى جديدة من ${fromName}. يرجى مراجعتها والرد في أقرب وقت.`,
      voicePriority: 'high',
    }),

  newRating: (nurseName: string, rating: number) =>
    pushToAllAdmins({
      title: `تقييم جديد ⭐ ${rating}/5`,
      message: `تقييم جديد للممرض/ة ${nurseName}`,
      type: 'rating',
      voiceText: `تقييم جديد للممرض ${nurseName}. التقييم ${rating} من 5.`,
    }),

  paymentConfirmed: (beneficiaryName: string, amount: string) =>
    pushToAllAdmins({
      title: 'تأكيد دفع 💰',
      message: `تم تأكيد دفع ${amount} ر.ي من ${beneficiaryName}`,
      type: 'payment',
      voiceText: `تم تأكيد دفع ${amount} ريال يمني من ${beneficiaryName}.`,
    }),

  requestStatusChanged: (status: string, beneficiaryName: string, orderId: string) =>
    pushToAllAdmins({
      title: `تحديث حالة طلب 🔄`,
      message: `طلب ${beneficiaryName}: ${status}`,
      type: 'status_change',
      voiceText: `تحديث حالة طلب المستفيد ${beneficiaryName}. الحالة الجديدة: ${status}.`,
      data: { requestId: orderId },
    }),
}
