import { cookies } from 'next/headers'
import { signJWT, verifyJWT, type StaffJWTPayload } from '@/lib/auth/jwt'
import type { StaffRole } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'ss_admin_token'
const COOKIE_MAX_AGE = 60 * 60 * 8  // 8 hours — matches JWT exp

// ─── Set Session Cookie ───────────────────────────────────────────────────────

export async function setSession(staff: {
  id: string
  email: string
  name: string
  role: StaffRole
  hotel_id: string | null
}): Promise<void> {
  const token = await signJWT({
    sub: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    hotel_id: staff.hotel_id,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

// ─── Get Session ──────────────────────────────────────────────────────────────

export async function getSession(): Promise<StaffJWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    return await verifyJWT(token)
  } catch {
    return null
  }
}

// ─── Require Session (throws if unauthenticated) ──────────────────────────────

export async function requireSession(): Promise<StaffJWTPayload> {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')
  return session
}

// ─── Clear Session Cookie ─────────────────────────────────────────────────────

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ─── Refresh Session (extend cookie lifetime) ─────────────────────────────────

export async function refreshSession(): Promise<void> {
  const session = await getSession()
  if (!session || !session.sub) return

  await setSession({
    id: session.sub,
    email: session.email,
    name: session.name,
    role: session.role,
    hotel_id: session.hotel_id,
  })
}

// ─── Cookie Name Export (used by middleware) ──────────────────────────────────

export { COOKIE_NAME }
