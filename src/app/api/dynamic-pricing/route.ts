import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  return { id: doc.id, ...doc.data() }
}

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const timeParam = searchParams.get('time') // hour (0-23)
    const distanceKmParam = searchParams.get('distanceKm')

    if (!serviceId) {
      return NextResponse.json({ error: 'معرف الخدمة مطلوب' }, { status: 400 })
    }

    // Fetch service base price
    const serviceDoc = await firestore.collection('services').doc(serviceId).get()
    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 })
    }

    const serviceData = serviceDoc.data()!
    const basePrice = serviceData.price || 0

    // Calculate time multiplier
    let timeMultiplier = 1.0
    if (timeParam) {
      const hour = parseInt(timeParam, 10)
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'قيمة الوقت يجب أن تكون ساعة صالحة (0-23)' }, { status: 400 })
      }

      // Night hours (22:00 - 06:00) have higher multiplier
      if (hour >= 22 || hour < 6) {
        timeMultiplier = 1.5
      }
      // Early morning peak (06:00 - 09:00)
      else if (hour >= 6 && hour < 9) {
        timeMultiplier = 1.2
      }
      // Evening peak (17:00 - 20:00)
      else if (hour >= 17 && hour < 20) {
        timeMultiplier = 1.15
      }
      // Regular hours
      else {
        timeMultiplier = 1.0
      }
    }

    // Calculate distance surcharge
    let distanceSurcharge = 0
    let distanceKm = 0
    if (distanceKmParam) {
      distanceKm = parseFloat(distanceKmParam)
      if (isNaN(distanceKm) || distanceKm < 0) {
        return NextResponse.json({ error: 'المسافة يجب أن تكون رقماً غير سالب' }, { status: 400 })
      }

      // First 5 km: no surcharge
      // 5-15 km: 2 SAR per km
      // 15-30 km: 3 SAR per km
      // 30+ km: 5 SAR per km
      if (distanceKm <= 5) {
        distanceSurcharge = 0
      } else if (distanceKm <= 15) {
        distanceSurcharge = (distanceKm - 5) * 2
      } else if (distanceKm <= 30) {
        distanceSurcharge = 10 * 2 + (distanceKm - 15) * 3
      } else {
        distanceSurcharge = 10 * 2 + 15 * 3 + (distanceKm - 30) * 5
      }
    }

    // Calculate final price
    const timeAdjustedPrice = basePrice * timeMultiplier
    const finalPrice = Math.round((timeAdjustedPrice + distanceSurcharge) * 100) / 100

    return NextResponse.json({
      serviceId,
      serviceName: serviceData.name,
      basePrice,
      pricing: {
        timeMultiplier,
        timeAdjustedPrice: Math.round(timeAdjustedPrice * 100) / 100,
        distanceKm,
        distanceSurcharge: Math.round(distanceSurcharge * 100) / 100,
      },
      finalPrice,
      currency: 'SAR',
    })
  } catch (error: any) {
    console.error('Dynamic pricing error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
