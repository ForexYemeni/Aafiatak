import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const serviceIds = searchParams.get('serviceIds') // comma-separated for multiple services
    const singleServiceId = searchParams.get('serviceId') // single service (backward compat)
    const timeParam = searchParams.get('time') // hour (0-23)
    const distanceKmParam = searchParams.get('distanceKm')
    const dayOfWeekParam = searchParams.get('dayOfWeek') // 0=Sunday, 5=Friday

    // Support both single and multiple service IDs
    const ids = serviceIds
      ? serviceIds.split(',').filter(Boolean)
      : singleServiceId
        ? [singleServiceId]
        : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'معرف الخدمة مطلوب' }, { status: 400 })
    }

    // Parse time and day
    let hour = new Date().getHours()
    let dayOfWeek = new Date().getDay() // 0=Sun, 5=Fri in JS

    if (timeParam) {
      const parsed = parseInt(timeParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) hour = parsed
    }
    if (dayOfWeekParam) {
      const parsed = parseInt(dayOfWeekParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) dayOfWeek = parsed
    }

    // Parse distance
    let distanceKm = 0
    if (distanceKmParam) {
      const parsed = parseFloat(distanceKmParam)
      if (!isNaN(parsed) && parsed >= 0) distanceKm = parsed
    }

    // Calculate time multiplier
    let timeMultiplier = 1.0
    let timeLabel = 'سعر عادي'

    // Night hours (22:00 - 06:00)
    if (hour >= 22 || hour < 6) {
      timeMultiplier = 1.5
      timeLabel = 'رسوم ليلية (50%)'
    }
    // Early morning peak (06:00 - 09:00)
    else if (hour >= 6 && hour < 9) {
      timeMultiplier = 1.2
      timeLabel = 'رسوم ذروة صباحية (20%)'
    }
    // Evening peak (17:00 - 20:00)
    else if (hour >= 17 && hour < 20) {
      timeMultiplier = 1.15
      timeLabel = 'رسوم ذروة مسائية (15%)'
    }

    // Friday surcharge
    let fridayMultiplier = 1.0
    let fridayLabel = ''
    if (dayOfWeek === 5) { // Friday in JS
      fridayMultiplier = 1.25
      fridayLabel = 'رسوم يوم الجمعة (25%)'
    }

    // Calculate distance surcharge (Yemen Rial per km)
    let distanceSurcharge = 0
    let distanceLabel = ''
    if (distanceKm > 5) {
      if (distanceKm <= 15) {
        distanceSurcharge = (distanceKm - 5) * 100 // 100 YER/km
      } else if (distanceKm <= 30) {
        distanceSurcharge = 10 * 100 + (distanceKm - 15) * 150 // 150 YER/km
      } else {
        distanceSurcharge = 10 * 100 + 15 * 150 + (distanceKm - 30) * 200 // 200 YER/km
      }
      distanceLabel = `رسوم مسافة (${distanceKm.toFixed(1)} كم)`
    }

    // Fetch all services and calculate prices
    const services: Array<{
      serviceId: string
      serviceName: string
      basePrice: number
      timeAdjustedPrice: number
      fridayAdjustedPrice: number
    }> = []

    let totalBasePrice = 0
    let totalFinalPrice = 0

    for (const sid of ids) {
      const serviceDoc = await firestore.collection('services').doc(sid).get()
      if (!serviceDoc.exists) continue

      const serviceData = serviceDoc.data()!
      if (!serviceData.isActive) continue

      const basePrice = serviceData.price || 0
      const timeAdjustedPrice = Math.round(basePrice * timeMultiplier)
      const fridayAdjustedPrice = fridayMultiplier > 1
        ? Math.round(timeAdjustedPrice * fridayMultiplier)
        : timeAdjustedPrice

      services.push({
        serviceId: sid,
        serviceName: serviceData.name,
        basePrice,
        timeAdjustedPrice,
        fridayAdjustedPrice,
      })

      totalBasePrice += basePrice
      totalFinalPrice += fridayAdjustedPrice
    }

    const totalDistanceSurcharge = Math.round(distanceSurcharge)
    const grandTotal = totalFinalPrice + totalDistanceSurcharge

    // Calculate commission (admin fee) - 15% default
    const commissionPercent = 15
    const commissionAmount = Math.round(grandTotal * commissionPercent / 100)
    const nursePayout = grandTotal - commissionAmount

    return NextResponse.json({
      services,
      pricing: {
        basePrice: totalBasePrice,
        timeMultiplier,
        timeLabel,
        timeFee: totalFinalPrice - totalBasePrice,
        fridayMultiplier,
        fridayLabel,
        fridayFee: fridayMultiplier > 1 ? Math.round(totalFinalPrice / fridayMultiplier * (fridayMultiplier - 1)) : 0,
        distanceKm,
        distanceSurcharge: totalDistanceSurcharge,
        distanceLabel,
      },
      totalPrice: grandTotal,
      commission: {
        percent: commissionPercent,
        amount: commissionAmount,
        nursePayout,
      },
      currency: 'YER',
      currencyLabel: 'ر.ي',
    })
  } catch (error: any) {
    console.error('Dynamic pricing error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
