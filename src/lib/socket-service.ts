'use client';

import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/stores/notification-store';
import type { AafiatakUser, SocketNotificationPayload } from '@/types/aafiatak';

const NOTIFICATION_SERVICE_PORT = 3003;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  connect(user: AafiatakUser) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.socket = io('/?XTransformPort=' + NOTIFICATION_SERVICE_PORT, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      useNotificationStore.getState().setConnected(true, this.socket?.id || null);

      // Authenticate
      this.socket?.emit('auth', {
        userId: user.id,
        role: user.role,
        deviceId: this.getDeviceId(),
      });

      // Start heartbeat
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      useNotificationStore.getState().setConnected(false);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
      }
    });

    // Listen for notifications
    this.socket.on('notification', (data: SocketNotificationPayload & { timestamp: string }) => {
      this.handleIncomingNotification(data);
    });

    // Sync read status
    this.socket.on('notification:read:sync', (data: { notificationId: string; readAt: string }) => {
      useNotificationStore.getState().markAsRead(data.notificationId);
    });

    this.socket.on('notification:readAll:sync', () => {
      useNotificationStore.getState().markAllAsRead();
    });

    // Sync voice played
    this.socket.on('voice:played:sync', (data: { notificationId: string; playedAt: string }) => {
      const store = useNotificationStore.getState();
      store.updateVoiceSettings({}); // trigger re-render
    });

    // User status updates
    this.socket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      useNotificationStore.getState().updateUserOnlineStatus(data.userId, data.isOnline);
    });

    // Typing indicator
    this.socket.on('typing', (data: { senderId: string }) => {
      // Could emit a custom event or update store
      console.log('[Socket] User typing:', data.senderId);
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useNotificationStore.getState().setConnected(false);
  }

  private handleIncomingNotification(data: SocketNotificationPayload & { timestamp: string }) {
    const store = useNotificationStore.getState();
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId || store.currentUser?.id || '',
      type: data.type,
      title: data.title,
      titleAr: data.titleAr,
      body: data.body,
      bodyAr: data.bodyAr,
      category: data.category,
      priority: data.priority,
      isRead: false,
      isVoiceRead: false,
      data: data.data,
      voicePlayed: false,
      createdAt: data.timestamp || new Date().toISOString(),
    };

    store.addNotification(notification);

    // Trigger voice notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aafiatak:voice-notification', {
          detail: notification,
        })
      );
    }

    // Show browser notification if permitted
    this.showBrowserNotification(notification);
  }

  private showBrowserNotification(notification: any) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const permission = Notification.permission;
    if (permission === 'granted') {
      this.createBrowserNotification(notification);
    } else if (permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          this.createBrowserNotification(notification);
        }
      });
    }
  }

  private createBrowserNotification(notification: any) {
    const lang = useNotificationStore.getState().voiceSettings.language;
    const title = lang === 'ar' ? notification.titleAr : notification.title;
    const body = lang === 'ar' ? notification.bodyAr : notification.body;

    try {
      const browserNotif = new Notification(title, {
        body,
        icon: '/logo-192.png',
        badge: '/badge-72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: false,
        data: notification.data,
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };
    } catch (e) {
      console.error('[Notification] Browser notification failed:', e);
    }
  }

  // Send notification to specific user
  sendToUser(payload: Omit<SocketNotificationPayload, 'userId'> & { userId: string }) {
    this.socket?.emit('notify:user', payload);
  }

  // Send notification to role
  sendToRole(payload: Omit<SocketNotificationPayload, 'userId'> & { role: string }) {
    this.socket?.emit('notify:role', payload);
  }

  // Send notification to multiple users
  sendToUsers(payload: Omit<SocketNotificationPayload, 'userId'> & { userIds: string[] }) {
    this.socket?.emit('notify:users', payload);
  }

  // Mark notification as read (syncs across devices)
  markAsRead(notificationId: string) {
    const userId = useNotificationStore.getState().currentUser?.id;
    if (userId) {
      this.socket?.emit('notification:read', { notificationId, userId });
    }
  }

  // Mark all as read
  markAllAsRead() {
    const userId = useNotificationStore.getState().currentUser?.id;
    if (userId) {
      this.socket?.emit('notification:readAll', { userId });
    }
  }

  // Acknowledge voice played
  voicePlayed(notificationId: string) {
    const userId = useNotificationStore.getState().currentUser?.id;
    if (userId) {
      this.socket?.emit('voice:played', { notificationId, userId });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    let deviceId = localStorage.getItem('aafiatak_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aafiatak_device_id', deviceId);
    }
    return deviceId;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
