/**
 * عافيتك — Notification Test API
 * Allows testing notification delivery without triggering real app events
 * POST /api/notifications/test
 *
 * Body: { userId, userType, title?, message?, type? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { pushNotification } from '@/lib/server-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userType, title, message, type } = body

    if (!userId || !userType) {
      return NextResponse.json({ error: 'userId و userType مطلوبان' }, { status: 400 })
    }

    const validUserTypes = ['beneficiary', 'nurse', 'admin']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
    }

    const notifTitle = title || '🔔 اختبار الإشعارات'
    const notifMessage = message || 'هذا إشعار تجريبي من نظام عافيتك. إذا ترى هذا الإشعار فالنظام يعمل بشكل صحيح!'
    const notifType = type || 'system'

    await pushNotification({
      userId,
      userType: userType as 'beneficiary' | 'nurse' | 'admin',
      title: notifTitle,
      message: notifMessage,
      type: notifType as any,
      data: { url: '/', test: 'true' },
    })

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الإشعار التجريبي بنجاح',
      notification: { title: notifTitle, message: notifMessage, type: notifType },
    })
  } catch (error: any) {
    console.error('Test notification error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ: ' + error.message }, { status: 500 })
  }
}
