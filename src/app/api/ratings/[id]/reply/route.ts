import { NextRequest, NextResponse } from 'next/server'
import { addNurseReplyToRating } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nurseId, reply } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف التقييم مطلوب' }, { status: 400 })
    }

    if (!nurseId || !reply) {
      return NextResponse.json({ error: 'معرف الممرض والرد مطلوبان' }, { status: 400 })
    }

    if (typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json({ error: 'الرد يجب أن يكون نصاً غير فارغ' }, { status: 400 })
    }

    // Fetch the rating
    await connectToDatabase()
    const Rating = mongoose.models.Rating
    const ratingDoc = await Rating.findById(id).lean()
    if (!ratingDoc) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 })
    }

    // Verify the nurse owns this rating
    if (ratingDoc.nurseId !== nurseId) {
      return NextResponse.json({ error: 'لا يمكنك الرد على تقييم لا يخصك' }, { status: 403 })
    }

    // Check if already replied
    if (ratingDoc.nurseReply) {
      return NextResponse.json({ error: 'تم الرد على هذا التقييم مسبقاً' }, { status: 400 })
    }

    // Add nurse reply
    const updatedRating = await addNurseReplyToRating(id, nurseId, reply.trim())

    return NextResponse.json({
      ...updatedRating,
      message: 'تم إضافة الرد بنجاح',
    })
  } catch (error: any) {
    console.error('Reply to rating error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
