// ─── Location Utility Functions ───
// Shared utilities for GPS, geocoding, and map link generation

/**
 * Open a location in Google Maps
 * Accepts an address string or coordinates string
 */
export function openInMaps(location: string) {
  if (!location || location === 'غير محدد') return
  // Check if it looks like coordinates (contains digits and comma)
  const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (coordMatch) {
    const [, lat, lng] = coordMatch
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  } else {
    // It's an address - use Google Maps search
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank')
  }
}

/**
 * Helper: Wrap navigator.geolocation.getCurrentPosition as a Promise
 */
function getPositionPromise(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/**
 * Helper: Reverse geocode coordinates via Nominatim with timeout
 * Returns short Arabic address or null if it fails
 */
async function reverseGeocode(lat: number, lng: number, timeoutMs = 3000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=16&addressdetails=1`,
      { headers: { 'User-Agent': 'AafiatakApp/1.0' }, signal: controller.signal }
    )
    clearTimeout(timeoutId)

    const data = await res.json()
    const addr = data.address || {}
    const parts = [
      addr.road || addr.street || '',
      addr.neighbourhood || addr.suburb || addr.village || '',
      addr.city || addr.town || addr.state || '',
      addr.country || ''
    ].filter(Boolean)
    return parts.length > 0
      ? parts.join('، ')
      : (data.display_name || null)
  } catch {
    return null
  }
}

/**
 * Get GPS location with reverse geocoding — FAST (<5 seconds)
 *
 * Strategy:
 *   Phase 1: Quick position from cache/network (0-4s, usually instant)
 *   Phase 2: Refine with high-accuracy GPS (0-3s if available)
 *   Then:    Reverse geocode with timeout (0-3s)
 *   Fallback: Raw coordinates if geocoding fails
 */
export async function getGPSLocation(): Promise<{ address: string; lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null

  let position: GeolocationPosition | null = null

  // ── Phase 1: Fast position (network/WiFi/cached — usually instant) ──
  try {
    position = await getPositionPromise({
      enableHighAccuracy: false,
      timeout: 4000,
      maximumAge: 300000  // Accept up to 5-minute-old cached position
    })
  } catch {
    // Phase 1 failed (permission denied or no cached position)
  }

  // ── Phase 2: Try high-accuracy GPS for better coordinates ──
  if (position) {
    // We already have a rough position — try to refine with GPS quickly
    try {
      const accuratePos = await getPositionPromise({
        enableHighAccuracy: true,
        timeout: 3000,     // Only wait 3s for GPS refinement
        maximumAge: 0      // Must be fresh GPS
      })
      position = accuratePos
    } catch {
      // GPS refinement failed — keep the Phase 1 position (it's still valid)
    }
  } else {
    // Phase 1 failed entirely — try GPS directly as last resort
    try {
      position = await getPositionPromise({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000   // Accept up to 1-min-old GPS position
      })
    } catch {
      // All attempts failed
      return null
    }
  }

  const { latitude, longitude } = position.coords

  // ── Phase 3: Reverse geocode with timeout ──
  const shortAddress = await reverseGeocode(latitude, longitude, 3000)

  if (shortAddress) {
    const finalAddress = `${shortAddress} [${latitude.toFixed(6)},${longitude.toFixed(6)}]`
    return { address: finalAddress, lat: latitude, lng: longitude }
  }

  // Fallback: raw coordinates
  const coordAddress = `${latitude.toFixed(6)},${longitude.toFixed(6)}`
  return { address: coordAddress, lat: latitude, lng: longitude }
}

/**
 * Get GPS coordinates ONLY (no geocoding) — ultra fast
 * Returns raw { lat, lng } in under 3 seconds typically
 */
export async function getGPSCoordinates(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null

  try {
    // Fast: network/cached position
    const pos = await getPositionPromise({
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 300000
    })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch {
    // Fallback: try GPS
    try {
      const pos = await getPositionPromise({
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 60000
      })
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch {
      return null
    }
  }
}

/**
 * Search for a location using Nominatim (OpenStreetMap)
 * Returns list of matching locations
 */
export async function searchLocation(query: string): Promise<Array<{ name: string; lat: string; lng: string; display: string }>> {
  if (!query || query.length < 3) return []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'AafiatakApp/1.0' }, signal: controller.signal }
    )
    clearTimeout(timeoutId)
    const data = await res.json()
    return data.map((item: any) => ({
      name: item.display_name?.split(',').slice(0, 3).join(',') || item.display_name,
      lat: item.lat,
      lng: item.lon,
      display: item.display_name,
    }))
  } catch {
    return []
  }
}

/**
 * Extract coordinates from a location string like "Address [lat,lng]"
 */
export function extractCoordinates(location: string): { lat: number; lng: number } | null {
  if (!location) return null
  const match = location.match(/\[(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]/)
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  // Also try plain coordinates
  const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (coordMatch) return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
  return null
}

/**
 * Get display name from a location string (remove coordinates part)
 */
export function getDisplayLocation(location: string): string {
  if (!location) return 'غير محدد'
  // Remove the [lat,lng] part for display
  return location.replace(/\s*\[-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\]\s*$/, '').trim() || location
}

/**
 * Get OpenStreetMap embed URL for a location
 * Returns an iframe src URL showing a map with a marker
 */
export function getMapEmbedUrl(location: string): string | null {
  const coords = extractCoordinates(location)
  if (coords) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
  }
  return null
}

/**
 * Get Google Maps directions URL from current location to target
 */
export function getDirectionsUrl(location: string): string | null {
  const coords = extractCoordinates(location)
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
  }
  if (location && location !== 'غير محدد') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getDisplayLocation(location))}`
  }
  return null
}
