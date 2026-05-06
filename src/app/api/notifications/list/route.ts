import { NextRequest, NextResponse } from 'next/server'
import { getNotificationsByUser, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firestore'

// ─── Server-side deduplication (v3 - STRONGER) ───
// Deduplicates by BOTH ID and content to prevent any duplicate notifications
const DEDUP_WINDOW_MS = 120000 // 120 seconds — stronger window to catch more duplicates

function getTimeValue(ts: any): number {
  if (!ts) return 0
  try {
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) return ts.seconds * 1000
    if (typeof ts === 'string') return new Date(ts).getTime()
    if (typeof ts === 'number') return ts
  } catch {}
  return 0
}

function deduplicateNotifications(notifications: any[]): any[] {
  const seenById = new Set<string>()
  const seenByContent = new Map<string, any>()
  const result: any[] = []

  for (const n of notifications) {
    // 1. Skip exact ID duplicates (same notification record in DB)
    const nid = n.id || n._id?.toString()
    if (nid && seenById.has(nid)) continue
    if (nid) seenById.add(nid)

    // 2. Skip content duplicates (same title + type within time window)
    const contentKey = `${n.title || ''}||${n.type || ''}`
    const existing = seenByContent.get(contentKey)

    if (existing) {
      const existingTime = getTimeValue(existing.createdAt)
      const currentTime = getTimeValue(n.createdAt)

      if (Math.abs(existingTime - currentTime) < DEDUP_WINDOW_MS) {
        // Duplicate — keep the one that is NOT read (so unread count is correct)
        const existingRead = existing.isRead || existing.read
        const currentRead = n.isRead || n.read
        if (existingRead && !currentRead) {
          // Replace with unread version
          const idx = result.findIndex(r => (r.id || r._id?.toString()) === (existing.id || existing._id?.toString()))
          if (idx !== -1) result[idx] = n
          seenByContent.set(contentKey, n)
        }
        continue
      }
    }

    seenByContent.set(contentKey, n)
    result.push(n)
  }

  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    let notifications
    if (userType) {
      notifications = await getNotificationsByUser(userId, userType)
    } else {
      // If no userType provided, try to get notifications for all user types
      const [beneficiaryNotifs, nurseNotifs, adminNotifs] = await Promise.all([
        getNotificationsByUser(userId, 'beneficiary').catch(() => []),
        getNotificationsByUser(userId, 'nurse').catch(() => []),
        getNotificationsByUser(userId, 'admin').catch(() => []),
      ])
      notifications = [...beneficiaryNotifs, ...nurseNotifs, ...adminNotifs]
      // Sort by createdAt descending
      notifications.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime() || 0
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime() || 0
        return bTime - aTime
      })
    }

    // ─── Deduplicate notifications ───
    notifications = deduplicateNotifications(notifications)

    // Count unread
    const unreadCount = notifications.filter((n: any) => !n.isRead && !n.read).length

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    })
  } catch (error: any) {
    console.error('Get notifications list error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── PATCH: Mark notification(s) as read ───
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId, userType, markAll } = body

    if (markAll && userId && userType) {
      // Mark ALL notifications as read for this user
      await markAllNotificationsAsRead(userId, userType)
      return NextResponse.json({ success: true, action: 'markAllRead' })
    }

    if (notificationId) {
      // Mark a single notification as read
      await markNotificationAsRead(notificationId)
      return NextResponse.json({ success: true, action: 'markRead' })
    }

    return NextResponse.json({ error: 'notificationId أو (userId + userType + markAll) مطلوب' }, { status: 400 })
  } catch (error: any) {
    console.error('Mark notification read error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
