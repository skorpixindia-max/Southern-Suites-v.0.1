// app/api/admin/housekeeping/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────────────────

const UpdateHousekeepingSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['dirty', 'cleaning', 'inspecting', 'ready', 'maintenance', 'do_not_disturb']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().max(500).optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
})

// ─── GET /api/admin/housekeeping ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const hotel_id = searchParams.get('hotel_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigned_to = searchParams.get('assigned_to')

    let query = supabase
      .from('housekeeping')
      .select(
        `
        id, hotel_id, room_id, room_number, status, priority, notes,
        started_at, completed_at, updated_at, created_at,
        assigned_staff:staff!housekeeping_assigned_to_fkey(id, name, role),
        updated_by_staff:staff!housekeeping_updated_by_fkey(id, name),
        room:rooms(id, name, room_type, floor_number),
        hotel:hotels(id, name, city),
        last_booking:bookings!housekeeping_last_booking_id_fkey(id, booking_reference, check_out_date)
        `
      )
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: true })

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.eq('hotel_id', session.hotel_id)
    } else if (hotel_id) {
      query = query.eq('hotel_id', hotel_id)
    }

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (assigned_to) query = query.eq('assigned_to', assigned_to)

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/admin/housekeeping]', error)
      return NextResponse.json({ error: 'Failed to fetch housekeeping tasks' }, { status: 500 })
    }

    // Group by status for dashboard summary
    const summary = (data ?? []).reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({ tasks: data ?? [], summary })
  } catch (err) {
    console.error('[GET /api/admin/housekeeping] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/housekeeping ────────────────────────────────────────────

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

    const parsed = UpdateHousekeepingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { id, ...updates } = parsed.data
    const supabase = createSupabaseServiceClient()

    const { data: existing } = await supabase
      .from('housekeeping')
      .select('id, hotel_id, room_number, status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Housekeeping task not found' }, { status: 404 })
    }

    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      existing.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Auto-set timestamps
    const updatePayload: Record<string, unknown> = {
      ...updates,
      updated_by: session.id,
      updated_at: new Date().toISOString(),
    }

    if (updates.status === 'cleaning' && !updates.started_at) {
      updatePayload.started_at = new Date().toISOString()
    }
    if (updates.status === 'ready' && !updates.completed_at) {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data: task, error } = await supabase
      .from('housekeeping')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/housekeeping]', error)
      return NextResponse.json({ error: 'Failed to update housekeeping task' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: existing.hotel_id,
      action: 'UPDATE',
      entityType: 'housekeeping',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: task.status, room_number: existing.room_number },
    })

    return NextResponse.json({ task })
  } catch (err) {
    console.error('[PATCH /api/admin/housekeeping] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
