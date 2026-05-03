import { NextRequest, NextResponse } from 'next/server'
import { firestore, firebaseInitialized } from '@/lib/firebase-admin'

export async function PUT(request: NextRequest) {
  try {
    if (!firebaseInitialized || !firestore) {
      return NextResponse.json({ error: 'Firebase غير متصل' }, { status: 500 })
    }

    const body = await request.json()
    const { adminId, name } = body

    if (!adminId || !name) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    await firestore.collection('admins').doc(adminId).update({
      name,
      updatedAt: new Date().toISOString(),
    })

    const doc = await firestore.collection('admins').doc(adminId).get()
    const data = doc.data()!

    return NextResponse.json({
      id: doc.id,
      username: data.username,
      name: data.name,
      mustChangePassword: data.mustChangePassword === true,
    })
  } catch (error: any) {
    console.error('Update admin profile error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في تحديث البيانات' }, { status: 500 })
  }
}
