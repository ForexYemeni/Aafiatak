import { NextRequest, NextResponse } from 'next/server'
import { getServiceById, getAdminSettings } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceIds = searchParams.get('serviceIds') // comma-separated for multiple services
    const singleServiceId = searchParams.get('serviceId') // single service (backward compat)
    const timeParam = searchParams.get('time') // hour (0-23)
    const distanceKmParam = searchParams.get('distanceKm')
    const dayOfWeekParam = searchParams.get('dayOfWeek') // 0=Sunday, 5=Friday

    // Fetch admin pricing settings
    let pricingSettings: Record<string, any> = {
      nightSurchargePercent: 50,
      fridaySurchargePercent: 25,
      distanceFeesEnabled: true,
      distanceFeePerKm5to15: 100,
      distanceFeePerKm15to30: 150,
      distanceFeePerKmOver30: 200,
      distanceFreeKm: 5,
      commissionPercent: 15,
    }
    try {
      const settings = await getAdminSettings()
      if (settings) {
        if (settings.nightSurchargePercent !== undefined) pricingSettings.nightSurchargePercent = settings.nightSurchargePercent
        if (settings.fridaySurchargePercent !== undefined) pricingSettings.fridaySurchargePercent = settings.fridaySurchargePercent
        if (settings.distanceFeesEnabled !== undefined) pricingSettings.distanceFeesEnabled = settings.distanceFeesEnabled
        if (settings.distanceFeePerKm5to15 !== undefined) pricingSettings.distanceFeePerKm5to15 = settings.distanceFeePerKm5to15
        if (settings.distanceFeePerKm15to30 !== undefined) pricingSettings.distanceFeePerKm15to30 = settings.distanceFeePerKm15to30
        if (settings.distanceFeePerKmOver30 !== undefined) pricingSettings.distanceFeePerKmOver30 = settings.distanceFeePerKmOver30
        if (settings.distanceFreeKm !== undefined) pricingSettings.distanceFreeKm = settings.distanceFreeKm
        if (settings.commissionPercent !== undefined) pricingSettings.commissionPercent = settings.commissionPercent
      }
    } catch {}

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

    // Calculate time multiplier using admin settings
    let timeMultiplier = 1.0
    let timeLabel = 'سعر عادي'

    // Night hours (22:00 - 06:00)
    if (hour >= 22 || hour < 6) {
      timeMultiplier = 1 + pricingSettings.nightSurchargePercent / 100
      timeLabel = `رسوم ليلية (${pricingSettings.nightSurchargePercent}%)`
    }

    // Friday surcharge using admin settings
    let fridayMultiplier = 1.0
    let fridayLabel = ''
    if (dayOfWeek === 5) { // Friday in JS
      fridayMultiplier = 1 + pricingSettings.fridaySurchargePercent / 100
      fridayLabel = `رسوم يوم الجمعة (${pricingSettings.fridaySurchargePercent}%)`
    }

    // Calculate distance surcharge using admin settings
    let distanceSurcharge = 0
    let distanceLabel = ''
    if (pricingSettings.distanceFeesEnabled && distanceKm > pricingSettings.distanceFreeKm) {
      const billableKm = distanceKm - pricingSettings.distanceFreeKm
      if (distanceKm <= 15) {
        distanceSurcharge = Math.max(0, billableKm * pricingSettings.distanceFeePerKm5to15)
      } else if (distanceKm <= 30) {
        distanceSurcharge = Math.max(0, (Math.max(0, 15 - pricingSettings.distanceFreeKm)) * pricingSettings.distanceFeePerKm5to15 + (distanceKm - 15) * pricingSettings.distanceFeePerKm15to30)
      } else {
        distanceSurcharge = Math.max(0, (Math.max(0, 15 - pricingSettings.distanceFreeKm)) * pricingSettings.distanceFeePerKm5to15 + 15 * pricingSettings.distanceFeePerKm15to30 + (distanceKm - 30) * pricingSettings.distanceFeePerKmOver30)
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
      const service = await getServiceById(sid)
      if (!service) continue

      if (!service.isActive) continue

      const basePrice = service.price || 0
      const timeAdjustedPrice = Math.round(basePrice * timeMultiplier)
      const fridayAdjustedPrice = fridayMultiplier > 1
        ? Math.round(timeAdjustedPrice * fridayMultiplier)
        : timeAdjustedPrice

      services.push({
        serviceId: sid,
        serviceName: service.name,
        basePrice,
        timeAdjustedPrice,
        fridayAdjustedPrice,
      })

      totalBasePrice += basePrice
      totalFinalPrice += fridayAdjustedPrice
    }

    const totalDistanceSurcharge = Math.round(distanceSurcharge)
    const grandTotal = totalFinalPrice + totalDistanceSurcharge

    // Calculate commission (admin fee) from settings
    const commissionPercent = pricingSettings.commissionPercent
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
