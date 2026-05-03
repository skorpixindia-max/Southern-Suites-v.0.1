// app/api/admin/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────────────────

const CouponSchema = z.object({
  hotel_id: z.string().uuid().nullable().optional(),
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  description: z.string().max(300).optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive(),
  minimum_booking: z.number().min(0).default(0),
  maximum_discount: z.number().positive().optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  usage_limit: z.number().int().positive().optional(),
  per_guest_limit: z.number().int().min(1).max(10).default(1),
  applicable_rooms: z.array(z.string().uuid()).default([]),
  is_active: z.boolean().default(true),
}).refine(
  (d) => new Date(d.valid_until) > new Date(d.valid_from),
  { message: 'valid_until must be after valid_from', path: ['valid_until'] }
).refine(
  (d) => d.discount_type !== 'percentage' || d.discount_value <= 100,
  { message: 'Percentage discount cannot exceed 100', path: ['discount_value'] }
)

const UpdateCouponSchema = CouponSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── GET /api/admin/offers ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const hotel_id = searchParams.get('hotel_id')
    const is_active = searchParams.get('is_active')
    const include_expired = searchParams.get('include_expired') === 'true'

    let query = supabase
      .from('coupons')
      .select(
        `
        id, hotel_id, code, description, discount_type, discount_value,
        minimum_booking, maximum_discount, valid_from, valid_until,
        usage_limit, used_count, per_guest_limit, applicable_rooms,
        is_active, is_deleted, created_at, updated_at,
        hotel:hotels(id, name)
        `
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.or(`hotel_id.eq.${session.hotel_id},hotel_id.is.null`)
    } else if (hotel_id) {
      query = query.or(`hotel_id.eq.${hotel_id},hotel_id.is.null`)
    }

    if (is_active !== null && is_active !== '') {
      query = query.eq('is_active', is_active === 'true')
    }

    if (!include_expired) {
      query = query.gt('valid_until', new Date().toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/admin/offers]', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    return NextResponse.json({ coupons: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/offers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/offers ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CouponSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // Check code uniqueness
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', parsed.data.code)
      .eq('is_deleted', false)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }

    const effectiveHotelId =
      session.role !== 'superadmin' && session.role !== 'admin'
        ? session.hotel_id
        : (parsed.data.hotel_id ?? null)

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({ ...parsed.data, hotel_id: effectiveHotelId })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/offers]', error)
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: effectiveHotelId ?? undefined,
      action: 'CREATE',
      entityType: 'coupon',
      entityId: coupon.id,
      newValue: { code: coupon.code, discount_type: coupon.discount_type },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/offers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/offers ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = UpdateCouponSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { id, ...updates } = parsed.data
    const supabase = createSupabaseServiceClient()

    const { data: existing } = await supabase
      .from('coupons')
      .select('id, hotel_id, code')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      existing.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/offers]', error)
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: existing.hotel_id,
      action: 'UPDATE',
      entityType: 'coupon',
      entityId: id,
      newValue: updates,
    })

    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('[PATCH /api/admin/offers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/offers ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid coupon ID required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    const { data: existing } = await supabase
      .from('coupons')
      .select('id, hotel_id, code')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      existing.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('coupons')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/admin/offers]', error)
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: existing.hotel_id,
      action: 'DELETE',
      entityType: 'coupon',
      entityId: id,
      oldValue: { code: existing.code },
    })

    return NextResponse.json({ message: 'Coupon deleted' })
  } catch (err) {
    console.error('[DELETE /api/admin/offers] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
