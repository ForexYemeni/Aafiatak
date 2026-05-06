import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages, sendChatMessage, deleteChatMessages } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!requestId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 })
    }

    const messages = await getChatMessages(requestId, limit)
    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('Chat GET error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, senderId, senderName, senderType, message } = body

    // Detailed validation with specific error messages
    const missingFields: string[] = []
    if (!requestId) missingFields.push('معرف الطلب')
    if (!senderId) missingFields.push('معرف المرسل')
    if (!senderName) missingFields.push('اسم المرسل')
    if (!senderType) missingFields.push('نوع المرسل')
    if (!message) missingFields.push('الرسالة')

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `حقول مفقودة: ${missingFields.join('، ')}`
      }, { status: 400 })
    }

    if (!['nurse', 'beneficiary', 'admin'].includes(senderType)) {
      return NextResponse.json({ error: 'نوع المرسل غير صالح' }, { status: 400 })
    }

    // Validate message length
    if (message.length > 10000) {
      return NextResponse.json({ error: 'الرسالة طويلة جداً (الحد الأقصى 10000 حرف)' }, { status: 400 })
    }

    const chatMessage = await sendChatMessage({
      requestId,
      senderId,
      senderName,
      senderType,
      message: message.trim(),
    })

    return NextResponse.json(chatMessage)
  } catch (error: any) {
    console.error('Chat POST error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم أثناء إرسال الرسالة' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 })
    }

    const result = await deleteChatMessages(requestId)
    return NextResponse.json({
      success: true,
      message: `تم حذف ${result.deletedCount} رسالة`,
      deletedCount: result.deletedCount
    })
  } catch (error: any) {
    console.error('Chat DELETE error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم أثناء حذف المحادثة' }, { status: 500 })
  }
}
