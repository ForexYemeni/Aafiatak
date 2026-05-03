import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages, sendChatMessage } from '@/lib/firestore'

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
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, senderId, senderName, senderType, message } = body

    if (!requestId || !senderId || !senderName || !senderType || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (!['nurse', 'beneficiary', 'admin'].includes(senderType)) {
      return NextResponse.json({ error: 'نوع المرسل غير صالح' }, { status: 400 })
    }

    const chatMessage = await sendChatMessage({
      requestId,
      senderId,
      senderName,
      senderType,
      message: message.trim(),
    })

    return NextResponse.json(chatMessage)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
