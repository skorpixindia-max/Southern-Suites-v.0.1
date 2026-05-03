// app/api/admin/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────────────────

const PricingRuleSchema = z.object({
  hotel_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  rule_name: z.string().min(2).max(100),
  rule_type: z.enum(['date_range', 'day_of_week', 'event', 'last_minute', 'early_bird']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days_of_week: z
    .array(z.number().int().min(0).max(6))
    .default([]),
  price_type: z.enum(['fixed', 'percentage_increase', 'percentage_decrease']),
  price_value: z.number().positive(),
  min_nights: z.number().int().min(1).default(1),
  priority: z.number().int().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
})

const UpdatePricingRuleSchema = PricingRuleSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── GET /api/admin/pricing ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const hotel_id = searchParams.get('hotel_id')
    const room_id = searchParams.get('room_id')
    const rule_type = searchParams.get('rule_type')
    const is_active = searchParams.get('is_active')

    let query = supabase
      .from('pricing_rules')
      .select(
        `
        id, hotel_id, room_id, rule_name, rule_type, start_date, end_date,
        days_of_week, price_type, price_value, min_nights, priority, is_active,
        is_deleted, created_at, updated_at,
        hotel:hotels(id, name),
        room:rooms(id, name, room_type)
        `
      )
      .eq('is_deleted', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.eq('hotel_id', session.hotel_id)
    } else if (hotel_id) {
      query = query.eq('hotel_id', hotel_id)
    }

    if (room_id) query = query.eq('room_id', room_id)
    if (rule_type) query = query.eq('rule_type', rule_type)
    if (is_active !== null && is_active !== '') {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/admin/pricing]', error)
      return NextResponse.json({ error: 'Failed to fetch pricing rules' }, { status: 500 })
    }

    return NextResponse.json({ pricing_rules: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/pricing] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/pricing ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    const parsed = PricingRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const effectiveHotelId =
      session.role !== 'superadmin' && session.role !== 'admin'
        ? session.hotel_id
        : parsed.data.hotel_id

    if (!effectiveHotelId) {
      return NextResponse.json({ error: 'hotel_id is required' }, { status: 422 })
    }

    const supabase = createSupabaseServiceClient()

    const { data: rule, error } = await supabase
      .from('pricing_rules')
      .insert({ ...parsed.data, hotel_id: effectiveHotelId })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/pricing]', error)
      return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: effectiveHotelId,
      action: 'CREATE',
      entityType: 'pricing_rule',
      entityId: rule.id,
      newValue: rule,
    })

    return NextResponse.json({ pricing_rule: rule }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/pricing] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/pricing ─────────────────────────────────────────────────

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

    const parsed = UpdatePricingRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { id, ...updates } = parsed.data
    const supabase = createSupabaseServiceClient()

    const { data: existing } = await supabase
      .from('pricing_rules')
      .select('id, hotel_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 })
    }

    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      existing.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rule, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/pricing]', error)
      return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: existing.hotel_id,
      action: 'UPDATE',
      entityType: 'pricing_rule',
      entityId: id,
      newValue: updates,
    })

    return NextResponse.json({ pricing_rule: rule })
  } catch (err) {
    console.error('[PATCH /api/admin/pricing] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/pricing ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid pricing rule ID required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    const { data: existing } = await supabase
      .from('pricing_rules')
      .select('id, hotel_id, rule_name')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 })
    }

    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      existing.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('pricing_rules')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/admin/pricing]', error)
      return NextResponse.json({ error: 'Failed to delete pricing rule' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: existing.hotel_id,
      action: 'DELETE',
      entityType: 'pricing_rule',
      entityId: id,
      oldValue: { rule_name: existing.rule_name },
    })

    return NextResponse.json({ message: 'Pricing rule deleted' })
  } catch (err) {
    console.error('[DELETE /api/admin/pricing] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
