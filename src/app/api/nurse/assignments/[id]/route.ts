import { NextRequest, NextResponse } from 'next/server'
import { getAssignmentById, updateAssignment, updateServiceRequest } from '@/lib/firestore'
import { notifyBeneficiaryServer, notifyAdminServer } from '@/lib/server-notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    if (!['in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await getAssignmentById(id)
    if (!existing) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, any> = { status }
    if (notes !== undefined) updateData.notes = notes

    const assignment = await updateAssignment(id, updateData)

    if (status === 'completed') {
      await updateServiceRequest(existing.requestId, { status: 'completed' })

      // ─── Server-side notification: Notify beneficiary that service is completed ───
      const beneficiaryId = existing.request?.beneficiary?.id || existing.beneficiaryId
      if (beneficiaryId) {
        notifyBeneficiaryServer.orderCompleted(beneficiaryId, existing.requestId || id).catch((err: any) =>
          console.error('Failed to send completion notification:', err.message)
        )
      }
    }

    if (status === 'in_progress') {
      // ─── Server-side notification: Notify beneficiary that nurse is en route ───
      const beneficiaryId = existing.request?.beneficiary?.id || existing.beneficiaryId
      const nurseName = existing.nurse?.firstName
        ? `${existing.nurse.firstName} ${existing.nurse.lastName || ''}`
        : 'الممرض/ة'
      if (beneficiaryId) {
        notifyBeneficiaryServer.nurseEnRoute(beneficiaryId, nurseName, 'قريباً').catch((err: any) =>
          console.error('Failed to send en-route notification:', err.message)
        )
      }
    }

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
