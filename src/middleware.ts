import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

function getClientIP(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  return 'unknown'
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanup()

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // New window
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

// Rate limit configurations
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  // Login: 5 per minute
  login: { limit: 5, windowMs: 60 * 1000 },
  // Registration: 3 per minute
  register: { limit: 3, windowMs: 60 * 1000 },
  // General API: 100 per minute
  api: { limit: 100, windowMs: 60 * 1000 },
}

function getRateLimitCategory(pathname: string): string {
  if (pathname.includes('/login') || pathname.includes('/auth/login')) {
    return 'login'
  }
  if (pathname.includes('/register') || pathname.includes('/auth/register')) {
    return 'register'
  }
  return 'api'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only rate limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = getClientIP(request)
  const category = getRateLimitCategory(pathname)
  const config = RATE_LIMITS[category]

  const key = `${category}:${ip}`
  const result = checkRateLimit(key, config.limit, config.windowMs)

  const response = result.allowed
    ? NextResponse.next()
    : NextResponse.json(
        {
          error: 'طلبات كثيرة جداً',
          message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
        },
        { status: 429 }
      )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(config.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))

  if (!result.allowed) {
    response.headers.set('Retry-After', String(Math.ceil((result.resetTime - Date.now()) / 1000)))
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
