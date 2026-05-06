import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointmentsByBeneficiary,
  getAppointmentsByNurse,
  createAppointment,
  getBeneficiaryById,
  getServiceById,
  getNurseById,
} from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beneficiaryId = searchParams.get('beneficiaryId')
    const nurseId = searchParams.get('nurseId')

    if (!beneficiaryId && !nurseId) {
      return NextResponse.json({ error: 'معرف المستفيد أو الممرض مطلوب' }, { status: 400 })
    }

    let appointments
    if (beneficiaryId) {
      appointments = await getAppointmentsByBeneficiary(beneficiaryId)
    } else {
      appointments = await getAppointmentsByNurse(nurseId!)
    }

    // Enrich with service and nurse/beneficiary info
    const enriched: any[] = []
    for (const apt of appointments) {
      const enrichedApt: Record<string, any> = { ...apt }

      if (apt.serviceId) {
        const service = await getServiceById(apt.serviceId)
        enrichedApt.service = service
          ? { id: service.id, name: service.name, price: service.price }
          : null
      }

      if (apt.nurseId) {
        const nurse = await getNurseById(apt.nurseId)
        enrichedApt.nurse = nurse
          ? { id: nurse.id, firstName: nurse.firstName, lastName: nurse.lastName }
          : null
      }

      if (apt.beneficiaryId) {
        const benef = await getBeneficiaryById(apt.beneficiaryId)
        enrichedApt.beneficiary = benef
          ? { id: benef.id, name: benef.name }
          : null
      }

      enriched.push(enrichedApt)
    }

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error('Get appointments error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, serviceId, nurseId, date, time, notes } = body

    if (!beneficiaryId || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'معرف المستفيد والخدمة والتاريخ والوقت مطلوبون' }, { status: 400 })
    }

    // Verify beneficiary exists
    const benef = await getBeneficiaryById(beneficiaryId)
    if (!benef) {
      return NextResponse.json({ error: 'المستفيد غير موجود' }, { status: 404 })
    }

    // Verify service exists
    const service = await getServiceById(serviceId)
    if (!service) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 })
    }

    // Verify nurse if provided
    if (nurseId) {
      const nurse = await getNurseById(nurseId)
      if (!nurse) {
        return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
      }
    }

    const appointment = await createAppointment({
      beneficiaryId,
      serviceId,
      nurseId: nurseId || undefined,
      date,
      time,
      notes: notes || undefined,
    })

    // Build response
    const serviceInfo = service
      ? { id: service.id, name: service.name, price: service.price }
      : null

    return NextResponse.json({
      id: appointment.id,
      beneficiaryId,
      serviceId,
      date,
      time,
      notes: notes || null,
      nurseId: nurseId || null,
      status: 'scheduled',
      service: serviceInfo,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create appointment error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
