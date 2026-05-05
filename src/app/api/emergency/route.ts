import { NextRequest, NextResponse } from 'next/server'
import { createEmergencyRequest, getAdminSettings } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { beneficiaryId, serviceType, address, notes, price, paymentMethod, paymentMethodId, dynamicPrice: clientDynamicPrice, pricingBreakdown: clientPricingBreakdown } = body

    if (!beneficiaryId || !serviceType || !address) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'يرجى اختيار طريقة الدفع' }, { status: 400 })
    }

    // Get price from admin settings if not provided
    let basePrice = price || 0
    let dynamicPrice = 0
    let pricingBreakdown: Record<string, any> = clientPricingBreakdown || {}
    let commission: Record<string, any> = {}

    try {
      const settings = await getAdminSettings()
      if (settings) {
        // Get base price from emergency service prices
        if (!basePrice && settings.emergencyServicePrices) {
          basePrice = settings.emergencyServicePrices[serviceType] || settings.emergencyServicePrices['أخرى'] || 0
        }

        // Apply dynamic pricing (use client-provided if available, otherwise calculate server-side)
        if (clientDynamicPrice && clientPricingBreakdown) {
          dynamicPrice = clientDynamicPrice
          pricingBreakdown = clientPricingBreakdown
        } else if (basePrice > 0) {
          const now = new Date()
          const hour = now.getHours()
          const day = now.getDay() // 0=Sunday, 5=Friday
          let surchargeTotal = 0

          // Night surcharge (10 PM to 6 AM)
          const nightPercent = settings.nightSurchargePercent || 50
          if (hour >= 22 || hour < 6) {
            const nightAmount = Math.round(basePrice * nightPercent / 100)
            surchargeTotal += nightAmount
            pricingBreakdown.nightSurcharge = { percent: nightPercent, amount: nightAmount }
          }

          // Friday surcharge
          const fridayPercent = settings.fridaySurchargePercent || 25
          if (day === 5) {
            const fridayAmount = Math.round(basePrice * fridayPercent / 100)
            surchargeTotal += fridayAmount
            pricingBreakdown.fridaySurcharge = { percent: fridayPercent, amount: fridayAmount }
          }

          dynamicPrice = basePrice + surchargeTotal
          pricingBreakdown.basePrice = basePrice
          pricingBreakdown.totalSurcharge = surchargeTotal
          pricingBreakdown.dynamicPrice = dynamicPrice
        }

        // Commission
        if (dynamicPrice > 0) {
          const commissionPercent = settings.commissionPercent || 15
          const commissionAmount = Math.round(dynamicPrice * commissionPercent / 100)
          commission = {
            percent: commissionPercent,
            amount: commissionAmount,
            nursePayout: dynamicPrice - commissionAmount,
          }
        }
      }
    } catch {
      // Settings not available, use base price without dynamic pricing
      dynamicPrice = basePrice || clientDynamicPrice || 0
    }

    // Determine initial status based on payment method
    const isCashPayment = paymentMethod === 'cash'
    const initialStatus = isCashPayment ? 'pending_confirmation' : 'pending_payment'
    const initialPaymentStatus = isCashPayment ? 'cash_on_delivery' : 'unpaid'

    const emergencyRequest = await createEmergencyRequest({
      beneficiaryId,
      serviceType,
      address,
      ...(notes ? { notes } : {}),
      price: basePrice,
      dynamicPrice: dynamicPrice || basePrice,
      ...(Object.keys(pricingBreakdown).length > 0 ? { pricingBreakdown } : {}),
      ...(Object.keys(commission).length > 0 ? { commission } : {}),
      paymentMethod: paymentMethod || null,
      paymentMethodId: paymentMethodId || null,
      paymentStatus: initialPaymentStatus,
      status: initialStatus,
    })

    // Get admin settings for emergency phone
    let emergencyPhone: string | null = null
    try {
      const settings = await getAdminSettings()
      if (settings && settings.emergencyPhone) {
        emergencyPhone = settings.emergencyPhone
      }
    } catch {
      // Settings not available, continue without emergency phone
    }

    return NextResponse.json({
      ...emergencyRequest,
      emergencyPhone,
    })
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
