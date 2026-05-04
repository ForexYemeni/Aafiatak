import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

export async function POST(request: NextRequest) {
  try {
    checkFirebase()
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
        if (typeof value !== 'number' || value < 1 || value > 5) {
          return NextResponse.json({ error: `قيمة المعيار ${key} يجب أن تكون رقماً بين 1 و 5` }, { status: 400 })
        }
      }
    }

    // Verify the service request exists
    const requestDoc = await firestore.collection('serviceRequests').doc(requestId).get()
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    // Check if already rated for this request
    const existingRating = await firestore.collection('ratings')
      .where('requestId', '==', requestId)
      .where('beneficiaryId', '==', beneficiaryId)
      .limit(1)
      .get()

    if (!existingRating.empty) {
      return NextResponse.json({ error: 'تم تقييم هذا الطلب مسبقاً' }, { status: 400 })
    }

    // ── Look up nurse name, beneficiary name, and service name from DB ──
    let resolvedNurseName = nurseName || ''
    let resolvedBeneficiaryName = beneficiaryName || ''
    let resolvedServiceName = serviceName || ''

    // Fetch nurse name
    if (!resolvedNurseName) {
      try {
        const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
        if (nurseDoc.exists) {
          const nd = nurseDoc.data()!
          resolvedNurseName = `${nd.firstName || ''} ${nd.secondName || ''} ${nd.thirdName || ''} ${nd.lastName || ''}`.replace(/\s+/g, ' ').trim()
        }
      } catch {}
    }

    // Fetch beneficiary name
    if (!resolvedBeneficiaryName) {
      try {
        const benefDoc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
        if (benefDoc.exists) {
          resolvedBeneficiaryName = benefDoc.data()!.name || ''
        }
      } catch {}
    }

    // Fetch service name from the request
    if (!resolvedServiceName) {
      try {
        const reqData = requestDoc.data()!
        if (reqData.serviceId) {
          const serviceDoc = await firestore.collection('services').doc(reqData.serviceId).get()
          if (serviceDoc.exists) {
            resolvedServiceName = serviceDoc.data()!.name || ''
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Calculate average from criteria if available
    if (criteria) {
      const criteriaValues = Object.values(criteria) as number[]
      const criteriaAvg = criteriaValues.reduce((sum: number, val: number) => sum + val, 0) / criteriaValues.length
      ratingData.criteriaAverage = Math.round(criteriaAvg * 10) / 10
    }

    const docRef = await firestore.collection('ratings').add(ratingData)

    // Update nurse's average rating
    const nurseRatingsSnapshot = await firestore.collection('ratings')
      .where('nurseId', '==', nurseId)
      .get()

    if (!nurseRatingsSnapshot.empty) {
      const allRatings = nurseRatingsSnapshot.docs.map(d => d.data().overallRating || d.data().rating || 0)
      const avgRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      const totalRatings = allRatings.length

      await firestore.collection('nurses').doc(nurseId).update({
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({
      id: docRef.id,
      ...ratingData,
      message: 'تم إنشاء التقييم بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create enhanced rating error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
