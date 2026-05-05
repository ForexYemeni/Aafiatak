import { NextResponse } from 'next/server'
import { isDatabaseConnected, getDatabaseError } from '@/lib/mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
  // Check if MongoDB is connected
  if (!isDatabaseConnected()) {
    const error = getDatabaseError()
    // Try to connect once
    try {
      await connectToDatabase()
    } catch {
      return NextResponse.json({
        connected: false,
        error: error || 'قاعدة البيانات غير متصلة. يرجى التحقق من إعدادات MONGODB_URI',
      })
    }
  }

  // Verify the database actually works by reading a document
  try {
    const { mongoose } = await import('@/lib/mongodb')
    const Admin = mongoose.models.Admin
    if (Admin) {
      await Admin.findOne().select('_id').lean()
    }
    return NextResponse.json({ connected: true, error: null })
  } catch (error: any) {
    const msg = error.message || ''
    return NextResponse.json({
      connected: false,
      error: `خطأ في الاتصال بقاعدة البيانات: ${msg.substring(0, 100)}`,
    })
  }
}
