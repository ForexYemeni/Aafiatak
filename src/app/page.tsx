'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell, LogOut, Settings, Users, FileText, CreditCard, LayoutDashboard,
  Stethoscope, ClipboardList, CheckCircle2, XCircle, Volume2, VolumeX,
  Clock, Star, TrendingUp, TrendingDown, Activity, Heart, Shield,
  Home, ChevronLeft, ChevronRight, Speaker, Play, Check, Trash2,
  Wifi, WifiOff, Loader2, MessageSquare, UserCheck, UserX,
  CalendarDays, DollarSign, Eye, EyeOff, Filter, RefreshCw,
  Mic, MicOff, Moon, Sun, Send, PhoneCall, MapPin, ArrowUpRight,
  CircleDot, Radio, Zap, AlertTriangle, Info
} from 'lucide-react';

import { useNotificationStore, useDashboardStore } from '@/stores/notification-store';
import { useNotificationSystem } from '@/hooks/use-notification-system';
import notificationTriggers from '@/lib/notification-triggers';
import ttsService from '@/lib/tts-service';
import type {
  AafiatakUser, AafiatakNotification, UserRole, NotificationCategory,
  NotificationPriority, VoiceSettings, NurseProfile, ServiceRequest, Payment,
  ROLE_COLORS, ROLE_LABELS
} from '@/types/aafiatak';
import { NOTIFICATION_TEMPLATES, SERVICE_TYPES } from '@/types/aafiatak';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ─── Demo Users ────────────────────────────────────────────────────────────────
const DEMO_USERS: Record<UserRole, AafiatakUser> = {
  admin: {
    id: 'admin-1',
    name: 'أحمد الإداري',
    email: 'admin@aafiatak.com',
    role: 'admin',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  nurse: {
    id: 'nurse-1',
    name: 'سارة الممرضة',
    email: 'nurse@aafiatak.com',
    role: 'nurse',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  beneficiary: {
    id: 'beneficiary-1',
    name: 'محمد المستفيد',
    email: 'user@aafiatak.com',
    role: 'beneficiary',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_NURSES: (NurseProfile & { name: string })[] = [
  { id: 'nurse-2', userId: 'user-2', name: 'فاطمة الزهراء', specialty: 'تمريض عام', licenseNo: 'LN-2024-001', experience: 5, rating: 4.8, status: 'pending' },
  { id: 'nurse-3', userId: 'user-3', name: 'نورة العتيبي', specialty: 'علاج طبيعي', licenseNo: 'LN-2024-002', experience: 8, rating: 4.9, status: 'pending' },
  { id: 'nurse-4', userId: 'user-4', name: 'ليلى القحطاني', specialty: 'رعاية المسنين', licenseNo: 'LN-2024-003', experience: 3, rating: 4.5, status: 'approved' },
  { id: 'nurse-5', userId: 'user-5', name: 'مريم الشمري', specialty: 'رعاية الأطفال', licenseNo: 'LN-2024-004', experience: 6, rating: 4.7, status: 'approved' },
  { id: 'nurse-6', userId: 'user-6', name: 'هند المطيري', specialty: 'تمريض منزلي', licenseNo: 'LN-2024-005', experience: 2, rating: 4.2, status: 'rejected' },
];

const MOCK_REQUESTS: ServiceRequest[] = [
  { id: 'req-1', beneficiaryId: 'beneficiary-1', serviceType: 'nursing', description: 'تمريض منزلي لمرضى السكري', status: 'pending', location: 'الرياض - حي النرجس', scheduledAt: new Date(Date.now() + 3600000).toISOString(), createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'req-2', beneficiaryId: 'beneficiary-2', serviceType: 'physiotherapy', description: 'جلسات علاج طبيعي للظهر', status: 'accepted', location: 'جدة - حي الروضة', scheduledAt: new Date(Date.now() + 7200000).toISOString(), createdAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'req-3', beneficiaryId: 'beneficiary-1', serviceType: 'elderly-care', description: 'رعاية مسن مع إعاقة حركية', status: 'in-progress', location: 'الدمام - حي الفيصلية', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'req-4', beneficiaryId: 'beneficiary-3', serviceType: 'child-care', description: 'رعاية طفل مع متلازمة داون', status: 'completed', location: 'الرياض - حي العليا', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'req-5', beneficiaryId: 'beneficiary-1', serviceType: 'home-care', description: 'رعاية منزلية شاملة', status: 'cancelled', location: 'مكة - حي العزيزية', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay-1', serviceRequestId: 'req-1', amount: 500, currency: 'SAR', status: 'pending', method: 'بطاقة ائتمان', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'pay-2', serviceRequestId: 'req-2', amount: 750, currency: 'SAR', status: 'confirmed', method: 'تحويل بنكي', transactionId: 'TXN-2024-001', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'pay-3', serviceRequestId: 'req-3', amount: 1200, currency: 'SAR', status: 'pending', method: 'نقداً', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'pay-4', serviceRequestId: 'req-4', amount: 350, currency: 'SAR', status: 'confirmed', method: 'محفظة إلكترونية', transactionId: 'TXN-2024-002', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'pay-5', serviceRequestId: 'req-5', amount: 900, currency: 'SAR', status: 'refunded', method: 'بطاقة ائتمان', transactionId: 'TXN-2024-003', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

// ─── Helper Functions ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (minutes > 0) return `منذ ${minutes} دقيقة`;
  return 'الآن';
}

function priorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-amber-500';
    case 'normal': return 'bg-emerald-500';
    case 'low': return 'bg-gray-400';
  }
}

function priorityLabel(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent': return 'عاجل';
    case 'high': return 'مهم';
    case 'normal': return 'عادي';
    case 'low': return 'منخفض';
  }
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'confirmed':
      return 'default';
    case 'pending':
    case 'assigned':
    case 'in-progress':
      return 'secondary';
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'approved': 'موافق عليه',
    'rejected': 'مرفوض',
    'assigned': 'معين',
    'accepted': 'مقبول',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'confirmed': 'مؤكد',
    'failed': 'فاشل',
    'refunded': 'مسترد',
    'on-the-way': 'في الطريق',
  };
  return labels[status] || status;
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin': return '#059669';
    case 'nurse': return '#0891b2';
    case 'beneficiary': return '#d97706';
  }
}

function getRoleBgClass(role: UserRole): string {
  switch (role) {
    case 'admin': return 'bg-emerald-600 hover:bg-emerald-700';
    case 'nurse': return 'bg-cyan-600 hover:bg-cyan-700';
    case 'beneficiary': return 'bg-amber-600 hover:bg-amber-700';
  }
}

function getRoleLightBg(role: UserRole): string {
  switch (role) {
    case 'admin': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'nurse': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'beneficiary': return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

// ─── Sidebar Config ────────────────────────────────────────────────────────────
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  admin: [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'nurses', label: 'الممرضين', icon: Stethoscope },
    { id: 'requests', label: 'الطلبات', icon: ClipboardList },
    { id: 'payments', label: 'المدفوعات', icon: CreditCard },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ],
  nurse: [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'assignments', label: 'الحالات المعينة', icon: UserCheck },
    { id: 'patients', label: 'المرضى', icon: Heart },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ],
  beneficiary: [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'requests', label: 'طلباتي', icon: ClipboardList },
    { id: 'payments', label: 'المدفوعات', icon: CreditCard },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ],
};

// ─── Live Demo Trigger Buttons ────────────────────────────────────────────────
interface DemoTrigger {
  id: string;
  label: string;
  icon: React.ElementType;
  trigger: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AafiatakPage() {
  // ─── Store Hooks ───────────────────────────────────────────────────────────
  const {
    currentUser,
    isConnected,
    notifications,
    unreadCount,
    voiceSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateVoiceSettings,
    setCurrentUser,
    setConnected,
  } = useNotificationStore();

  const {
    activeTab,
    sidebarOpen,
    setActiveTab,
    setSidebarOpen,
  } = useDashboardStore();

  // ─── Notification System Hook ──────────────────────────────────────────────
  const notificationSystem = useNotificationSystem();

  // ─── Local State ───────────────────────────────────────────────────────────
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [bellOpen, setBellOpen] = useState(false);
  const [demoPanelOpen, setDemoPanelOpen] = useState(true);
  const [localNurses, setLocalNurses] = useState(MOCK_NURSES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [speakingNotifId, setSpeakingNotifId] = useState<string | null>(null);

  // ─── Connection Status (derived) ────────────────────────────────────────────
  const connectionStatus: 'connected' | 'disconnected' | 'connecting' = useMemo(() => {
    if (isConnected) return 'connected';
    if (currentUser) return 'connecting';
    return 'disconnected';
  }, [isConnected, currentUser]);

  // ─── Demo Trigger Handlers ─────────────────────────────────────────────────
  const handleDemoTrigger = useCallback((type: string) => {
    const user = currentUser || DEMO_USERS.admin;
    const role = user.role;

    const now = new Date().toISOString();
    let notif: AafiatakNotification | null = null;

    switch (type) {
      case 'newServiceRequest':
        notificationTriggers.newServiceRequest('req-demo', 'محمد المستفيد', 'تمريض منزلي');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'new-request',
          title: 'New Service Request',
          titleAr: 'طلب خدمة جديد',
          body: 'A new service request has been received',
          bodyAr: 'طلب جديد من محمد المستفيد - تمريض منزلي',
          category: 'service',
          priority: 'high',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'nurseRegistered':
        notificationTriggers.nurseRegistered('nurse-demo', 'فاطمة الزهراء');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'nurse-registration',
          title: 'New Nurse Registration',
          titleAr: 'تسجيل ممرض جديد',
          body: 'A new nurse has registered',
          bodyAr: 'الممرض فاطمة الزهراء قام بالتسجيل ويحتاج للموافقة',
          category: 'system',
          priority: 'high',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'paymentReceived':
        notificationTriggers.paymentReceived('pay-demo', 500, 'محمد المستفيد');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'payment-received',
          title: 'Payment Received',
          titleAr: 'تم استلام دفعة',
          body: 'Payment of 500 SAR received',
          bodyAr: 'تم استلام دفعة بمبلغ 500 ريال من محمد المستفيد',
          category: 'payment',
          priority: 'normal',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'newAssignment':
        notificationTriggers.newAssignment('nurse-1', 'أحمد المريض', 'تمريض', 'req-demo');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'new-assignment',
          title: 'New Case Assignment',
          titleAr: 'حالة جديدة معينة لك',
          body: 'A new case has been assigned',
          bodyAr: 'تم تعيين حالة جديدة لك - تمريض للمريض أحمد المريض',
          category: 'service',
          priority: 'urgent',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'nurseOnTheWay':
        notificationTriggers.nurseOnTheWay('beneficiary-1', 'سارة الممرضة', '15 دقيقة');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'nurse-on-way',
          title: 'Nurse On The Way',
          titleAr: 'الممرض في الطريق إليك',
          body: 'The nurse is on the way',
          bodyAr: 'الممرض سارة الممرضة في طريقه إليك، الوصول المتوقع 15 دقيقة',
          category: 'service',
          priority: 'urgent',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'serviceCompleted':
        notificationTriggers.serviceCompleted('beneficiary-1', 'سارة الممرضة', 'تمريض');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'service-completed',
          title: 'Service Completed',
          titleAr: 'تم إكمال الخدمة',
          body: 'Service has been completed',
          bodyAr: 'تم إكمال خدمة تمريض بواسطة الممرض سارة الممرضة',
          category: 'service',
          priority: 'normal',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
      case 'newMessage':
        notificationTriggers.newMessage(user.id, 'الدعم الفني', 'مرحباً، كيف يمكننا مساعدتك؟');
        notif = {
          id: `demo_${Date.now()}`,
          userId: user.id,
          type: 'new-message',
          title: 'New Message',
          titleAr: 'رسالة جديدة',
          body: 'You have a new message',
          bodyAr: 'رسالة من الدعم الفني: مرحباً، كيف يمكننا مساعدتك؟',
          category: 'message',
          priority: 'normal',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: now,
        };
        break;
    }

    if (notif) {
      addNotification(notif);
      toast.success(notif.titleAr, { description: notif.bodyAr, duration: 4000 });
      ttsService.speak(notif);
    }
  }, [currentUser, addNotification]);

  // ─── Login Handler ─────────────────────────────────────────────────────────
  const handleLogin = useCallback((role: UserRole) => {
    const user = DEMO_USERS[role];
    setCurrentUser(user);
    useDashboardStore.getState().setActiveRole(role);
    useDashboardStore.getState().setActiveTab('overview');
    toast.success(`مرحباً ${user.name}`, { description: `تم تسجيل الدخول بنجاح` });
  }, [setCurrentUser]);

  // ─── Logout Handler ────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    useDashboardStore.getState().setActiveTab('overview');
    clearAllNotifications();
    toast.info('تم تسجيل الخروج');
  }, [setCurrentUser, clearAllNotifications]);

  // ─── Notification Actions ──────────────────────────────────────────────────
  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    toast.success('تم تحديد الكل كمقروء');
  }, [markAllAsRead]);

  const handlePlayVoice = useCallback((notif: AafiatakNotification) => {
    setSpeakingNotifId(notif.id);
    ttsService.speak(notif);
    setTimeout(() => setSpeakingNotifId(null), 3000);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  // ─── Nurse Actions ─────────────────────────────────────────────────────────
  const handleApproveNurse = useCallback((nurse: typeof MOCK_NURSES[0]) => {
    setLocalNurses(prev =>
      prev.map(n => n.id === nurse.id ? { ...n, status: 'approved' as const } : n)
    );
    notificationTriggers.approveNurse(nurse.id, nurse.name);
    const notif: AafiatakNotification = {
      id: `demo_${Date.now()}`,
      userId: nurse.id,
      type: 'admin-approval',
      title: 'Account Approved',
      titleAr: 'تمت الموافقة على حسابك',
      body: 'Your nurse account has been approved',
      bodyAr: `مرحبا ${nurse.name}، تمت الموافقة على حسابك كممرض في عافيتك`,
      category: 'system',
      priority: 'high',
      isRead: false,
      isVoiceRead: false,
      voicePlayed: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(notif);
    toast.success('تمت الموافقة على الممرض', { description: nurse.name });
    ttsService.speak(notif);
  }, [addNotification]);

  const handleRejectNurse = useCallback((nurse: typeof MOCK_NURSES[0]) => {
    setLocalNurses(prev =>
      prev.map(n => n.id === nurse.id ? { ...n, status: 'rejected' as const } : n)
    );
    notificationTriggers.rejectNurse(nurse.id, nurse.name, 'لم تستوف الشروط المطلوبة');
    const notif: AafiatakNotification = {
      id: `demo_${Date.now()}`,
      userId: nurse.id,
      type: 'rejection',
      title: 'Registration Rejected',
      titleAr: 'تم رفض طلب التسجيل',
      body: 'Your registration has been rejected',
      bodyAr: `عذرا ${nurse.name}، تم رفض طلب التسجيل: لم تستوف الشروط المطلوبة`,
      category: 'system',
      priority: 'high',
      isRead: false,
      isVoiceRead: false,
      voicePlayed: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(notif);
    toast.error('تم رفض الممرض', { description: nurse.name });
    ttsService.speak(notif);
  }, [addNotification]);

  // ─── Payment Actions ───────────────────────────────────────────────────────
  const handleConfirmPayment = useCallback((payment: Payment) => {
    notificationTriggers.paymentReceived(payment.id, payment.amount, 'محمد المستفيد');
    const notif: AafiatakNotification = {
      id: `demo_${Date.now()}`,
      userId: currentUser?.id || 'admin-1',
      type: 'payment-confirmed',
      title: 'Payment Confirmed',
      titleAr: 'تأكيد الدفع',
      body: 'Payment confirmed successfully',
      bodyAr: `تم تأكيد عملية الدفع بمبلغ ${payment.amount} ريال`,
      category: 'payment',
      priority: 'normal',
      isRead: false,
      isVoiceRead: false,
      voicePlayed: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(notif);
    toast.success('تم تأكيد الدفع', { description: `مبلغ ${payment.amount} ريال` });
  }, [addNotification, currentUser]);

  // ─── Filtered Notifications ────────────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (notifFilter === 'unread') result = result.filter(n => !n.isRead);
    else if (notifFilter === 'read') result = result.filter(n => n.isRead);

    if (categoryFilter !== 'all') result = result.filter(n => n.category === categoryFilter);

    return result;
  }, [notifications, notifFilter, categoryFilter]);

  // ─── Demo Triggers Config ──────────────────────────────────────────────────
  const demoTriggers: DemoTrigger[] = useMemo(() => [
    { id: 'newServiceRequest', label: 'طلب خدمة جديد', icon: ClipboardList, trigger: () => handleDemoTrigger('newServiceRequest') },
    { id: 'nurseRegistered', label: 'تسجيل ممرض', icon: Stethoscope, trigger: () => handleDemoTrigger('nurseRegistered') },
    { id: 'paymentReceived', label: 'دفعة جديدة', icon: CreditCard, trigger: () => handleDemoTrigger('paymentReceived') },
    { id: 'newAssignment', label: 'تعيين حالة', icon: UserCheck, trigger: () => handleDemoTrigger('newAssignment') },
    { id: 'nurseOnTheWay', label: 'ممرض في الطريق', icon: MapPin, trigger: () => handleDemoTrigger('nurseOnTheWay') },
    { id: 'serviceCompleted', label: 'إكمال الخدمة', icon: CheckCircle2, trigger: () => handleDemoTrigger('serviceCompleted') },
    { id: 'newMessage', label: 'رسالة جديدة', icon: MessageSquare, trigger: () => handleDemoTrigger('newMessage') },
  ], [handleDemoTrigger]);

  // ─── Sidebar Items ─────────────────────────────────────────────────────────
  const sidebarItems = currentUser ? SIDEBAR_ITEMS[currentUser.role] : [];

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 40%, #0891b2 70%, #d97706 100%)' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 rounded-full opacity-10 bg-white"
            animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '10%', right: '10%' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full opacity-10 bg-white"
            animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '15%', left: '15%' }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full opacity-5 bg-white"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '50%', left: '50%' }}
          />
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white opacity-20"
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              style={{ left: `${15 + i * 15}%`, top: `${60 + (i % 3) * 10}%` }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <Card className="glass border-white/30 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto w-24 h-24 mb-6 relative"
              >
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <img src="/logo-192.png" alt="عافيتك" className="w-16 h-16 object-contain" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* App Name */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-white mb-2"
              >
                عافيتك
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-lg mb-8"
              >
                نظام الرعاية الصحية المنزلية
              </motion.p>

              {/* Voice wave animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-1 mb-8"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
                <Volume2 className="w-5 h-5 text-white/60 mr-2" />
              </motion.div>

              {/* Login Buttons */}
              <div className="space-y-4">
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                  <Button
                    onClick={() => handleLogin('admin')}
                    className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-600/40"
                    size="lg"
                  >
                    <Shield className="w-6 h-6 ml-2" />
                    دخول كإدارة
                  </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 }}>
                  <Button
                    onClick={() => handleLogin('nurse')}
                    className="w-full h-14 text-lg font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-600/40"
                    size="lg"
                  >
                    <Stethoscope className="w-6 h-6 ml-2" />
                    دخول كممرض
                  </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
                  <Button
                    onClick={() => handleLogin('beneficiary')}
                    className="w-full h-14 text-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-600/40"
                    size="lg"
                  >
                    <Heart className="w-6 h-6 ml-2" />
                    دخول كمستفيد
                  </Button>
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-white/50 text-sm mt-6"
              >
                تجربة توضيحية — جميع البيانات وهمية
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  const role = currentUser.role;
  const roleColor = getRoleColor(role);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
        {/* ─── HEADER ──────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 shadow-md"
          style={{ backgroundColor: roleColor }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white lg:hidden">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0" style={{ direction: 'rtl' }}>
                <SheetHeader className="p-4 border-b" style={{ backgroundColor: roleColor }}>
                  <SheetTitle className="text-white flex items-center gap-2">
                    <img src="/logo-192.png" alt="عافيتك" className="w-8 h-8" />
                    عافيتك
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-2">
                  {sidebarItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start mb-1 gap-3 h-11"
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <Badge variant="destructive" className="mr-auto text-xs">{unreadCount}</Badge>
                      )}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo + App Name */}
            <div className="flex items-center gap-2">
              <img src="/logo-192.png" alt="عافيتك" className="w-9 h-9 rounded-lg" />
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-lg leading-tight">عافيتك</h1>
                <p className="text-white/70 text-xs leading-tight">نظام الرعاية الصحية</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/15">
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full"
                    animate={{
                      backgroundColor: connectionStatus === 'connected' ? '#4ade80' : connectionStatus === 'connecting' ? '#fbbf24' : '#f87171',
                    }}
                  />
                  <span className="text-white text-xs hidden sm:inline">
                    {connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {connectionStatus === 'connected' ? 'WebSocket متصل' : connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'غير متصل بالخادم'}
              </TooltipContent>
            </Tooltip>

            {/* Notification Bell */}
            <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/15">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0" style={{ direction: 'rtl' }}>
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllAsRead}>
                      تحديد الكل كمقروء
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="p-3 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${priorityColor(notif.priority)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${!notif.isRead ? 'font-bold' : ''}`}>
                                {notif.titleAr}
                              </p>
                              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{notif.bodyAr}</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => { setActiveTab('notifications'); setBellOpen(false); }}
                  >
                    عرض جميع الإشعارات
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar & Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/15 gap-2">
                  <Avatar className="w-8 h-8 border-2 border-white/40">
                    <AvatarFallback className="text-xs" style={{ backgroundColor: roleColor, color: 'white' }}>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" style={{ direction: 'rtl' }}>
                <div className="p-3 border-b">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <Badge className={`mt-1 text-xs ${getRoleLightBg(role)}`} variant="outline">
                    {ROLE_LABELS[role].ar}
                  </Badge>
                </div>
                <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ─── MAIN CONTENT AREA ───────────────────────────────────────────── */}
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-64 bg-white border-l flex-col shadow-sm">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${roleColor}10` }}>
                <Avatar className="w-10 h-10" style={{ backgroundColor: roleColor }}>
                  <AvatarFallback className="text-white font-bold">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{currentUser.name}</p>
                  <Badge variant="outline" className={`text-[10px] ${getRoleLightBg(role)}`}>
                    {ROLE_LABELS[role].ar}
                  </Badge>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-11 transition-all duration-200 ${
                    activeTab === item.id ? 'font-semibold' : ''
                  }`}
                  style={activeTab === item.id ? { backgroundColor: `${roleColor}15`, color: roleColor } : {}}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="w-5 h-5" style={activeTab === item.id ? { color: roleColor } : {}} />
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <Badge variant="destructive" className="mr-auto text-xs h-5 min-w-[20px] flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </nav>

            <div className="p-3 border-t">
              <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </Button>
            </div>
          </aside>

          {/* ─── MAIN PANEL ────────────────────────────────────────────────── */}
          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4 md:p-6"
              >
                {/* ═══ OVERVIEW TAB ═══════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">مرحباً، {currentUser.name}</h2>
                        <p className="text-muted-foreground">لوحة تحكم {ROLE_LABELS[role].ar}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleLightBg(role)}>
                          {ROLE_LABELS[role].ar}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {role === 'admin' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: 'إجمالي المستخدمين', value: '1,247', icon: Users, trend: '+12%', up: true, color: '#059669' },
                          { label: 'الممرضين النشطين', value: '89', icon: Stethoscope, trend: '+5%', up: true, color: '#0891b2' },
                          { label: 'الطلبات المعلقة', value: '23', icon: ClipboardList, trend: '-3%', up: false, color: '#d97706' },
                          { label: 'الإيرادات', value: '٤٥,٦٧٠ ر.س', icon: DollarSign, trend: '+18%', up: true, color: '#059669' },
                          { label: 'بانتظار الموافقة', value: '7', icon: Clock, trend: '+2', up: true, color: '#dc2626' },
                          { label: 'طلبات اليوم', value: '34', icon: CalendarDays, trend: '+8%', up: true, color: '#7c3aed' },
                        ].map((stat, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      {stat.trend}
                                    </div>
                                  </div>
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {role === 'nurse' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'الحالات المعينة', value: '8', icon: UserCheck, trend: '+2', up: true, color: '#0891b2' },
                          { label: 'المكتملة اليوم', value: '3', icon: CheckCircle2, trend: '+1', up: true, color: '#059669' },
                          { label: 'التقييم', value: '4.8', icon: Star, trend: '+0.2', up: true, color: '#d97706' },
                          { label: 'مواعيد قادمة', value: '5', icon: CalendarDays, trend: '3 غداً', up: true, color: '#7c3aed' },
                        ].map((stat, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      {stat.trend}
                                    </div>
                                  </div>
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {role === 'beneficiary' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: 'الطلبات النشطة', value: '3', icon: ClipboardList, trend: '+1', up: true, color: '#d97706' },
                          { label: 'الخدمات المكتملة', value: '12', icon: CheckCircle2, trend: '+2', up: true, color: '#059669' },
                          { label: 'المدفوعات المعلقة', value: '1', icon: CreditCard, trend: '٥٠٠ ر.س', up: false, color: '#dc2626' },
                        ].map((stat, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      {stat.trend}
                                    </div>
                                  </div>
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {role === 'admin' && (
                            <>
                              {[
                                { label: 'إشعار جديد', icon: Bell, action: () => handleDemoTrigger('newServiceRequest') },
                                { label: 'مراجعة الممرضين', icon: Stethoscope, action: () => setActiveTab('nurses') },
                                { label: 'مراجعة الطلبات', icon: ClipboardList, action: () => setActiveTab('requests') },
                                { label: 'الإعدادات', icon: Settings, action: () => setActiveTab('settings') },
                              ].map((item, i) => (
                                <Button key={i} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={item.action}>
                                  <item.icon className="w-6 h-6" style={{ color: roleColor }} />
                                  <span className="text-xs">{item.label}</span>
                                </Button>
                              ))}
                            </>
                          )}
                          {role === 'nurse' && (
                            <>
                              {[
                                { label: 'إشعار جديد', icon: Bell, action: () => handleDemoTrigger('newAssignment') },
                                { label: 'المرضى', icon: Heart, action: () => setActiveTab('patients') },
                                { label: 'الحالات', icon: UserCheck, action: () => setActiveTab('assignments') },
                                { label: 'الإعدادات', icon: Settings, action: () => setActiveTab('settings') },
                              ].map((item, i) => (
                                <Button key={i} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={item.action}>
                                  <item.icon className="w-6 h-6" style={{ color: roleColor }} />
                                  <span className="text-xs">{item.label}</span>
                                </Button>
                              ))}
                            </>
                          )}
                          {role === 'beneficiary' && (
                            <>
                              {[
                                { label: 'طلب جديد', icon: ClipboardList, action: () => handleDemoTrigger('newServiceRequest') },
                                { label: 'طلباتي', icon: FileText, action: () => setActiveTab('requests') },
                                { label: 'المدفوعات', icon: CreditCard, action: () => setActiveTab('payments') },
                                { label: 'الإعدادات', icon: Settings, action: () => setActiveTab('settings') },
                              ].map((item, i) => (
                                <Button key={i} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={item.action}>
                                  <item.icon className="w-6 h-6" style={{ color: roleColor }} />
                                  <span className="text-xs">{item.label}</span>
                                </Button>
                              ))}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">النشاط الأخير</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {notifications.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>لا يوجد نشاط بعد</p>
                            <p className="text-sm mt-1">استخدم لوحة المحاكاة أدناه لتشغيل الإشعارات</p>
                          </div>
                        ) : (
                          <ScrollArea className="max-h-64">
                            <div className="space-y-3">
                              {notifications.slice(0, 8).map((notif) => (
                                <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${priorityColor(notif.priority)}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{notif.titleAr}</p>
                                    <p className="text-xs text-muted-foreground truncate">{notif.bodyAr}</p>
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ═══ NOTIFICATIONS TAB ══════════════════════════════════════ */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h2 className="text-2xl font-bold">مركز الإشعارات</h2>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                          <RefreshCw className={`w-4 h-4 ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                          تحديث
                        </Button>
                        {notifications.length > 0 && (
                          <>
                            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                              <Check className="w-4 h-4 ml-1" />
                              تحديد الكل كمقروء
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={clearAllNotifications}>
                              <Trash2 className="w-4 h-4 ml-1" />
                              مسح الكل
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Filters */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex gap-1">
                            {(['all', 'unread', 'read'] as const).map((filter) => (
                              <Button
                                key={filter}
                                variant={notifFilter === filter ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setNotifFilter(filter)}
                                style={notifFilter === filter ? { backgroundColor: roleColor } : {}}
                              >
                                {filter === 'all' ? 'الكل' : filter === 'unread' ? 'غير مقروء' : 'مقروء'}
                              </Button>
                            ))}
                          </div>
                          <Separator orientation="vertical" className="hidden sm:block h-8" />
                          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as NotificationCategory | 'all')}>
                            <SelectTrigger className="w-40">
                              <Filter className="w-4 h-4 ml-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الفئات</SelectItem>
                              <SelectItem value="system">نظام</SelectItem>
                              <SelectItem value="service">خدمات</SelectItem>
                              <SelectItem value="payment">مدفوعات</SelectItem>
                              <SelectItem value="message">رسائل</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{filteredNotifications.length} إشعار</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notifications List */}
                    {filteredNotifications.length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                          <h3 className="text-lg font-semibold text-muted-foreground mb-1">لا توجد إشعارات</h3>
                          <p className="text-sm text-muted-foreground">استخدم لوحة المحاكاة لتشغيل إشعارات تجريبية</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ScrollArea className="max-h-[calc(100vh-320px)]">
                        <div className="space-y-2">
                          <AnimatePresence>
                            {filteredNotifications.map((notif) => (
                              <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`${notif.priority === 'urgent' ? 'priority-urgent' : notif.priority === 'high' ? 'priority-high' : ''}`}
                              >
                                <Card className={`transition-all hover:shadow-md ${!notif.isRead ? 'border-r-4' : ''}`} style={!notif.isRead ? { borderRightColor: roleColor } : {}}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      {/* Priority Dot */}
                                      <div className="flex flex-col items-center gap-1 pt-1">
                                        <div className={`w-3 h-3 rounded-full ${priorityColor(notif.priority)}`} />
                                        <span className="text-[10px] text-muted-foreground">{priorityLabel(notif.priority)}</span>
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className={`text-sm ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                                            {notif.titleAr}
                                          </p>
                                          {!notif.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                          )}
                                          <Badge variant="outline" className="text-[10px] shrink-0">
                                            {notif.category === 'system' ? 'نظام' : notif.category === 'service' ? 'خدمة' : notif.category === 'payment' ? 'دفع' : 'رسالة'}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{notif.bodyAr}</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handlePlayVoice(notif)}
                                            >
                                              {speakingNotifId === notif.id ? (
                                                <div className="flex items-center gap-0.5">
                                                  {[...Array(3)].map((_, i) => (
                                                    <motion.div
                                                      key={i}
                                                      className="w-0.5 bg-emerald-500 rounded-full"
                                                      animate={{ height: [4, 12, 4] }}
                                                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                    />
                                                  ))}
                                                </div>
                                              ) : (
                                                <Volume2 className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>تشغيل الصوت</TooltipContent>
                                        </Tooltip>

                                        {!notif.isRead && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleMarkAsRead(notif.id)}
                                              >
                                                <Check className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>تحديد كمقروء</TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* ═══ NURSES TAB (Admin only) ════════════════════════════════ */}
                {activeTab === 'nurses' && role === 'admin' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">إدارة الممرضين</h2>
                      <Badge variant="outline">{localNurses.filter(n => n.status === 'pending').length} بانتظار الموافقة</Badge>
                    </div>

                    <div className="grid gap-3">
                      {localNurses.map((nurse, i) => (
                        <motion.div key={nurse.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Nurse Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold">
                                      {nurse.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold truncate">{nurse.name}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                      <span>{nurse.specialty}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <span>رخصة: {nurse.licenseNo}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <span>خبرة: {nurse.experience} سنوات</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={statusBadgeVariant(nurse.status)}>{statusLabel(nurse.status)}</Badge>
                                      <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {nurse.rating}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                {nurse.status === 'pending' && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                      onClick={() => handleApproveNurse(nurse)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 ml-1" />
                                      موافقة
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectNurse(nurse)}
                                    >
                                      <XCircle className="w-4 h-4 ml-1" />
                                      رفض
                                    </Button>
                                  </div>
                                )}
                                {nurse.status === 'approved' && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
                                    <CheckCircle2 className="w-3 h-3 ml-1" />
                                    معتمد
                                  </Badge>
                                )}
                                {nurse.status === 'rejected' && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">
                                    <XCircle className="w-3 h-3 ml-1" />
                                    مرفوض
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ ASSIGNMENTS TAB (Nurse only) ═══════════════════════════ */}
                {activeTab === 'assignments' && role === 'nurse' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">الحالات المعينة</h2>
                    <div className="grid gap-3">
                      {MOCK_REQUESTS.filter(r => r.status === 'accepted' || r.status === 'in-progress').map((req, i) => (
                        <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={statusBadgeVariant(req.status)}>{statusLabel(req.status)}</Badge>
                                    <Badge variant="outline">{SERVICE_TYPES[req.serviceType]?.ar || req.serviceType}</Badge>
                                  </div>
                                  <p className="font-medium">{req.description}</p>
                                  {req.location && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {req.location}
                                    </div>
                                  )}
                                  {req.scheduledAt && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(req.scheduledAt).toLocaleDateString('ar-SA')}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => handleDemoTrigger('nurseOnTheWay')}>
                                    <MapPin className="w-3 h-3 ml-1" />
                                    في الطريق
                                  </Button>
                                  <Button size="sm" style={{ backgroundColor: roleColor }} className="text-white" onClick={() => handleDemoTrigger('serviceCompleted')}>
                                    <CheckCircle2 className="w-3 h-3 ml-1" />
                                    إكمال
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ PATIENTS TAB (Nurse only) ══════════════════════════════ */}
                {activeTab === 'patients' && role === 'nurse' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">المرضى</h2>
                    <div className="grid gap-3">
                      {[
                        { name: 'أحمد المريض', age: 65, condition: 'سكري - ضغط', service: 'رعاية منزلية', status: 'in-progress' },
                        { name: 'خالد العمري', age: 72, condition: 'إعاقة حركية', service: 'علاج طبيعي', status: 'in-progress' },
                        { name: 'سعاد الحربي', age: 58, condition: 'أمراض قلب', service: 'تمريض', status: 'completed' },
                      ].map((patient, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-cyan-100 text-cyan-700">{patient.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{patient.name}</p>
                                    <Badge variant={statusBadgeVariant(patient.status)}>{statusLabel(patient.status)}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">العمر: {patient.age} سنة — {patient.condition}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">الخدمة: {patient.service}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleDemoTrigger('patientUpdate')}>
                                  <Heart className="w-3 h-3 ml-1" />
                                  تحديث
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ REQUESTS TAB ═══════════════════════════════════════════ */}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">{role === 'beneficiary' ? 'طلباتي' : 'الطلبات'}</h2>
                      {role === 'beneficiary' && (
                        <Button style={{ backgroundColor: roleColor }} className="text-white" onClick={() => handleDemoTrigger('newServiceRequest')}>
                          <ClipboardList className="w-4 h-4 ml-1" />
                          طلب جديد
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {(role === 'beneficiary'
                        ? MOCK_REQUESTS.filter(r => r.beneficiaryId === 'beneficiary-1')
                        : MOCK_REQUESTS
                      ).map((req, i) => (
                        <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={statusBadgeVariant(req.status)}>{statusLabel(req.status)}</Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {SERVICE_TYPES[req.serviceType]?.ar || req.serviceType}
                                    </Badge>
                                  </div>
                                  <p className="font-medium">{req.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                    {req.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {req.location}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timeAgo(req.createdAt)}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {role === 'admin' && req.status === 'pending' && (
                                    <>
                                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleDemoTrigger('newAssignment')}>
                                        <UserCheck className="w-3 h-3 ml-1" />
                                        تعيين ممرض
                                      </Button>
                                    </>
                                  )}
                                  {role === 'nurse' && req.status === 'pending' && (
                                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => handleDemoTrigger('newAssignment')}>
                                      <CheckCircle2 className="w-3 h-3 ml-1" />
                                      قبول
                                    </Button>
                                  )}
                                  {role === 'beneficiary' && req.status === 'in-progress' && (
                                    <Button size="sm" variant="outline" onClick={() => handleDemoTrigger('nurseOnTheWay')}>
                                      <MapPin className="w-3 h-3 ml-1" />
                                      تتبع الممرض
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ PAYMENTS TAB ══════════════════════════════════════════ */}
                {activeTab === 'payments' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">المدفوعات</h2>
                    <div className="grid gap-3">
                      {MOCK_PAYMENTS.map((payment, i) => (
                        <motion.div key={payment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-lg">{payment.amount} ر.س</p>
                                      <Badge variant={statusBadgeVariant(payment.status)}>{statusLabel(payment.status)}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span>{payment.method}</span>
                                      {payment.transactionId && (
                                        <>
                                          <Separator orientation="vertical" className="h-3" />
                                          <span className="font-mono text-xs">{payment.transactionId}</span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(payment.createdAt)}</p>
                                  </div>
                                </div>

                                {payment.status === 'pending' && role === 'admin' && (
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleConfirmPayment(payment)}>
                                    <Check className="w-3 h-3 ml-1" />
                                    تأكيد الدفع
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Payment Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">ملخص المدفوعات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-xs text-muted-foreground">المؤكدة</p>
                            <p className="text-xl font-bold text-emerald-600">{MOCK_PAYMENTS.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)} ر.س</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-xl">
                            <p className="text-xs text-muted-foreground">المعلقة</p>
                            <p className="text-xl font-bold text-amber-600">{MOCK_PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)} ر.س</p>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-xl">
                            <p className="text-xs text-muted-foreground">المستردة</p>
                            <p className="text-xl font-bold text-red-600">{MOCK_PAYMENTS.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)} ر.س</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-muted-foreground">الإجمالي</p>
                            <p className="text-xl font-bold">{MOCK_PAYMENTS.reduce((s, p) => s + p.amount, 0)} ر.س</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ═══ SETTINGS TAB ══════════════════════════════════════════ */}
                {activeTab === 'settings' && (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">الإعدادات</h2>

                    {/* Voice Notification Settings */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5" style={{ color: roleColor }} />
                          <CardTitle className="text-lg">إعدادات الإشعارات الصوتية</CardTitle>
                        </div>
                        <CardDescription>إدارة تفضيلات الإشعارات الصوتية والإعدادات</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {voiceSettings.enabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                            <Label>تفعيل الإشعارات الصوتية</Label>
                          </div>
                          <Switch
                            checked={voiceSettings.enabled}
                            onCheckedChange={(checked) => updateVoiceSettings({ enabled: checked })}
                          />
                        </div>

                        <Separator />

                        {/* Volume */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>مستوى الصوت</Label>
                            <Badge variant="outline">{voiceSettings.volume}%</Badge>
                          </div>
                          <Slider
                            value={[voiceSettings.volume]}
                            onValueChange={([value]) => updateVoiceSettings({ volume: value })}
                            max={100}
                            step={5}
                            disabled={!voiceSettings.enabled}
                          />
                        </div>

                        {/* Voice Gender */}
                        <div className="space-y-3">
                          <Label>صوت القارئ</Label>
                          <RadioGroup
                            value={voiceSettings.voiceGender}
                            onValueChange={(value) => updateVoiceSettings({ voiceGender: value as 'male' | 'female' })}
                            disabled={!voiceSettings.enabled}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male" className="cursor-pointer">ذكر</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female" className="cursor-pointer">أنثى</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Language */}
                        <div className="space-y-3">
                          <Label>لغة الإشعارات</Label>
                          <RadioGroup
                            value={voiceSettings.language}
                            onValueChange={(value) => updateVoiceSettings({ language: value as 'ar' | 'en' })}
                            disabled={!voiceSettings.enabled}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="ar" id="ar" />
                              <Label htmlFor="ar" className="cursor-pointer">العربية</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="en" id="en" />
                              <Label htmlFor="en" className="cursor-pointer">English</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Speech Rate */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>سرعة القراءة</Label>
                            <Badge variant="outline">{voiceSettings.rate.toFixed(1)}x</Badge>
                          </div>
                          <Slider
                            value={[voiceSettings.rate * 100]}
                            onValueChange={([value]) => updateVoiceSettings({ rate: value / 100 })}
                            min={50}
                            max={200}
                            step={10}
                            disabled={!voiceSettings.enabled}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>بطيء</span>
                            <span>عادي</span>
                            <span>سريع</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Quiet Hours */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4" />
                              <Label>ساعات الهدوء</Label>
                            </div>
                            <Switch
                              checked={voiceSettings.quietHoursEnabled}
                              onCheckedChange={(checked) => updateVoiceSettings({ quietHoursEnabled: checked })}
                              disabled={!voiceSettings.enabled}
                            />
                          </div>
                          {voiceSettings.quietHoursEnabled && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">من</Label>
                                <Input
                                  type="time"
                                  value={voiceSettings.quietStart || '22:00'}
                                  onChange={(e) => updateVoiceSettings({ quietStart: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">إلى</Label>
                                <Input
                                  type="time"
                                  value={voiceSettings.quietEnd || '07:00'}
                                  onChange={(e) => updateVoiceSettings({ quietEnd: e.target.value })}
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <Separator />

                        {/* Test Voice */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => ttsService.testVoice(voiceSettings.voiceGender, voiceSettings.language)}
                            disabled={!voiceSettings.enabled}
                            style={{ backgroundColor: roleColor }}
                            className="text-white"
                          >
                            <Play className="w-4 h-4 ml-1" />
                            اختبار الصوت
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => notificationSystem.requestPermission()}
                          >
                            <Bell className="w-4 h-4 ml-1" />
                            طلب إذن الإشعارات
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* App Settings */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5" style={{ color: roleColor }} />
                          <CardTitle className="text-lg">إعدادات التطبيق</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>الإشعارات الفورية</Label>
                            <p className="text-xs text-muted-foreground">استقبال إشعارات فورية عبر WebSocket</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>إشعارات المتصفح</Label>
                            <p className="text-xs text-muted-foreground">عرض إشعارات في المتصفح</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>تأثيرات صوتية</Label>
                            <p className="text-xs text-muted-foreground">تشغيل صوت عند وصول إشعار</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account Info */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" style={{ color: roleColor }} />
                          <CardTitle className="text-lg">معلومات الحساب</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarFallback className="text-xl" style={{ backgroundColor: roleColor, color: 'white' }}>
                              {currentUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg">{currentUser.name}</p>
                            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                            <Badge className={`mt-1 ${getRoleLightBg(role)}`} variant="outline">
                              {ROLE_LABELS[role].ar}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* ═══ LIVE DEMO PANEL ═════════════════════════════════════════════════ */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40"
          initial={{ y: 0 }}
          animate={{ y: demoPanelOpen ? 0 : 60 }}
        >
          {/* Toggle button */}
          <div className="flex justify-center -mb-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-b-none rounded-t-lg shadow-md bg-white border-b-0 text-xs gap-1"
              onClick={() => setDemoPanelOpen(!demoPanelOpen)}
            >
              <Zap className="w-3 h-3" />
              لوحة المحاكاة
              <motion.div animate={{ rotate: demoPanelOpen ? 180 : 0 }}>
                <ChevronLeft className="w-3 h-3" />
              </motion.div>
            </Button>
          </div>

          {/* Panel content */}
          <AnimatePresence>
            {demoPanelOpen && (
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                className="bg-white/95 backdrop-blur-lg border-t shadow-2xl"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" style={{ color: roleColor }} />
                    <h3 className="text-sm font-semibold">محاكاة الإشعارات الصوتية</h3>
                    <Badge variant="outline" className="text-[10px] mr-auto">تجريبي</Badge>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {demoTriggers.map((trigger) => (
                      <Button
                        key={trigger.id}
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs gap-1.5 h-9"
                        style={{ borderColor: `${roleColor}40`, color: roleColor }}
                        onClick={trigger.trigger}
                      >
                        <trigger.icon className="w-3.5 h-3.5" />
                        {trigger.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
