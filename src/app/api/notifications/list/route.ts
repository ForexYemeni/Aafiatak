import { NextRequest, NextResponse } from 'next/server'
import { getNotificationsByUser, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firestore'

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
