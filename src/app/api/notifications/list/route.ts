import { NextRequest, NextResponse } from 'next/server'
import { getNotificationsByUser, getUnreadNotificationCount } from '@/lib/firestore'

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
