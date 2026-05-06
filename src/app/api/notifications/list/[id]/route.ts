/**
 * عافيتك — Update Notification (mark as read, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/firestore'

// ─── PATCH: Update notification (mark as read) ───
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
    }

    await markNotificationAsRead(notificationId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
