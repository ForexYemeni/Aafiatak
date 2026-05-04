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
 * Get GPS location with reverse geocoding
 * Returns the real address name from coordinates
 */
export async function getGPSLocation(): Promise<{ address: string; lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar&zoom=16&addressdetails=1`,
            { headers: { 'User-Agent': 'AafiatakApp/1.0' } }
          )
          const data = await res.json()
          // Build a clean short address from components
          const addr = data.address || {}
          const parts = [
            addr.road || addr.street || '',
            addr.neighbourhood || addr.suburb || addr.village || '',
            addr.city || addr.town || addr.state || '',
            addr.country || ''
          ].filter(Boolean)
          const shortAddress = parts.length > 0
            ? parts.join('، ')
            : (data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

          // Store both the display address and coordinates
          const finalAddress = `${shortAddress} [${latitude.toFixed(6)},${longitude.toFixed(6)}]`
          resolve({ address: finalAddress, lat: latitude, lng: longitude })
        } catch {
          resolve({ address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, lat: latitude, lng: longitude })
        }
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  })
}

/**
 * Search for a location using Nominatim (OpenStreetMap)
 * Returns list of matching locations
 */
export async function searchLocation(query: string): Promise<Array<{ name: string; lat: string; lng: string; display: string }>> {
  if (!query || query.length < 3) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'AafiatakApp/1.0' } }
    )
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
