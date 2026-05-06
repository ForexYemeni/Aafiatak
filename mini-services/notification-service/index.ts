import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track online users and their socket connections
const userSockets = new Map<string, Set<string>>();
const socketUsers = new Map<string, { userId: string; role: string; deviceIds: string[] }>();

// Notification queue for offline users
const offlineQueue = new Map<string, any[]>();

// Deduplication cache
const recentNotifications = new Map<string, number>();
const DEDUP_WINDOW = 5000; // 5 seconds

function generateNotifId(data: any): string {
  return `${data.userId}:${data.type}:${data.typeId || ""}:${Math.floor(Date.now() / DEDUP_WINDOW)}`;
}

function isDuplicate(data: any): boolean {
  const key = generateNotifId(data);
  const now = Date.now();
  if (recentNotifications.has(key)) {
    return true;
  }
  recentNotifications.set(key, now);
  // Clean old entries
  for (const [k, v] of recentNotifications) {
    if (now - v > DEDUP_WINDOW * 2) recentNotifications.delete(k);
  }
  return false;
}

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // User authentication / registration
  socket.on("auth", (data: { userId: string; role: string; deviceId?: string }) => {
    const { userId, role, deviceId } = data;

    // Map user to socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    socketUsers.set(socket.id, { userId, role, deviceIds: deviceId ? [deviceId] : [] });

    // Join role-based room
    socket.join(`role:${role}`);
    // Join user-specific room
    socket.join(`user:${userId}`);

    console.log(`[Auth] User ${userId} (${role}) authenticated on socket ${socket.id}`);

    // Deliver queued notifications for offline users
    if (offlineQueue.has(userId)) {
      const queued = offlineQueue.get(userId)!;
      queued.forEach((notif) => {
        socket.emit("notification", notif);
      });
      offlineQueue.delete(userId);
      console.log(`[Queue] Delivered ${queued.length} queued notifications to ${userId}`);
    }

    // Broadcast user online status
    io.emit("user:status", { userId, isOnline: true });
  });

  // Send notification to specific user
  socket.on("notify:user", (data: any) => {
    if (isDuplicate(data)) {
      console.log(`[Dedup] Skipped duplicate notification for user ${data.userId}`);
      return;
    }

    const userSocketSet = userSockets.get(data.userId);
    if (userSocketSet && userSocketSet.size > 0) {
      // User is online - deliver to all their devices
      io.to(`user:${data.userId}`).emit("notification", {
        ...data,
        timestamp: new Date().toISOString(),
        delivered: true,
      });
      console.log(`[Notify] Sent to user ${data.userId}: ${data.type}`);
    } else {
      // User is offline - queue the notification
      if (!offlineQueue.has(data.userId)) {
        offlineQueue.set(data.userId, []);
      }
      offlineQueue.get(data.userId)!.push({
        ...data,
        timestamp: new Date().toISOString(),
        queued: true,
      });
      console.log(`[Queue] Queued notification for offline user ${data.userId}`);
    }
  });

  // Send notification to all users of a role
  socket.on("notify:role", (data: { role: string; type: string; title: string; body: string; [key: string]: any }) => {
    io.to(`role:${data.role}`).emit("notification", {
      ...data,
      timestamp: new Date().toISOString(),
      broadcast: true,
    });
    console.log(`[Broadcast] Sent to role ${data.role}: ${data.type}`);
  });

  // Send notification to multiple users
  socket.on("notify:users", (data: { userIds: string[]; type: string; title: string; body: string; [key: string]: any }) => {
    data.userIds.forEach((userId) => {
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet && userSocketSet.size > 0) {
        io.to(`user:${userId}`).emit("notification", {
          ...data,
          userId,
          timestamp: new Date().toISOString(),
          delivered: true,
        });
      } else {
        if (!offlineQueue.has(userId)) {
          offlineQueue.set(userId, []);
        }
        offlineQueue.get(userId)!.push({
          ...data,
          userId,
          timestamp: new Date().toISOString(),
          queued: true,
        });
      }
    });
    console.log(`[Multi-Notify] Sent to ${data.userIds.length} users: ${data.type}`);
  });

  // Mark notification as read
  socket.on("notification:read", (data: { notificationId: string; userId: string }) => {
    // Sync read status across all user's devices
    io.to(`user:${data.userId}`).emit("notification:read:sync", {
      notificationId: data.notificationId,
      readAt: new Date().toISOString(),
    });
  });

  // Mark all notifications as read
  socket.on("notification:readAll", (data: { userId: string }) => {
    io.to(`user:${data.userId}`).emit("notification:readAll:sync", {
      readAt: new Date().toISOString(),
    });
  });

  // Voice notification played acknowledgment
  socket.on("voice:played", (data: { notificationId: string; userId: string }) => {
    io.to(`user:${data.userId}`).emit("voice:played:sync", {
      notificationId: data.notificationId,
      playedAt: new Date().toISOString(),
    });
  });

  // Typing indicator for messages
  socket.on("typing", (data: { senderId: string; receiverId: string }) => {
    io.to(`user:${data.receiverId}`).emit("typing", {
      senderId: data.senderId,
    });
  });

  // Heartbeat / keepalive
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    const userInfo = socketUsers.get(socket.id);
    if (userInfo) {
      const { userId } = userInfo;
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
          // User is now offline
          io.emit("user:status", { userId, isOnline: false, lastSeen: new Date().toISOString() });
          console.log(`[Offline] User ${userId} disconnected (all devices)`);
        }
      }
      socketUsers.delete(socket.id);
    }
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
  });
});

// Periodic cleanup of offline queue (remove items older than 24h)
setInterval(() => {
  const now = Date.now();
  for (const [userId, queue] of offlineQueue) {
    const filtered = queue.filter((n) => now - new Date(n.timestamp).getTime() < 86400000);
    if (filtered.length === 0) {
      offlineQueue.delete(userId);
    } else if (filtered.length !== queue.length) {
      offlineQueue.set(userId, filtered);
    }
  }
}, 3600000); // Every hour

httpServer.listen(PORT, () => {
  console.log(`🚀 Aafiatak Notification Service running on port ${PORT}`);
});

export { io, userSockets, socketUsers, offlineQueue };
