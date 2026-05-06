/**
 * عافيتك — Notification Cleanup API
 * Removes duplicate notifications from MongoDB that were created when
 * both client-side and server-side notification code were active.
 *
 * This is a ONE-TIME cleanup endpoint. It finds notifications with the
 * same (userId, userType, title, type) within a 10-second window and
 * keeps only the first one.
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const PushNotification = mongoose.models.PushNotification
    if (!PushNotification) {
      return NextResponse.json({ error: 'PushNotification model not found' }, { status: 500 })
    }

    // Find all notifications grouped by (userId, userType, title, type)
    // where there are duplicates within a 10-second window
    const duplicates = await PushNotification.aggregate([
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            userType: '$userType',
            title: '$title',
            type: '$type',
          },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
    ])

    let totalDeleted = 0

    for (const group of duplicates) {
      const docs = group.docs
      // Sort by createdAt ascending (keep the first one)
      docs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      // Check if docs are within 10 seconds of each other
      for (let i = 1; i < docs.length; i++) {
        const prevTime = new Date(docs[i - 1].createdAt).getTime()
        const currTime = new Date(docs[i].createdAt).getTime()

        if (currTime - prevTime < 10000) {
          // This is a duplicate — delete it
          try {
            await PushNotification.findByIdAndDelete(docs[i]._id)
            totalDeleted++
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      duplicateGroupsFound: duplicates.length,
      duplicatesRemoved: totalDeleted,
      message: totalDeleted > 0
        ? `تم حذف ${totalDeleted} إشعار مكرر`
        : 'لا توجد إشعارات مكررة',
    })
  } catch (error: any) {
    console.error('Cleanup notifications error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
