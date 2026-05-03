// app/api/admin/managers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// ─── Validation ───────────────────────────────────────────────────────────────

const CreateManagerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+91\d{10}$/, 'Must be +91 followed by 10 digits'),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must have uppercase, lowercase, and a digit'
    ),
  role: z.enum(['admin', 'manager', 'frontdesk', 'housekeeping', 'maintenance']),
  hotel_id: z.string().uuid().optional(),
  permissions: z.record(z.boolean()).default({}),
  avatar_url: z.string().url().optional(),
})

// ─── GET /api/admin/managers ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin/superadmin can list staff
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
    const offset = (page - 1) * limit

    const hotel_id = searchParams.get('hotel_id')
    const role = searchParams.get('role')
    const is_active = searchParams.get('is_active')
    const search = searchParams.get('search')?.trim() ?? ''

    let query = supabase
      .from('staff')
      .select(
        `
        id, name, email, phone, role, hotel_id, permissions,
        avatar_url, is_active, is_deleted, last_login_at, created_at, updated_at,
        hotel:hotels(id, name, city)
        `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)
      // Never expose password_hash
      .neq('role', 'superadmin') // superadmin not manageable via this endpoint

    // Scope to own hotel for managers
    if (session.role === 'admin' && session.hotel_id) {
      query = query.eq('hotel_id', session.hotel_id)
    } else if (hotel_id) {
      query = query.eq('hotel_id', hotel_id)
    }

    if (role) query = query.eq('role', role)
    if (is_active !== null && is_active !== '') {
      query = query.eq('is_active', is_active === 'true')
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/managers]', error)
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }

    return NextResponse.json({
      staff: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
        has_next: offset + limit < (count ?? 0),
        has_prev: page > 1,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/managers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/managers ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateManagerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // Admin can only create staff for their own hotel
    const effectiveHotelId =
      session.role === 'admin' ? session.hotel_id : parsed.data.hotel_id

    if (!effectiveHotelId && parsed.data.role !== 'admin') {
      return NextResponse.json(
        { error: 'hotel_id is required for non-admin roles' },
        { status: 422 }
      )
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 12)

    const { data: staff, error } = await supabase
      .from('staff')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password_hash,
        role: parsed.data.role,
        hotel_id: effectiveHotelId ?? null,
        permissions: parsed.data.permissions,
        avatar_url: parsed.data.avatar_url ?? null,
        is_active: true,
      })
      .select('id, name, email, phone, role, hotel_id, is_active, created_at')
      .single()

    if (error) {
      console.error('[POST /api/admin/managers]', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Staff with this email or phone already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: effectiveHotelId ?? undefined,
      action: 'CREATE',
      entityType: 'staff',
      entityId: staff.id,
      newValue: { name: staff.name, role: staff.role, email: staff.email },
    })

    return NextResponse.json({ staff }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/managers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/managers ───────────────────────────────────────────────
// Soft delete by staff ID passed as ?id=<uuid>

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid staff ID required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (id === session.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 409 })
    }

    const supabase = createSupabaseServiceClient()

    // Fetch to verify hotel scope
    const { data: target, error: fetchErr } = await supabase
      .from('staff')
      .select('id, name, role, hotel_id, is_deleted')
      .eq('id', id)
      .single()

    if (fetchErr || !target) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    if (target.is_deleted) {
      return NextResponse.json({ error: 'Staff member already deleted' }, { status: 409 })
    }

    // Superadmin cannot be deleted via this endpoint
    if (target.role === 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete superadmin' }, { status: 403 })
    }

    // Admin can only delete staff in their hotel
    if (session.role === 'admin' && target.hotel_id !== session.hotel_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteErr } = await supabase
      .from('staff')
      .update({
        is_deleted: true,
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (deleteErr) {
      console.error('[DELETE /api/admin/managers]', deleteErr)
      return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: target.hotel_id ?? undefined,
      action: 'SOFT_DELETE',
      entityType: 'staff',
      entityId: id,
      oldValue: { name: target.name, role: target.role },
    })

    return NextResponse.json({ message: 'Staff member deactivated successfully' })
  } catch (err) {
    console.error('[DELETE /api/admin/managers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
