import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { StaffRole } from '@/types/database'

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface StaffJWTPayload extends JWTPayload {
  sub: string          // staff.id
  email: string
  name: string
  role: StaffRole
  hotel_id: string | null
}

// ─── Secret ───────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signJWT(payload: Omit<StaffJWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getSecret()

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .setIssuer('southern-suites')
    .setAudience('southern-suites-admin')
    .sign(secret)
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyJWT(token: string): Promise<StaffJWTPayload> {
  const secret = getSecret()

  const { payload } = await jwtVerify(token, secret, {
    issuer: 'southern-suites',
    audience: 'southern-suites-admin',
  })

  return payload as StaffJWTPayload
}

// ─── Decode without verify (for logging only — never trust this for auth) ─────

export function decodeJWTUnsafe(token: string): StaffJWTPayload | null {
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return null
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    return decoded as StaffJWTPayload
  } catch {
    return null
  }
}

// ─── Role Checks ──────────────────────────────────────────────────────────────

export function isSuperAdmin(payload: StaffJWTPayload): boolean {
  return payload.role === 'superadmin'
}

export function isManagerOrAbove(payload: StaffJWTPayload): boolean {
  return ['superadmin', 'admin', 'manager'].includes(payload.role)
}

export function canAccessHotel(payload: StaffJWTPayload, hotelId: string): boolean {
  if (payload.role === 'superadmin' || payload.role === 'admin') return true
  return payload.hotel_id === hotelId
}
