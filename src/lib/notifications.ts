/**
 * عافيتك — Notification Helper
 * Central utility to send push notifications from any part of the app
 * Works even when the app is closed (via FCM + Service Worker)
 *
 * IMPORTANT: Admin notifications use sendToAllOfType: true
 * because we need to notify ALL admins, not a single admin ID.
 */

// ─── Send notification via API ───
async function sendNotification(params: {
  userId: string
  userType: 'beneficiary' | 'nurse' | 'admin'
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'system' | 'reminder' | 'emergency' | 'payment' | 'rating' | 'chat' | 'appointment'
  data?: Record<string, string>
}) {
  try {
    // If userId is empty and userType is admin, use sendToAllOfType
    if (!params.userId && params.userType === 'admin') {
      return sendToAllAdmins({
        title: params.title,
        message: params.message,
        type: params.type,
        data: params.data,
      })
    }

    if (!params.userId) {
      console.warn('Notification skipped: no userId provided')
      return
    }

    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

// ─── Send to multiple users ───
async function sendBulkNotification(params: {
  userIds: string[]
  userType: 'beneficiary' | 'nurse' | 'admin'
  title: string
  message: string
  type: 'assignment' | 'status_change' | 'system' | 'reminder' | 'emergency' | 'payment' | 'rating' | 'chat' | 'appointment'
  data?: Record<string, string>
}) {
  try {
    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (error) {
    console.error('Failed to send bulk notification:', error)
  }
}

// ─── Send to ALL admins (server will look up all admin users) ───
async function sendToAllAdmins(params: {
  title: string
  message: string
  type: 'appointment' | 'assignment' | 'system' | 'emergency' | 'payment'
  data?: Record<string, string>
}) {
  try {
    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        userType: 'admin',
        sendToAllOfType: true,
      }),
    })
  } catch (error) {
    console.error('Failed to notify admins:', error)
  }
}

// ═══════════════════════════════════════
//  PRE-BUILT NOTIFICATION TEMPLATES
// ═══════════════════════════════════════

// ─── Beneficiary Notifications ───
export const notifyBeneficiary = {
  orderApproved: (beneficiaryId: string, orderId: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: 'تم قبول طلبك ✓',
      message: 'تمت الموافقة على طلبك وسيتم تعيين ممرض قريباً',
      type: 'status_change',
      data: { requestId: orderId, url: '/' },
    }),

  nurseAssigned: (beneficiaryId: string, nurseName: string, orderId: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: `تم تعيين ${nurseName} 🏥`,
      message: `الممرض/ة ${nurseName} في طريقه إليك`,
      type: 'assignment',
      data: { requestId: orderId, url: '/' },
    }),

  nurseEnRoute: (beneficiaryId: string, nurseName: string, eta: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: `الممرض في الطريق 🚗`,
      message: `${nurseName} سيصل خلال ${eta}`,
      type: 'status_change',
      data: { url: '/' },
    }),

  orderCompleted: (beneficiaryId: string, orderId: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: 'تم إكمال الخدمة ✅',
      message: 'تم إكمال الخدمة بنجاح. يرجى تقييم تجربتك!',
      type: 'rating',
      data: { requestId: orderId, url: '/' },
    }),

  paymentConfirmed: (beneficiaryId: string, orderId: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: 'تم تأكيد الدفع 💰',
      message: 'تم تأكيد استلام الدفع بنجاح',
      type: 'payment',
      data: { requestId: orderId, url: '/' },
    }),

  orderRejected: (beneficiaryId: string, reason: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: 'تم رفض الطلب ❌',
      message: `سبب الرفض: ${reason}`,
      type: 'status_change',
    }),

  newChatMessage: (beneficiaryId: string, senderName: string, orderId: string) =>
    sendNotification({
      userId: beneficiaryId,
      userType: 'beneficiary',
      title: `رسالة من ${senderName} 💬`,
      message: 'لديك رسالة جديدة',
      type: 'chat',
      data: { requestId: orderId, url: '/' },
    }),
}

// ─── Nurse Notifications ───
export const notifyNurse = {
  newAssignment: (nurseId: string, serviceName: string, orderId: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: 'مهمة جديدة! 📋',
      message: `لديك مهمة جديدة: ${serviceName}`,
      type: 'assignment',
      data: { requestId: orderId, url: '/?tab=assignments' },
    }),

  assignmentAccepted: (nurseId: string, beneficiaryName: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: 'تم قبول المهمة ✓',
      message: `المستفيد ${beneficiaryName} في انتظارك`,
      type: 'status_change',
    }),

  newChatMessage: (nurseId: string, senderName: string, orderId: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: `رسالة من ${senderName} 💬`,
      message: 'لديك رسالة جديدة',
      type: 'chat',
      data: { requestId: orderId, url: '/' },
    }),

  taskReminder: (nurseId: string, serviceName: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: 'تذكير ⏰',
      message: `مهمة "${serviceName}" بانتظار البدء`,
      type: 'reminder',
    }),

  newRating: (nurseId: string, rating: number) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: `تقييم جديد ⭐ ${rating}/5`,
      message: 'تلقيت تقييماً جديداً من مستفيد',
      type: 'rating',
    }),

  accountApproved: (nurseId: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: 'تم تفعيل حسابك! 🎉',
      message: 'تمت الموافقة على حسابك. يمكنك الآن استقبال المهام',
      type: 'system',
    }),

  accountRejected: (nurseId: string, reason: string) =>
    sendNotification({
      userId: nurseId,
      userType: 'nurse',
      title: 'تم رفض الحساب ❌',
      message: reason || 'تم رفض طلب تسجيلك',
      type: 'system',
    }),
}

// ─── Admin Notifications ───
// All admin notifications use sendToAllOfType: true to notify ALL admins
export const notifyAdmin = {
  newOrder: (_adminId: string, beneficiaryName: string, serviceName: string, orderId: string) =>
    sendToAllAdmins({
      title: 'طلب جديد! 📥',
      message: `${beneficiaryName} طلب ${serviceName}`,
      type: 'appointment',
      data: { requestId: orderId, url: '/?tab=requests' },
    }),

  newRegistration: (_adminId: string, name: string, role: string) =>
    sendToAllAdmins({
      title: 'تسجيل جديد 👤',
      message: `${name} سجّل كـ${role}`,
      type: 'system',
    }),

  emergencyRequest: (_adminId: string, beneficiaryName: string, orderId: string) =>
    sendToAllAdmins({
      title: '🚨 طلب طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة`,
      type: 'emergency',
      data: { requestId: orderId, url: '/?tab=emergency' },
    }),

  paymentProof: (_adminId: string, beneficiaryName: string, amount: string) =>
    sendToAllAdmins({
      title: 'إثبات دفع جديد 💳',
      message: `${beneficiaryName} أرسل إثبات دفع بمبلغ ${amount}`,
      type: 'payment',
    }),

  nurseRejectedTask: (_adminId: string, nurseName: string, reason: string) =>
    sendToAllAdmins({
      title: `رفض مهمة من ${nurseName} ⚠️`,
      message: `السبب: ${reason}`,
      type: 'assignment',
    }),

  newComplaint: (_adminId: string, fromName: string) =>
    sendToAllAdmins({
      title: 'شكوى جديدة 📝',
      message: `شكوى من ${fromName}`,
      type: 'system',
    }),
}

// ─── Re-export for direct use ───
export { sendToAllAdmins as notifyAllAdmins }
