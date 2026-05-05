'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TrackingMapProps {
  nurseLocation: { lat: number; lng: number } | null
  beneficiaryLocation: { lat: number; lng: number } | null
  nurseName?: string
  distanceKm?: number | null
}

// Fix leaflet default icon issue in Next.js
const nurseIcon = L.divIcon({
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#d946ef);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(139,92,246,0.5);border:3px solid white;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const beneficiaryIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(245,158,11,0.5);border:3px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

export default function TrackingMap({
  nurseLocation,
  beneficiaryLocation,
  nurseName = 'الممرض/ة',
  distanceKm,
}: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nurseMarkerRef = useRef<L.Marker | null>(null)
  const beneficiaryMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: [number, number] = [15.3694, 44.1910] // Yemen center (Sanaa)

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers and route
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    // Clear existing markers and lines
    if (nurseMarkerRef.current) {
      map.removeLayer(nurseMarkerRef.current)
      nurseMarkerRef.current = null
    }
    if (beneficiaryMarkerRef.current) {
      map.removeLayer(beneficiaryMarkerRef.current)
      beneficiaryMarkerRef.current = null
    }
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }

    const bounds: L.LatLngBounds = L.latLngBounds([])

    // Add beneficiary marker
    if (beneficiaryLocation) {
      const benefLatLng = L.latLng(beneficiaryLocation.lat, beneficiaryLocation.lng)
      const benefMarker = L.marker(benefLatLng, { icon: beneficiaryIcon })
        .addTo(map)
        .bindPopup('<b>موقعك</b><br>وجهة الخدمة')
      beneficiaryMarkerRef.current = benefMarker
      bounds.extend(benefLatLng)
    }

    // Add nurse marker
    if (nurseLocation) {
      const nurseLatLng = L.latLng(nurseLocation.lat, nurseLocation.lng)
      const nurseMarker = L.marker(nurseLatLng, { icon: nurseIcon })
        .addTo(map)
        .bindPopup(`<b>${nurseName}</b><br>في الطريق إليك${distanceKm ? `<br>المسافة: ${distanceKm} كم` : ''}`)
      nurseMarkerRef.current = nurseMarker
      bounds.extend(nurseLatLng)

      // Draw dashed line between nurse and beneficiary
      if (beneficiaryLocation) {
        const route = L.polyline(
          [
            [nurseLocation.lat, nurseLocation.lng],
            [beneficiaryLocation.lat, beneficiaryLocation.lng],
          ],
          {
            color: '#8b5cf6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
          }
        ).addTo(map)
        routeLineRef.current = route
      }
    }

    // Fit map to show both markers
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.3), { maxZoom: 15, animate: true })
    }
  }, [nurseLocation, beneficiaryLocation, nurseName, distanceKm])

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
      {/* Legend overlay */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000]" dir="rtl">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0"></div>
          <span className="text-xs font-medium text-gray-700">الممرض/ة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-red-500 shrink-0"></div>
          <span className="text-xs font-medium text-gray-700">موقعك</span>
        </div>
      </div>
    </div>
  )
}
