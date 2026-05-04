import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  return { id: doc.id, ...doc.data() }
}

function sortByCreatedAt(docs: any[], order: 'asc' | 'desc' = 'desc') {
  docs.sort((a: any, b: any) => {
    const getTime = (t: any) => {
      if (!t) return 0
      if (typeof t === 'object' && t !== null && 'seconds' in t) return t.seconds * 1000
      return new Date(t).getTime() || 0
    }
    return order === 'desc' ? getTime(b.createdAt) - getTime(a.createdAt) : getTime(a.createdAt) - getTime(b.createdAt)
  })
  return docs
}

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    let snapshot: FirebaseFirestore.QuerySnapshot

    if (userType) {
      // Use both userId and userType for more specific filtering
      snapshot = await firestore.collection('pushNotifications')
        .where('userId', '==', userId)
        .where('userType', '==', userType)
        .get()
    } else {
      snapshot = await firestore.collection('pushNotifications')
        .where('userId', '==', userId)
        .get()
    }

    let notifications = snapshot.docs.map(docToObject)

    // Sort by createdAt descending in code
    notifications = sortByCreatedAt(notifications)

    // Count unread
    const unreadCount = notifications.filter((n: any) => !n.isRead).length

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
