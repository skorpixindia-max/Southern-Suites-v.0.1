import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { StaffJWTPayload } from '@/lib/auth/jwt'

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'ss_admin_token'
const LOGIN_PAGE = '/admin/login'

// ─── Routes that do NOT require auth ─────────────────────────────────────────

const PUBLIC_ADMIN_ROUTES = [
  '/admin/login',
  '/api/admin/auth/login',
]

// ─── Role → allowed path prefixes ─────────────────────────────────────────────
// superadmin: everything
// admin: everything except system settings
// manager: hotel-scoped only
// frontdesk: bookings + guests
// housekeeping: housekeeping only
// maintenance: maintenance only

const ROLE_DENIED_PREFIXES: Record<string, string[]> = {
  admin: ['/api/admin/settings/dangerous'],
  manager: ['/admin/staff', '/admin/settings', '/api/admin/staff', '/api/admin/settings'],
  frontdesk: [
    '/admin/hotels',
    '/admin/rooms',
    '/admin/staff',
    '/admin/settings',
    '/admin/analytics',
    '/admin/blog',
    '/admin/offers',
    '/api/admin/hotels',
    '/api/admin/rooms',
    '/api/admin/staff',
    '/api/admin/settings',
    '/api/admin/analytics',
    '/api/admin/blog',
  ],
  housekeeping: [
    '/admin/bookings',
    '/admin/guests',
    '/admin/hotels',
    '/admin/rooms',
    '/admin/staff',
    '/admin/settings',
    '/admin/analytics',
    '/admin/blog',
    '/admin/offers',
    '/admin/maintenance',
    '/api/admin/bookings',
    '/api/admin/guests',
    '/api/admin/hotels',
    '/api/admin/rooms',
    '/api/admin/staff',
    '/api/admin/settings',
    '/api/admin/analytics',
    '/api/admin/blog',
  ],
  maintenance: [
    '/admin/bookings',
    '/admin/guests',
    '/admin/hotels',
    '/admin/rooms',
    '/admin/staff',
    '/admin/settings',
    '/admin/analytics',
    '/admin/blog',
    '/admin/offers',
    '/admin/housekeeping',
    '/api/admin/bookings',
    '/api/admin/guests',
    '/api/admin/hotels',
    '/api/admin/rooms',
    '/api/admin/staff',
    '/api/admin/settings',
    '/api/admin/analytics',
    '/api/admin/blog',
  ],
}

// ─── Secret ───────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  return new TextEncoder().encode(secret)
}

// ─── Verify JWT (edge-compatible — jose only, no node crypto) ─────────────────

async function verifyToken(token: string): Promise<StaffJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'southern-suites',
      audience: 'southern-suites-admin',
    })
    return payload as StaffJWTPayload
  } catch {
    return null
  }
}

// ─── JSON 401 for API routes ──────────────────────────────────────────────────

function unauthorizedJson(message: string): NextResponse {
  return NextResponse.json({ success: false, message }, { status: 401 })
}

function forbiddenJson(message: string): NextResponse {
  return NextResponse.json({ success: false, message }, { status: 403 })
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/admin')
  const isAdminPage = pathname.startsWith('/admin')

  // Allow public admin routes (login page, login API)
  if (PUBLIC_ADMIN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    if (isApi) return unauthorizedJson('Authentication required')
    const loginUrl = new URL(LOGIN_PAGE, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const payload = await verifyToken(token)

  if (!payload) {
    if (isApi) return unauthorizedJson('Invalid or expired session')
    const loginUrl = new URL(LOGIN_PAGE, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    // Clear bad cookie
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
    return response
  }

  // superadmin bypasses all role checks
  if (payload.role === 'superadmin') {
    return attachPayloadHeaders(NextResponse.next(), payload)
  }

  // Role-based access denial
  const deniedPrefixes = ROLE_DENIED_PREFIXES[payload.role] ?? []
  const isDenied = deniedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isDenied) {
    if (isApi) return forbiddenJson('Access denied for your role')
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Hotel-scoped check for non-admin, non-superadmin roles
  // If URL contains a hotelId param, ensure it matches their hotel_id
  const urlHotelId =
    request.nextUrl.searchParams.get('hotel_id') ??
    request.nextUrl.searchParams.get('hotelId')

  if (
    urlHotelId &&
    payload.role !== 'admin' &&
    payload.hotel_id &&
    payload.hotel_id !== urlHotelId
  ) {
    if (isApi) return forbiddenJson('Access denied: wrong hotel')
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return attachPayloadHeaders(NextResponse.next(), payload)
}

// ─── Forward staff identity to route handlers via headers ─────────────────────

function attachPayloadHeaders(
  request: NextRequest,
  payload: StaffJWTPayload
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-staff-id', payload.sub ?? '')
  requestHeaders.set('x-staff-role', payload.role)
  requestHeaders.set('x-staff-name', payload.name)
  requestHeaders.set('x-staff-hotel-id', payload.hotel_id ?? '')

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
