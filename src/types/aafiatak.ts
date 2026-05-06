// Aafiatak Type Definitions

export type UserRole = 'admin' | 'nurse' | 'beneficiary';

export type NotificationType =
  | 'new-request'
  | 'nurse-registration'
  | 'approval'
  | 'rejection'
  | 'payment-received'
  | 'payment-confirmed'
  | 'new-message'
  | 'new-assignment'
  | 'patient-update'
  | 'admin-approval'
  | 'request-accepted'
  | 'nurse-on-way'
  | 'service-completed'
  | 'status-change'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory = 'system' | 'service' | 'payment' | 'message';

export type ServiceStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';

export type AssignmentStatus = 'assigned' | 'accepted' | 'on-the-way' | 'in-progress' | 'completed';

export type NurseApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export type VoiceGender = 'male' | 'female';

export type VoiceLanguage = 'ar' | 'en';

export interface AafiatakUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  fcmToken?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface AafiatakNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  isVoiceRead: boolean;
  data?: Record<string, any>;
  voicePlayed: boolean;
  createdAt: string;
}

export interface VoiceSettings {
  id: string;
  userId: string;
  enabled: boolean;
  volume: number;
  voiceGender: VoiceGender;
  language: VoiceLanguage;
  rate: number;
  quietHoursEnabled: boolean;
  quietStart?: string;
  quietEnd?: string;
}

export interface ServiceRequest {
  id: string;
  beneficiaryId: string;
  serviceType: string;
  description: string;
  status: ServiceStatus;
  location?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  nurseProfileId: string;
  serviceRequestId: string;
  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  serviceRequestId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  transactionId?: string;
  createdAt: string;
}

export interface NurseProfile {
  id: string;
  userId: string;
  specialty?: string;
  licenseNo?: string;
  experience: number;
  rating: number;
  status: NurseApprovalStatus;
}

export interface SocketNotificationPayload {
  userId?: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  data?: Record<string, any>;
  typeId?: string;
  timestamp?: string;
  delivered?: boolean;
  queued?: boolean;
  broadcast?: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalNurses: number;
  activeRequests: number;
  completedServices: number;
  totalRevenue: number;
  pendingApprovals: number;
  onlineNurses: number;
  todayRequests: number;
}

// Arabic notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> = {
  'new-request': {
    titleAr: 'طلب خدمة جديد',
    titleEn: 'New Service Request',
    bodyAr: 'تم استلام طلب خدمة جديد',
    bodyEn: 'A new service request has been received',
  },
  'nurse-registration': {
    titleAr: 'تسجيل ممرض جديد',
    titleEn: 'New Nurse Registration',
    bodyAr: 'ممرض جديد قام بالتسجيل ويحتاج للموافقة',
    bodyEn: 'A new nurse has registered and needs approval',
  },
  'approval': {
    titleAr: 'تمت الموافقة',
    titleEn: 'Approved',
    bodyAr: 'تمت الموافقة على طلبك',
    bodyEn: 'Your request has been approved',
  },
  'rejection': {
    titleAr: 'تم الرفض',
    titleEn: 'Rejected',
    bodyAr: 'تم رفض طلبك',
    bodyEn: 'Your request has been rejected',
  },
  'payment-received': {
    titleAr: 'تم استلام الدفعة',
    titleEn: 'Payment Received',
    bodyAr: 'تم استلام دفعة جديدة',
    bodyEn: 'A new payment has been received',
  },
  'payment-confirmed': {
    titleAr: 'تأكيد الدفع',
    titleEn: 'Payment Confirmed',
    bodyAr: 'تم تأكيد عملية الدفع بنجاح',
    bodyEn: 'Payment has been confirmed successfully',
  },
  'new-message': {
    titleAr: 'رسالة جديدة',
    titleEn: 'New Message',
    bodyAr: 'لديك رسالة جديدة',
    bodyEn: 'You have a new message',
  },
  'new-assignment': {
    titleAr: 'حالة جديدة معينة',
    titleEn: 'New Case Assignment',
    bodyAr: 'تم تعيين حالة جديدة لك',
    bodyEn: 'A new case has been assigned to you',
  },
  'patient-update': {
    titleAr: 'تحديث المريض',
    titleEn: 'Patient Update',
    bodyAr: 'هناك تحديث على حالة المريض',
    bodyEn: 'There is an update on the patient status',
  },
  'admin-approval': {
    titleAr: 'موافقة الإدارة',
    titleEn: 'Admin Approval',
    bodyAr: 'وافق الإدارة على حسابك',
    bodyEn: 'Admin has approved your account',
  },
  'request-accepted': {
    titleAr: 'تم قبول الطلب',
    titleEn: 'Request Accepted',
    bodyAr: 'تم قبول طلب الخدمة الخاص بك',
    bodyEn: 'Your service request has been accepted',
  },
  'nurse-on-way': {
    titleAr: 'الممرض في الطريق',
    titleEn: 'Nurse On The Way',
    bodyAr: 'الممرض في طريقه إليك',
    bodyEn: 'The nurse is on the way to you',
  },
  'service-completed': {
    titleAr: 'تم إكمال الخدمة',
    titleEn: 'Service Completed',
    bodyAr: 'تم إكمال الخدمة بنجاح',
    bodyEn: 'Service has been completed successfully',
  },
  'status-change': {
    titleAr: 'تغيير الحالة',
    titleEn: 'Status Changed',
    bodyAr: 'تم تغيير حالة الطلب',
    bodyEn: 'The request status has been changed',
  },
  'system': {
    titleAr: 'إشعار النظام',
    titleEn: 'System Notification',
    bodyAr: 'لديك إشعار جديد من النظام',
    bodyEn: 'You have a new system notification',
  },
};

// Role-based color scheme
export const ROLE_COLORS: Record<UserRole, { primary: string; secondary: string; accent: string; bg: string }> = {
  admin: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    bg: '#ecfdf5',
  },
  nurse: {
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    bg: '#ecfeff',
  },
  beneficiary: {
    primary: '#d97706',
    secondary: '#f59e0b',
    accent: '#fbbf24',
    bg: '#fffbeb',
  },
};

export const ROLE_LABELS: Record<UserRole, { ar: string; en: string }> = {
  admin: { ar: 'الإدارة', en: 'Admin' },
  nurse: { ar: 'الممرض', en: 'Nurse' },
  beneficiary: { ar: 'المستفيد', en: 'Beneficiary' },
};

export const SERVICE_TYPES: Record<string, { ar: string; en: string; icon: string }> = {
  nursing: { ar: 'تمريض', en: 'Nursing', icon: '🏥' },
  physiotherapy: { ar: 'علاج طبيعي', en: 'Physiotherapy', icon: '💆' },
  'elderly-care': { ar: 'رعاية المسنين', en: 'Elderly Care', icon: '👴' },
  'child-care': { ar: 'رعاية الأطفال', en: 'Child Care', icon: '👶' },
  'home-care': { ar: 'رعاية منزلية', en: 'Home Care', icon: '🏠' },
  laboratory: { ar: 'تحاليل مخبرية', en: 'Laboratory', icon: '🔬' },
};
