import { NextRequest, NextResponse } from 'next/server'
import { getStaffByEmail } from '@/lib/db/staff'
import { comparePassword } from '@/lib/auth/password'
import { setSession } from '@/lib/auth/session'
import { updateStaffLastLogin } from '@/lib/db/staff'
import { logAuditAction } from '@/lib/db/audit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const staff = await getStaffByEmail(email.toLowerCase().trim())

    if (!staff) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!staff.is_active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      )
    }

    const passwordValid = await comparePassword(password, staff.password_hash)

    if (!passwordValid) {
      await logAuditAction({
        staff_id: staff.id,
        staff_name: staff.name,
        staff_role: staff.role,
        hotel_id: staff.hotel_id ?? undefined,
        action: 'login_failed',
        entity_type: 'staff',
        entity_id: staff.id,
        ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
        user_agent: req.headers.get('user-agent') ?? undefined,
      })

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    await updateStaffLastLogin(staff.id)

    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        hotel_id: staff.hotel_id,
      },
    })

    await setSession(response, {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      hotel_id: staff.hotel_id ?? undefined,
    })

    await logAuditAction({
      staff_id: staff.id,
      staff_name: staff.name,
      staff_role: staff.role,
      hotel_id: staff.hotel_id ?? undefined,
      action: 'login_success',
      entity_type: 'staff',
      entity_id: staff.id,
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
      user_agent: req.headers.get('user-agent') ?? undefined,
    })

    return response
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
