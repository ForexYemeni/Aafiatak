'use client';

import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import socketService from '@/lib/socket-service';
import ttsService from '@/lib/tts-service';
import { registerServiceWorker, requestNotificationPermission, requestFCMToken, onForegroundMessage } from '@/lib/firebase-config';
import type { AafiatakNotification } from '@/types/aafiatak';

export function useNotificationSystem() {
  const {
    currentUser,
    isConnected,
    notifications,
    unreadCount,
    voiceSettings,
    addNotification,
    markAsRead,
    markAllAsRead,
    setConnected,
  } = useNotificationStore();

  // Initialize the notification system
  useEffect(() => {
    if (!currentUser) return;

    // Connect to Socket.io
    socketService.connect(currentUser);

    // Register service worker
    registerServiceWorker();

    // Request notification permission
    requestNotificationPermission().then((permission) => {
      console.log('[Notifications] Permission:', permission);
      if (permission === 'granted') {
        requestFCMToken().then((token) => {
          if (token) {
            console.log('[FCM] Token registered');
          }
        });
      }
    });

    // Listen for foreground FCM messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[FCM] Foreground:', payload);
      if (payload.data) {
        const notification: AafiatakNotification = {
          id: `fcm_${Date.now()}`,
          userId: currentUser.id,
          type: (payload.data.type as any) || 'system',
          title: payload.notification?.title || 'إشعار',
          titleAr: payload.data.titleAr || payload.notification?.title || 'إشعار',
          body: payload.notification?.body || '',
          bodyAr: payload.data.bodyAr || payload.notification?.body || '',
          category: (payload.data.category as any) || 'system',
          priority: (payload.data.priority as any) || 'normal',
          isRead: false,
          isVoiceRead: false,
          voicePlayed: false,
          createdAt: new Date().toISOString(),
        };
        addNotification(notification);
      }
    });

    // Listen for voice notification events
    const handleVoiceNotification = (event: CustomEvent) => {
      const notification = event.detail as AafiatakNotification;
      ttsService.speak(notification);
    };

    window.addEventListener('aafiatak:voice-notification', handleVoiceNotification as EventListener);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_NOTIFICATIONS') {
          console.log('[SW] Sync request received');
        }
      });
    }

    return () => {
      socketService.disconnect();
      unsubscribe?.();
      window.removeEventListener('aafiatak:voice-notification', handleVoiceNotification as EventListener);
    };
  }, [currentUser]);

  // Handle voice notification for new notifications
  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].voicePlayed && !notifications[0].isRead) {
      ttsService.speak(notifications[0]);
    }
  }, [notifications]);

  const requestPermission = useCallback(async () => {
    return requestNotificationPermission();
  }, []);

  return {
    currentUser,
    isConnected,
    notifications,
    unreadCount,
    voiceSettings,
    markAsRead: (id: string) => {
      markAsRead(id);
      socketService.markAsRead(id);
    },
    markAllAsRead: () => {
      markAllAsRead();
      socketService.markAllAsRead();
    },
    stopVoice: () => ttsService.stop(),
    pauseVoice: () => ttsService.pause(),
    resumeVoice: () => ttsService.resume(),
    requestPermission,
  };
}
