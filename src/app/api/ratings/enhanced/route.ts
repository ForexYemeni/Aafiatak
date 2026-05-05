import { NextRequest, NextResponse } from 'next/server'
import { createEnhancedRating, getNurseById, getServiceById, getBeneficiaryById } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestId,
      nurseId,
      beneficiaryId,
      beneficiaryName,
      nurseName,
      serviceName,
      criteria,
      overallRating,
      comment,
      beforePhotos,
      afterPhotos,
    } = body

    if (!requestId || !nurseId || !beneficiaryId || !overallRating) {
      return NextResponse.json({ error: 'معرف الطلب والممرض والمستفيد والتقييم العام مطلوبون' }, { status: 400 })
    }

    if (typeof overallRating !== 'number' || overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: 'التقييم العام يجب أن يكون رقماً بين 1 و 5' }, { status: 400 })
    }

    // Validate criteria if provided
    if (criteria) {
      const validKeys = ['punctuality', 'professionalism', 'cleanliness', 'communication']
      for (const [key, value] of Object.entries(criteria)) {
        if (!validKeys.includes(key)) {
          return NextResponse.json({ error: `معيار غير صالح: ${key}` }, { status: 400 })
        }
        if (typeof value !== 'number' || (value as number) < 1 || (value as number) > 5) {
          return NextResponse.json({ error: `قيمة المعيار ${key} يجب أن تكون رقماً بين 1 و 5` }, { status: 400 })
        }
      }
    }

    // Verify the service request exists
    await connectToDatabase()
    const ServiceRequest = mongoose.models.ServiceRequest
    const requestDoc = await ServiceRequest.findById(requestId).lean()
    if (!requestDoc) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Check if already rated for this request
    const Rating = mongoose.models.Rating
    const existingRating = await Rating.findOne({ requestId, beneficiaryId }).lean()
    if (existingRating) {
      return NextResponse.json({ error: 'تم تقييم هذا الطلب مسبقاً' }, { status: 400 })
    }

    // ── Look up nurse name, beneficiary name, and service name from DB ──
    let resolvedNurseName = nurseName || ''
    let resolvedBeneficiaryName = beneficiaryName || ''
    let resolvedServiceName = serviceName || ''

    // Fetch nurse name
    if (!resolvedNurseName) {
      try {
        const nurse = await getNurseById(nurseId)
        if (nurse) {
          resolvedNurseName = `${nurse.firstName || ''} ${nurse.secondName || ''} ${nurse.thirdName || ''} ${nurse.lastName || ''}`.replace(/\s+/g, ' ').trim()
        }
      } catch {}
    }

    // Fetch beneficiary name
    if (!resolvedBeneficiaryName) {
      try {
        const benef = await getBeneficiaryById(beneficiaryId)
        if (benef) {
          resolvedBeneficiaryName = benef.name || ''
        }
      } catch {}
    }

    // Fetch service name from the request
    if (!resolvedServiceName) {
      try {
        const requestData = requestDoc
        if (requestData.serviceId) {
          const service = await getServiceById(requestData.serviceId)
          if (service) {
            resolvedServiceName = service.name || ''
          }
        }
      } catch {}
    }

    // Build the enhanced rating document
    const ratingData: Record<string, any> = {
      requestId,
      nurseId,
      beneficiaryId,
      beneficiaryName: resolvedBeneficiaryName,
      nurseName: resolvedNurseName,
      serviceName: resolvedServiceName,
      rating: overallRating,
      overallRating,
      criteria: criteria || null,
      comment: comment || null,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
      nurseReply: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Calculate average from criteria if available
    if (criteria) {
      const criteriaValues = Object.values(criteria) as number[]
      const criteriaAvg = criteriaValues.reduce((sum: number, val: number) => sum + val, 0) / criteriaValues.length
      ratingData.criteriaAverage = Math.round(criteriaAvg * 10) / 10
    }

    // Create the rating
    const newRating = await createEnhancedRating({
      requestId,
      nurseId,
      beneficiaryId,
      beneficiaryName: resolvedBeneficiaryName,
      nurseName: resolvedNurseName,
      serviceName: resolvedServiceName,
      criteria: criteria || { punctuality: 0, professionalism: 0, cleanliness: 0, communication: 0 },
      overallRating,
      comment: comment || undefined,
      beforePhotos: beforePhotos || undefined,
      afterPhotos: afterPhotos || undefined,
    })

    // Update nurse's average rating
    const nurseRatings = await Rating.find({ nurseId }).lean()
    if (nurseRatings.length > 0) {
      const allRatings = nurseRatings.map((d: any) => d.overallRating || d.rating || 0)
      const avgRating = allRatings.reduce((sum: number, r: number) => sum + r, 0) / allRatings.length
      const totalRatings = allRatings.length

      const Nurse = mongoose.models.Nurse
      await Nurse.findByIdAndUpdate(nurseId, {
        rating: Math.round(avgRating * 10) / 10,
        totalRatings,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      id: newRating.id,
      ...ratingData,
      message: 'تم إنشاء التقييم بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create enhanced rating error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
