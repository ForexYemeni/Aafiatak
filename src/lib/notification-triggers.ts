'use client';

import type { UserRole, NotificationType, NotificationCategory, NotificationPriority, SocketNotificationPayload } from '@/types/aafiatak';
import { NOTIFICATION_TEMPLATES } from '@/types/aafiatak';
import socketService from '@/lib/socket-service';

/**
 * Role-based notification trigger system
 * Handles all notification scenarios for Admin, Nurse, and Beneficiary roles
 */

interface TriggerPayload {
  targetUserId?: string;
  targetRole?: UserRole;
  targetUserIds?: string[];
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  customTitleAr?: string;
  customTitleEn?: string;
  customBodyAr?: string;
  customBodyEn?: string;
  data?: Record<string, any>;
}

class NotificationTriggers {
  /**
   * ADMIN TRIGGERS
   */

  // New nurse registration → instant voice alert to all admins
  nurseRegistered(nurseId: string, nurseName: string) {
    this.emit({
      targetRole: 'admin',
      type: 'nurse-registration',
      category: 'system',
      priority: 'high',
      customTitleAr: 'تسجيل ممرض جديد',
      customTitleEn: 'New Nurse Registration',
      customBodyAr: `الممرض ${nurseName} قام بالتسجيل ويحتاج للموافقة`,
      customBodyEn: `Nurse ${nurseName} has registered and needs approval`,
      data: { nurseId, nurseName },
    });
  }

  // New service request → voice alert to admins
  newServiceRequest(requestId: string, beneficiaryName: string, serviceType: string) {
    this.emit({
      targetRole: 'admin',
      type: 'new-request',
      category: 'service',
      priority: 'high',
      customTitleAr: 'طلب خدمة جديد',
      customTitleEn: 'New Service Request',
      customBodyAr: `طلب جديد من ${beneficiaryName} - ${serviceType}`,
      customBodyEn: `New request from ${beneficiaryName} - ${serviceType}`,
      data: { requestId, beneficiaryName, serviceType },
    });
  }

  // Payment received → voice alert to admins
  paymentReceived(paymentId: string, amount: number, beneficiaryName: string) {
    this.emit({
      targetRole: 'admin',
      type: 'payment-received',
      category: 'payment',
      priority: 'normal',
      customTitleAr: 'تم استلام دفعة',
      customTitleEn: 'Payment Received',
      customBodyAr: `تم استلام دفعة بمبلغ ${amount} ريال من ${beneficiaryName}`,
      customBodyEn: `Payment of ${amount} SAR received from ${beneficiaryName}`,
      data: { paymentId, amount, beneficiaryName },
    });
  }

  // Approve nurse → notify the nurse
  approveNurse(nurseId: string, nurseName: string) {
    this.emit({
      targetUserId: nurseId,
      type: 'admin-approval',
      category: 'system',
      priority: 'high',
      customTitleAr: 'تمت الموافقة على حسابك',
      customTitleEn: 'Your Account Has Been Approved',
      customBodyAr: `مرحبا ${nurseName}، تمت الموافقة على حسابك كممرض في عافيتك`,
      customBodyEn: `Hello ${nurseName}, your nurse account has been approved in Aafiatak`,
      data: { nurseId },
    });
  }

  // Reject nurse → notify the nurse
  rejectNurse(nurseId: string, nurseName: string, reason?: string) {
    this.emit({
      targetUserId: nurseId,
      type: 'rejection',
      category: 'system',
      priority: 'high',
      customTitleAr: 'تم رفض طلب التسجيل',
      customTitleEn: 'Registration Rejected',
      customBodyAr: `عذرا ${nurseName}، تم رفض طلب التسجيل${reason ? `: ${reason}` : ''}`,
      customBodyEn: `Sorry ${nurseName}, your registration has been rejected${reason ? `: ${reason}` : ''}`,
      data: { nurseId, reason },
    });
  }

  /**
   * NURSE TRIGGERS
   */

  // New assigned case → immediate voice alert to nurse
  newAssignment(nurseId: string, patientName: string, serviceType: string, requestId: string) {
    this.emit({
      targetUserId: nurseId,
      type: 'new-assignment',
      category: 'service',
      priority: 'urgent',
      customTitleAr: 'حالة جديدة معينة لك',
      customTitleEn: 'New Case Assigned to You',
      customBodyAr: `تم تعيين حالة جديدة لك - ${serviceType} للمريض ${patientName}`,
      customBodyEn: `A new case has been assigned to you - ${serviceType} for patient ${patientName}`,
      data: { nurseId, patientName, serviceType, requestId },
    });
  }

  // Patient updates → voice alert to nurse
  patientUpdate(nurseId: string, patientName: string, updateType: string) {
    this.emit({
      targetUserId: nurseId,
      type: 'patient-update',
      category: 'service',
      priority: 'high',
      customTitleAr: 'تحديث على حالة المريض',
      customTitleEn: 'Patient Status Update',
      customBodyAr: `تحديث على حالة المريض ${patientName}: ${updateType}`,
      customBodyEn: `Update on patient ${patientName}: ${updateType}`,
      data: { nurseId, patientName, updateType },
    });
  }

  // Admin approval → voice alert to nurse (already handled above, but this is for explicit trigger)
  nurseApprovalNotification(nurseId: string) {
    this.emit({
      targetUserId: nurseId,
      type: 'admin-approval',
      category: 'system',
      priority: 'high',
      customTitleAr: 'تمت الموافقة على حسابك',
      customTitleEn: 'Your Account Has Been Approved',
      customBodyAr: 'تمت الموافقة على حسابك كممرض. يمكنك الآن استقبال الحالات',
      customBodyEn: 'Your nurse account has been approved. You can now receive cases',
      data: { nurseId },
    });
  }

  /**
   * BENEFICIARY TRIGGERS
   */

  // Nurse accepted request → voice alert to beneficiary
  requestAccepted(beneficiaryId: string, nurseName: string, serviceType: string) {
    this.emit({
      targetUserId: beneficiaryId,
      type: 'request-accepted',
      category: 'service',
      priority: 'high',
      customTitleAr: 'تم قبول طلبك',
      customTitleEn: 'Your Request Has Been Accepted',
      customBodyAr: `الممرض ${nurseName} قبل طلبك لخدمة ${serviceType}`,
      customBodyEn: `Nurse ${nurseName} accepted your request for ${serviceType}`,
      data: { beneficiaryId, nurseName, serviceType },
    });
  }

  // Nurse on the way → voice alert to beneficiary
  nurseOnTheWay(beneficiaryId: string, nurseName: string, eta?: string) {
    this.emit({
      targetUserId: beneficiaryId,
      type: 'nurse-on-way',
      category: 'service',
      priority: 'urgent',
      customTitleAr: 'الممرض في الطريق إليك',
      customTitleEn: 'Nurse Is On The Way',
      customBodyAr: `الممرض ${nurseName} في طريقه إليك${eta ? `، الوصول المتوقع ${eta}` : ''}`,
      customBodyEn: `Nurse ${nurseName} is on the way${eta ? `, ETA ${eta}` : ''}`,
      data: { beneficiaryId, nurseName, eta },
    });
  }

  // Service completed → voice alert to beneficiary
  serviceCompleted(beneficiaryId: string, nurseName: string, serviceType: string) {
    this.emit({
      targetUserId: beneficiaryId,
      type: 'service-completed',
      category: 'service',
      priority: 'normal',
      customTitleAr: 'تم إكمال الخدمة',
      customTitleEn: 'Service Completed',
      customBodyAr: `تم إكمال خدمة ${serviceType} بواسطة الممرض ${nurseName}`,
      customBodyEn: `${serviceType} service has been completed by nurse ${nurseName}`,
      data: { beneficiaryId, nurseName, serviceType },
    });
  }

  // Payment confirmation → voice alert to beneficiary
  paymentConfirmed(beneficiaryId: string, amount: number) {
    this.emit({
      targetUserId: beneficiaryId,
      type: 'payment-confirmed',
      category: 'payment',
      priority: 'normal',
      customTitleAr: 'تم تأكيد الدفع',
      customTitleEn: 'Payment Confirmed',
      customBodyAr: `تم تأكيد عملية الدفع بمبلغ ${amount} ريال`,
      customBodyEn: `Payment of ${amount} SAR has been confirmed`,
      data: { beneficiaryId, amount },
    });
  }

  // New message notification
  newMessage(receiverId: string, senderName: string, preview: string) {
    this.emit({
      targetUserId: receiverId,
      type: 'new-message',
      category: 'message',
      priority: 'normal',
      customTitleAr: 'رسالة جديدة',
      customTitleEn: 'New Message',
      customBodyAr: `رسالة من ${senderName}: ${preview}`,
      customBodyEn: `Message from ${senderName}: ${preview}`,
      data: { receiverId, senderName, preview },
    });
  }

  // Status change notification
  statusChange(userId: string, oldStatus: string, newStatus: string, itemName: string) {
    this.emit({
      targetUserId: userId,
      type: 'status-change',
      category: 'service',
      priority: 'normal',
      customTitleAr: 'تغيير الحالة',
      customTitleEn: 'Status Changed',
      customBodyAr: `تم تغيير حالة ${itemName} من ${oldStatus} إلى ${newStatus}`,
      customBodyEn: `${itemName} status changed from ${oldStatus} to ${newStatus}`,
      data: { userId, oldStatus, newStatus, itemName },
    });
  }

  /**
   * Core emit method
   */
  private emit(payload: TriggerPayload) {
    const template = NOTIFICATION_TEMPLATES[payload.type];

    const socketPayload: SocketNotificationPayload = {
      type: payload.type,
      title: payload.customTitleEn || template.titleEn,
      titleAr: payload.customTitleAr || template.titleAr,
      body: payload.customBodyEn || template.bodyEn,
      bodyAr: payload.customBodyAr || template.bodyAr,
      category: payload.category,
      priority: payload.priority || 'normal',
      data: payload.data,
      typeId: `${payload.type}_${Date.now()}`,
    };

    if (payload.targetUserId) {
      socketPayload.userId = payload.targetUserId;
      socketService.sendToUser(socketPayload as any);
    } else if (payload.targetUserIds && payload.targetUserIds.length > 0) {
      (socketPayload as any).userIds = payload.targetUserIds;
      socketService.sendToUsers(socketPayload as any);
    } else if (payload.targetRole) {
      (socketPayload as any).role = payload.targetRole;
      socketService.sendToRole(socketPayload as any);
    }
  }
}

export const notificationTriggers = new NotificationTriggers();
export default notificationTriggers;
