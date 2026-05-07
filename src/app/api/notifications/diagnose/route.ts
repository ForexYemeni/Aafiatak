/**
 * عافيتك — Notification System Diagnostic API
 * Helps debug why push notifications might not be working
 *
 * GET /api/notifications/diagnose?userId=xxx&userType=xxx
 *
 * Checks:
 * 1. MongoDB connection
 * 2. Firebase Admin SDK initialization
 * 3. FCM tokens for the user
 * 4. Recent notifications for the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConnected, getDatabaseError, connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'
import { firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const userType = searchParams.get('userType')

  const diagnosis: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // ─── Check 1: MongoDB Connection ───
  try {
    if (!isDatabaseConnected()) {
      await connectToDatabase()
    }
    diagnosis.checks.mongodb = {
      status: isDatabaseConnected() ? 'OK' : 'FAILED',
      error: getDatabaseError(),
    }
  } catch (error: any) {
    diagnosis.checks.mongodb = {
      status: 'FAILED',
      error: error.message,
    }
  }

  // ─── Check 2: Firebase Admin SDK ───
  diagnosis.checks.firebaseAdmin = {
    status: firebaseInitialized ? 'OK' : 'FAILED',
    error: initializationError,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyStartsWithBegin: process.env.FIREBASE_PRIVATE_KEY?.includes('-----BEGIN') || false,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  }

  // ─── Check 3: FCM Tokens ───
  if (userId && userType) {
    try {
      await connectToDatabase()
      const FcmToken = mongoose.models.FcmToken
      if (FcmToken) {
        const tokens = await FcmToken.find({ userId, userType, isActive: true }).lean()
        diagnosis.checks.fcmTokens = {
          status: 'OK',
          count: tokens.length,
          tokens: tokens.map((t: any) => ({
            id: t._id?.toString(),
            tokenPrefix: t.token?.substring(0, 20) + '...',
            isActive: t.isActive,
            createdAt: t.createdAt,
          })),
        }
      } else {
        diagnosis.checks.fcmTokens = {
          status: 'NO_MODEL',
          error: 'FcmToken model not found',
        }
      }
    } catch (error: any) {
      diagnosis.checks.fcmTokens = {
        status: 'FAILED',
        error: error.message,
      }
    }

    // ─── Check 4: Recent Notifications ───
    try {
      const PushNotification = mongoose.models.PushNotification
      if (PushNotification) {
        const recentNotifs = await PushNotification.find({ userId, userType })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()

        diagnosis.checks.recentNotifications = {
          status: 'OK',
          count: recentNotifs.length,
          notifications: recentNotifs.map((n: any) => ({
            id: n._id?.toString(),
            title: n.title,
            type: n.type,
            isRead: n.isRead,
            hasVoiceText: !!n.voiceText,
            voiceText: n.voiceText?.substring(0, 50) + (n.voiceText?.length > 50 ? '...' : ''),
            voicePriority: n.voicePriority,
            createdAt: n.createdAt,
          })),
        }
      }
    } catch (error: any) {
      diagnosis.checks.recentNotifications = {
        status: 'FAILED',
        error: error.message,
      }
    }
  }

  // ─── Overall Status ───
  const allOk = diagnosis.checks.mongodb?.status === 'OK' && diagnosis.checks.firebaseAdmin?.status === 'OK'
  diagnosis.overallStatus = allOk ? 'HEALTHY' : 'ISSUES_DETECTED'
  diagnosis.recommendation = getRecommendation(diagnosis.checks)

  return NextResponse.json(diagnosis)
}

function getRecommendation(checks: Record<string, any>): string {
  const recommendations: string[] = []

  if (checks.mongodb?.status !== 'OK') {
    recommendations.push('MongoDB غير متصل. تحقق من MONGODB_URI في إعدادات Vercel.')
  }

  if (checks.firebaseAdmin?.status !== 'OK') {
    if (!checks.firebaseAdmin?.hasProjectId) {
      recommendations.push('FIREBASE_PROJECT_ID غير محدد في متغيرات البيئة.')
    }
    if (!checks.firebaseAdmin?.hasClientEmail) {
      recommendations.push('FIREBASE_CLIENT_EMAIL غير محدد في متغيرات البيئة.')
    }
    if (!checks.firebaseAdmin?.hasPrivateKey) {
      recommendations.push('FIREBASE_PRIVATE_KEY غير محدد في متغيرات البيئة. احصل عليه من Firebase Console > Project Settings > Service Accounts.')
    } else if (!checks.firebaseAdmin?.privateKeyStartsWithBegin) {
      recommendations.push('FIREBASE_PRIVATE_KEY لا يبدأ بـ -----BEGIN PRIVATE KEY-----. تأكد من نسخ المفتاح بالكامل من Firebase Console.')
    } else {
      recommendations.push('Firebase Admin فشل في التهيئة. تحقق من صحة بيانات الاعتماد.')
    }
  }

  if (checks.fcmTokens?.count === 0) {
    recommendations.push('لا توجد رموز FCM لهذا المستخدم. يجب منح إذن الإشعارات في المتصفح وتسجيل الرمز.')
  }

  if (recommendations.length === 0) {
    return 'جميع الأنظمة تعمل بشكل طبيعي. إذا كانت الإشعارات لا تصل، تحقق من: 1) إذن الإشعارات في المتصفح 2) تسجيل رمز FCM 3) اتصال الإنترنت'
  }

  return recommendations.join(' | ')
}
