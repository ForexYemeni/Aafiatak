import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AafiatakNotification,
  AafiatakUser,
  VoiceSettings,
  UserRole,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  SocketNotificationPayload,
} from '@/types/aafiatak';

interface NotificationState {
  // Connection state
  isConnected: boolean;
  socketId: string | null;

  // Current user
  currentUser: AafiatakUser | null;

  // Notifications
  notifications: AafiatakNotification[];
  unreadCount: number;

  // Voice settings
  voiceSettings: VoiceSettings;

  // Online users
  onlineUsers: Map<string, boolean>;

  // Actions
  setConnected: (connected: boolean, socketId?: string) => void;
  setCurrentUser: (user: AafiatakUser | null) => void;
  addNotification: (notification: AafiatakNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  setOnlineUsers: (users: Map<string, boolean>) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
}

const defaultVoiceSettings: VoiceSettings = {
  id: '',
  userId: '',
  enabled: true,
  volume: 80,
  voiceGender: 'female',
  language: 'ar',
  rate: 1.0,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      socketId: null,
      currentUser: null,
      notifications: [],
      unreadCount: 0,
      voiceSettings: defaultVoiceSettings,
      onlineUsers: new Map(),

      setConnected: (connected, socketId) =>
        set({ isConnected: connected, socketId: socketId || null }),

      setCurrentUser: (user) =>
        set({ currentUser: user }),

      addNotification: (notification) =>
        set((state) => {
          // Deduplication check
          const exists = state.notifications.some(
            (n) =>
              n.type === notification.type &&
              n.userId === notification.userId &&
              Math.abs(new Date(n.createdAt).getTime() - new Date(notification.createdAt).getTime()) < 5000
          );
          if (exists) return state;

          const newNotifications = [notification, ...state.notifications].slice(0, 200);
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter((n) => !n.isRead).length,
          };
        }),

      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: state.notifications.filter(
            (n) => !n.isRead && n.id !== notificationId
          ).length,
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      removeNotification: (notificationId) =>
        set((state) => {
          const newNotifications = state.notifications.filter((n) => n.id !== notificationId);
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter((n) => !n.isRead).length,
          };
        }),

      clearAllNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),

      updateVoiceSettings: (settings) =>
        set((state) => ({
          voiceSettings: { ...state.voiceSettings, ...settings },
        })),

      setOnlineUsers: (users) => set({ onlineUsers: users }),

      updateUserOnlineStatus: (userId, isOnline) =>
        set((state) => {
          const newMap = new Map(state.onlineUsers);
          newMap.set(userId, isOnline);
          return { onlineUsers: newMap };
        }),
    }),
    {
      name: 'aafiatak-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 100),
        voiceSettings: state.voiceSettings,
        currentUser: state.currentUser,
      }),
    }
  )
);

// Dashboard store
interface DashboardState {
  activeRole: UserRole;
  sidebarOpen: boolean;
  activeTab: string;

  setActiveRole: (role: UserRole) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      activeRole: 'admin',
      sidebarOpen: true,
      activeTab: 'overview',

      setActiveRole: (role) => set({ activeRole: role, activeTab: 'overview' }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'aafiatak-dashboard',
    }
  )
);
