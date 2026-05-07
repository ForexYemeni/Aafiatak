import { NextResponse } from 'next/server'
import { isDatabaseConnected, getDatabaseError, connectToDatabase } from '@/lib/mongodb'
import { firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  // Check MongoDB
  let mongoConnected = isDatabaseConnected()
  let mongoError = getDatabaseError()

  if (!mongoConnected) {
    try {
      await connectToDatabase()
      mongoConnected = isDatabaseConnected()
    } catch {}
  }

  // Verify the database actually works
  let dbVerified = false
  let dbError = ''
  try {
    const { mongoose } = await import('@/lib/mongodb')
    const Admin = mongoose.models.Admin
    if (Admin) {
      await Admin.findOne().select('_id').lean()
      dbVerified = true
    }
  } catch (error: any) {
    dbError = error.message || ''
  }

  return NextResponse.json({
    connected: mongoConnected && dbVerified,
    error: mongoConnected && dbVerified ? null : (dbError || mongoError || 'قاعدة البيانات غير متصلة'),
    firebaseAdmin: {
      initialized: firebaseInitialized,
      error: initializationError,
    },
  })
}
