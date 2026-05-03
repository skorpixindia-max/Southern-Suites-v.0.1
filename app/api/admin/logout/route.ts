// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'ss_admin_session'

// ─── POST /api/admin/logout ───────────────────────────────────────────────────
// Clears the session cookie. No DB call needed — session is validated on
// each request so expiry is server-authoritative.

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = cookies()
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expire
    })

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('[POST /api/admin/logout]', err)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
