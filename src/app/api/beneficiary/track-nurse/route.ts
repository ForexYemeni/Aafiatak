import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

// Calculate distance between two points using Haversine formula (in km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimate arrival time based on distance (average urban speed 25 km/h)
function estimateArrivalMinutes(distanceKm: number): number {
  const avgSpeedKmPerMin = 25 / 60 // 25 km/h ÷ 60 min
  return Math.max(1, Math.round(distanceKm / avgSpeedKmPerMin))
}

function extractCoordinates(location: any): { lat: number; lng: number } | null {
  if (!location) return null
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location)
      if (parsed.lat && parsed.lng) return { lat: parseFloat(parsed.lat), lng: parseFloat(parsed.lng) }
      if (parsed.latitude && parsed.longitude) return { lat: parseFloat(parsed.latitude), lng: parseFloat(parsed.longitude) }
    } catch {
      const coordMatch = location.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/)
      if (coordMatch) return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
    }
    return null
  }
  if (typeof location === 'object') {
    if (location.lat && location.lng) return { lat: parseFloat(location.lat), lng: parseFloat(location.lng) }
    if (location.latitude && location.longitude) return { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'معرف التعيين مطلوب' }, { status: 400 })
    }

    // Fetch assignment
    const assignmentDoc = await firestore.collection('serviceAssignments').doc(assignmentId).get()
    if (!assignmentDoc.exists) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    const assignmentData = assignmentDoc.data()!
    const nurseId = assignmentData.nurseId
    const requestId = assignmentData.requestId

    if (!nurseId) {
      return NextResponse.json({ error: 'لم يتم تعيين ممرض لهذا الطلب' }, { status: 400 })
    }

    // Check assignment status
    if (assignmentData.status === 'completed' || assignmentData.status === 'cancelled') {
      return NextResponse.json({
        nurseId,
        assignmentStatus: assignmentData.status,
        nurseLocation: null,
        beneficiaryLocation: null,
        message: 'التعيين مكتمل أو ملغي',
      })
    }

    // Fetch nurse data with current location
    const nurseDoc = await firestore.collection('nurses').doc(nurseId).get()
    if (!nurseDoc.exists) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const nurseData = nurseDoc.data()!
    const currentLocation = nurseData.currentLocation || null

    // Parse nurse location
    let nurseLocation: { lat: number; lng: number; updatedAt?: string } | null = null
    if (currentLocation) {
      if (currentLocation.latitude && currentLocation.longitude) {
        nurseLocation = {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          updatedAt: currentLocation.updatedAt || null,
        }
      } else if (currentLocation.lat && currentLocation.lng) {
        nurseLocation = {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          updatedAt: currentLocation.updatedAt || null,
        }
      }
    }

    // Fetch beneficiary location from the service request
    let beneficiaryLocation: { lat: number; lng: number } | null = null
    if (requestId) {
      const requestDoc = await firestore.collection('serviceRequests').doc(requestId).get()
      if (requestDoc.exists) {
        const requestData = requestDoc.data()!
        if (requestData.address) {
          beneficiaryLocation = extractCoordinates(requestData.address)
        }
        // Also check beneficiary's registered location
        if (!beneficiaryLocation && requestData.beneficiaryId) {
          const benefDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()
          if (benefDoc.exists) {
            const benefData = benefDoc.data()!
            if (benefData.location) {
              beneficiaryLocation = extractCoordinates(benefData.location)
            }
          }
        }
      }
    }

    // Calculate distance and estimated arrival
    let distanceKm: number | null = null
    let estimatedMinutes: number | null = null
    if (nurseLocation && beneficiaryLocation) {
      distanceKm = Math.round(haversineDistance(
        nurseLocation.lat, nurseLocation.lng,
        beneficiaryLocation.lat, beneficiaryLocation.lng
      ) * 10) / 10
      estimatedMinutes = estimateArrivalMinutes(distanceKm)
    }

    return NextResponse.json({
      nurseId,
      nurse: {
        firstName: nurseData.firstName || '',
        lastName: nurseData.lastName || '',
        phone: nurseData.phone || '',
      },
      assignmentStatus: assignmentData.status,
      nurseLocation,
      beneficiaryLocation,
      distanceKm,
      estimatedMinutes,
      locationUpdatedAt: nurseLocation?.updatedAt || null,
    })
  } catch (error: any) {
    console.error('Track nurse error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
