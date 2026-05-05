/**
 * عافيتك — FCM Token Management API
 * Saves, updates, and removes FCM tokens in MongoDB
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFcmToken, deactivateFcmToken, getFcmTokensByUser } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

// ─── POST: Save or update FCM token ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userType, token } = body

    if (!userId || !userType || !token) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const validUserTypes = ['beneficiary', 'nurse', 'admin']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
    }

    // Save or update the FCM token (upsert via firestore helper)
    await saveFcmToken({ userId, userType, token })

    // Deactivate old tokens for this user if they have more than 5
    await connectToDatabase()
    const FcmToken = mongoose.models.FcmToken
    const existingTokens = await FcmToken.find({ userId, userType, isActive: true })
      .sort({ createdAt: 1 })
      .lean()

    if (existingTokens.length > 5) {
      const tokensToDeactivate = existingTokens.slice(0, existingTokens.length - 5)
      for (const t of tokensToDeactivate) {
        await FcmToken.findByIdAndUpdate(t._id, { isActive: false, updatedAt: new Date() })
      }
    }

    return NextResponse.json({ message: 'تم حفظ الرمز بنجاح', updated: true })
  } catch (error: any) {
    console.error('FCM token save error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── DELETE: Remove FCM tokens for a user ───
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userType, token } = body

    if (!userId || !userType) {
      return NextResponse.json({ error: 'معرف المستخدم ونوعه مطلوبان' }, { status: 400 })
    }

    await connectToDatabase()
    const FcmToken = mongoose.models.FcmToken

    const filter: Record<string, any> = { userId, userType }
    if (token) {
      filter.token = token
    }

    const result = await FcmToken.deleteMany(filter)

    return NextResponse.json({ message: `تم حذف ${result.deletedCount} رمز`, deleted: result.deletedCount })
  } catch (error: any) {
    console.error('FCM token delete error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ─── GET: Check token status ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!userId || !userType) {
      return NextResponse.json({ error: 'معرف المستخدم ونوعه مطلوبان' }, { status: 400 })
    }

    const tokens = await getFcmTokensByUser(userId, userType)

    return NextResponse.json({
      hasToken: tokens.length > 0,
      tokenCount: tokens.length,
    })
  } catch (error: any) {
    console.error('FCM token check error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
