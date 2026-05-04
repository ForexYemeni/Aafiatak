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
    const status = searchParams.get('status')

    let snapshot: FirebaseFirestore.QuerySnapshot

    if (status) {
      // Use where for status filter
      snapshot = await firestore.collection('reports')
        .where('status', '==', status)
        .get()
    } else {
      snapshot = await firestore.collection('reports').get()
    }

    let reports = snapshot.docs.map(docToObject)

    // Sort by createdAt descending in code
    reports = sortByCreatedAt(reports)

    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Get reports list error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
