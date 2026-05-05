import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, getBeneficiaryById } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

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
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'معرف التعيين مطلوب' }, { status: 400 })
    }

    await connectToDatabase()
    const ServiceAssignment = mongoose.models.ServiceAssignment
    const ServiceRequest = mongoose.models.ServiceRequest
    const Nurse = mongoose.models.Nurse
    const Beneficiary = mongoose.models.Beneficiary

    // Fetch assignment
    const assignmentDoc = ServiceAssignment ? await ServiceAssignment.findById(assignmentId).lean() : null
    if (!assignmentDoc) {
      return NextResponse.json({ error: 'التعيين غير موجود' }, { status: 404 })
    }

    const nurseId = assignmentDoc.nurseId
    const requestId = assignmentDoc.requestId

    if (!nurseId) {
      return NextResponse.json({ error: 'لم يتم تعيين ممرض لهذا الطلب' }, { status: 400 })
    }

    // Check assignment status
    if (assignmentDoc.status === 'completed' || assignmentDoc.status === 'cancelled') {
      return NextResponse.json({
        nurseId,
        assignmentStatus: assignmentDoc.status,
        nurseLocation: null,
        beneficiaryLocation: null,
        message: 'التعيين مكتمل أو ملغي',
      })
    }

    // Fetch nurse data with current location
    const nurseDoc = Nurse ? await Nurse.findById(nurseId).lean() : null
    if (!nurseDoc) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    const currentLocation = nurseDoc.currentLocation || null

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
      const requestDoc = ServiceRequest ? await ServiceRequest.findById(requestId).lean() : null
      if (requestDoc) {
        if (requestDoc.address) {
          beneficiaryLocation = extractCoordinates(requestDoc.address)
        }
        // Also check beneficiary's registered location
        if (!beneficiaryLocation && requestDoc.beneficiaryId) {
          const benefDoc = Beneficiary ? await Beneficiary.findById(requestDoc.beneficiaryId).lean() : null
          if (benefDoc) {
            if (benefDoc.location) {
              beneficiaryLocation = extractCoordinates(benefDoc.location)
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
        firstName: nurseDoc.firstName || '',
        lastName: nurseDoc.lastName || '',
        phone: nurseDoc.phone || '',
      },
      assignmentStatus: assignmentDoc.status,
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
