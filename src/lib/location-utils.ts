// ─── Location Utility Functions ───
// Supports Android APK via native JavaScript interface

function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).AndroidApp
}

export function openInMaps(location: string) {
  if (!location || location === 'غير محدد') return
  const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (coordMatch) {
    const [, lat, lng] = coordMatch
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  } else {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank')
  }
}

function getPositionPromise(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

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
    const parts = [addr.road || addr.street || '', addr.neighbourhood || addr.suburb || addr.village || '', addr.city || addr.town || addr.state || '', addr.country || ''].filter(Boolean)
    return parts.length > 0 ? parts.join('، ') : (data.display_name || null)
  } catch { return null }
}

/**
 * Request location permission on Android before using GPS
 */
async function ensureLocationPermission(): Promise<boolean> {
  if (!isAndroidApp()) return true
  try {
    const android = (window as any).AndroidApp
    if (android.isLocationPermissionGranted()) return true
    // Request permission natively
    android.requestLocationPermission()
    // Wait for result
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000)
      ;(window as any).onAndroidPermissionResult = (result: any) => {
        clearTimeout(timeout)
        const granted = result.granted || result['android.permission.ACCESS_FINE_LOCATION']
        resolve(!!granted)
      }
    })
  } catch { return false }
}

export async function getGPSLocation(): Promise<{ address: string; lat: number; lng: number } | null> {
  if (!navigator.geolocation && !isAndroidApp()) return null

  // Ensure permission on Android
  if (isAndroidApp()) {
    const hasPermission = await ensureLocationPermission()
    if (!hasPermission) return null
  }

  let position: GeolocationPosition | null = null

  try {
    position = await getPositionPromise({ enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 })
  } catch {}

  if (position) {
    try {
      position = await getPositionPromise({ enableHighAccuracy: true, timeout: 3000, maximumAge: 0 })
    } catch {}
  } else {
    try {
      position = await getPositionPromise({ enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 })
    } catch { return null }
  }

  const { latitude, longitude } = position.coords
  const shortAddress = await reverseGeocode(latitude, longitude, 3000)
  if (shortAddress) {
    return { address: `${shortAddress} [${latitude.toFixed(6)},${longitude.toFixed(6)}]`, lat: latitude, lng: longitude }
  }
  return { address: `${latitude.toFixed(6)},${longitude.toFixed(6)}`, lat: latitude, lng: longitude }
}

export async function getGPSCoordinates(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation && !isAndroidApp()) return null

  if (isAndroidApp()) {
    const hasPermission = await ensureLocationPermission()
    if (!hasPermission) return null
  }

  try {
    const pos = await getPositionPromise({ enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch {
    try {
      const pos = await getPositionPromise({ enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 })
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch { return null }
  }
}

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
    return data.map((item: any) => ({ name: item.display_name?.split(',').slice(0, 3).join(',') || item.display_name, lat: item.lat, lng: item.lon, display: item.display_name }))
  } catch { return [] }
}

export function extractCoordinates(location: string): { lat: number; lng: number } | null {
  if (!location) return null
  const match = location.match(/\[(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]/)
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)
  if (coordMatch) return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
  return null
}

export function getDisplayLocation(location: string): string {
  if (!location) return 'غير محدد'
  return location.replace(/\s*\[-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\]\s*$/, '').trim() || location
}

export function getMapEmbedUrl(location: string): string | null {
  const coords = extractCoordinates(location)
  if (coords) return `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
  return null
}

export function getDirectionsUrl(location: string): string | null {
  const coords = extractCoordinates(location)
  if (coords) return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
  if (location && location !== 'غير محدد') return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getDisplayLocation(location))}`
  return null
}
