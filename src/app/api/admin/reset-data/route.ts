import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin } from '@/lib/firebase-admin'
import bcrypt from 'bcryptjs'

// Helper to delete all documents in a collection in batches
async function deleteCollection(collectionName: string) {
  if (!firestore) return 0
  const snapshot = await firestore.collection(collectionName).get()
  if (snapshot.empty) return 0

  let deletedCount = 0
  const batchSize = 500

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = firestore.batch()
    const chunk = snapshot.docs.slice(i, i + batchSize)
    for (const doc of chunk) {
      batch.delete(doc.ref)
    }
    await batch.commit()
    deletedCount += chunk.length
  }

  return deletedCount
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, password } = body

    if (!adminId || !password) {
      return NextResponse.json({ error: 'معرف المدير وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // Verify admin exists and password is correct
    if (!firestore) {
      return NextResponse.json({ error: 'قاعدة البيانات غير متصلة' }, { status: 500 })
    }

    const adminDoc = await firestore.collection('admins').doc(adminId).get()
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 404 })
    }

    const adminData = adminDoc.data()!
    const isValidPassword = await bcrypt.compare(password, adminData.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Collections to delete (all except 'admins')
    const collectionsToDelete = [
      'nurses',
      'beneficiaries',
      'serviceRequests',
      'serviceAssignments',
      'services',
      'paymentMethods',
      'coupons',
      'ratings',
      'activityLog',
      'emergencyRequests',
      'emergencyAssignments',
      'subAdmins',
      'chats',
      'loyaltyPoints',
      'referrals',
      'reports',
    ]

    const results: Record<string, number> = {}
    let totalDeleted = 0

    for (const collectionName of collectionsToDelete) {
      try {
        const count = await deleteCollection(collectionName)
        results[collectionName] = count
        totalDeleted += count
      } catch (err: any) {
        results[collectionName] = -1 // Error marker
        console.error(`Error deleting collection ${collectionName}:`, err.message)
      }
    }

    // Reset app settings
    try {
      await firestore.collection('appSettings').doc('admin').set({
        emergencyPhone: '',
        referralBonusPoints: 50,
        referralBonusPointsReceiver: 25,
        referralEnabled: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (err: any) {
      console.error('Error resetting settings:', err.message)
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف جميع البيانات بنجاح. إجمالي المستندات المحذوفة: ${totalDeleted}`,
      details: results,
      totalDeleted,
    })
  } catch (error: any) {
    console.error('Reset data error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في حذف البيانات' }, { status: 500 })
  }
}
