/**
 * عافيتك — Notification Helper
 * Central utility to send push notifications from any part of the app
 * Works even when the app is closed (via FCM + Service Worker)
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
export const notifyAdmin = {
  newOrder: (adminId: string, beneficiaryName: string, serviceName: string, orderId: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: 'طلب جديد! 📥',
      message: `${beneficiaryName} طلب ${serviceName}`,
      type: 'appointment',
      data: { requestId: orderId, url: '/?tab=requests' },
    }),

  newRegistration: (adminId: string, name: string, role: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: 'تسجيل جديد 👤',
      message: `${name} سجّل كـ${role}`,
      type: 'system',
    }),

  emergencyRequest: (adminId: string, beneficiaryName: string, orderId: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: '🚨 طلب طوارئ!',
      message: `${beneficiaryName} يحتاج مساعدة طارئة`,
      type: 'emergency',
      data: { requestId: orderId, url: '/?tab=emergency' },
    }),

  paymentProof: (adminId: string, beneficiaryName: string, amount: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: 'إثبات دفع جديد 💳',
      message: `${beneficiaryName} أرسل إثبات دفع بمبلغ ${amount}`,
      type: 'payment',
    }),

  nurseRejectedTask: (adminId: string, nurseName: string, reason: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: `رفض مهمة من ${nurseName} ⚠️`,
      message: `السبب: ${reason}`,
      type: 'assignment',
    }),

  newComplaint: (adminId: string, fromName: string) =>
    sendNotification({
      userId: adminId,
      userType: 'admin',
      title: 'شكوى جديدة 📝',
      message: `شكوى من ${fromName}`,
      type: 'system',
    }),
}

// ─── Notify ALL admins ───
export async function notifyAllAdmins(params: {
  title: string
  message: string
  type: 'appointment' | 'assignment' | 'system' | 'emergency' | 'payment'
  data?: Record<string, string>
}) {
  try {
    // Get all admin IDs from Firestore
    const res = await fetch('/api/admin/nurses') // Reuse existing pattern
    // Actually, we'll do it server-side by passing admin role
    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        userType: 'admin',
        // Server will look up all admin IDs
        sendToAllOfType: true,
      }),
    })
  } catch (error) {
    console.error('Failed to notify admins:', error)
  }
}
