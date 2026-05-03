// app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────────────────

const PatchBookingSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(['confirm', 'cancel', 'check_in', 'check_out', 'no_show']),
  cancellation_reason: z.string().max(500).optional(),
  internal_notes: z.string().max(1000).optional(),
})

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
// All bookings with filters, search, and pagination.
// Managers see only their hotel's bookings.

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
    const offset = (page - 1) * limit

    const hotel_id = searchParams.get('hotel_id')
    const status = searchParams.get('status')
    const payment_status = searchParams.get('payment_status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')?.trim() ?? ''
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const check_in_from = searchParams.get('check_in_from')
    const check_in_to = searchParams.get('check_in_to')

    let query = supabase
      .from('bookings')
      .select(
        `
        id, booking_reference, check_in_date, check_out_date, number_of_nights,
        adults, children, room_price_per_night, total_room_amount, discount_amount,
        gst_rate, gst_amount, final_amount, source, status, payment_status,
        special_requests, internal_notes, coupon_code, coupon_discount,
        loyalty_points_used, loyalty_points_earned, loyalty_discount,
        cancelled_at, cancellation_reason, cancelled_by,
        checked_in_at, checked_out_at, is_deleted, created_at, updated_at,
        hotel:hotels(id, name, city, area),
        room:rooms(id, name, room_type),
        guest:guests(id, name, email, phone, loyalty_tier)
        `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)

    // Scope to hotel for non-superadmin
    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.eq('hotel_id', session.hotel_id)
    } else if (hotel_id) {
      query = query.eq('hotel_id', hotel_id)
    }

    // Filters
    if (status) query = query.eq('status', status)
    if (payment_status) query = query.eq('payment_status', payment_status)
    if (source) query = query.eq('source', source)

    // Created date range
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) query = query.lte('created_at', `${date_to}T23:59:59`)

    // Check-in date range
    if (check_in_from) query = query.gte('check_in_date', check_in_from)
    if (check_in_to) query = query.lte('check_in_date', check_in_to)

    // Search by booking reference (server-side; for guest search see /guests)
    if (search) {
      query = query.ilike('booking_reference', `%${search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/bookings]', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    // Aggregate totals for the current filter set (all pages)
    const { data: agg } = await supabase
      .from('bookings')
      .select('final_amount, status, payment_status')
      .eq('is_deleted', false)
      .then(({ data }) => ({ data }))

    const summary = {
      total_revenue: (agg ?? [])
        .filter((b) => b.payment_status === 'paid')
        .reduce((sum, b) => sum + Number(b.final_amount ?? 0), 0),
      confirmed: (agg ?? []).filter((b) => b.status === 'confirmed').length,
      pending: (agg ?? []).filter((b) => b.status === 'pending').length,
      cancelled: (agg ?? []).filter((b) => b.status === 'cancelled').length,
    }

    return NextResponse.json({
      bookings: data ?? [],
      summary,
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
    console.error('[GET /api/admin/bookings] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/bookings ────────────────────────────────────────────────
// Confirm or cancel a booking. Restoring availability on cancel is handled here.

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

    const parsed = PatchBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { booking_id, action, cancellation_reason, internal_notes } = parsed.data
    const supabase = createSupabaseServiceClient()

    // Fetch the booking
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('is_deleted', false)
      .single()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Hotel scope check for managers
    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      booking.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // State machine validation
    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirm', 'cancel'],
      confirmed: ['check_in', 'cancel', 'no_show'],
      checked_in: ['check_out'],
      checked_out: [],
      cancelled: [],
      no_show: [],
    }

    if (!allowedTransitions[booking.status]?.includes(action)) {
      return NextResponse.json(
        {
          error: `Cannot perform '${action}' on a booking with status '${booking.status}'`,
        },
        { status: 409 }
      )
    }

    // Build update payload
    const statusMap: Record<string, string> = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      check_in: 'checked_in',
      check_out: 'checked_out',
      no_show: 'no_show',
    }

    const updatePayload: Record<string, unknown> = {
      status: statusMap[action],
      updated_at: new Date().toISOString(),
    }

    if (internal_notes) updatePayload.internal_notes = internal_notes

    if (action === 'cancel') {
      updatePayload.cancelled_at = new Date().toISOString()
      updatePayload.cancellation_reason = cancellation_reason ?? 'Cancelled by staff'
      updatePayload.cancelled_by = 'staff'
    }

    if (action === 'check_in') {
      updatePayload.checked_in_at = new Date().toISOString()
    }

    if (action === 'check_out') {
      updatePayload.checked_out_at = new Date().toISOString()
    }

    const { data: updated, error: updateErr } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', booking_id)
      .select()
      .single()

    if (updateErr) {
      console.error('[PATCH /api/admin/bookings] update error:', updateErr)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    // On cancellation: restore availability for every night in the stay
    if (action === 'cancel') {
      const nights = booking.number_of_nights as number
      const checkIn = new Date(booking.check_in_date)

      const availabilityUpdates = Array.from({ length: nights }).map((_, i) => {
        const d = new Date(checkIn)
        d.setDate(d.getDate() + i)
        return d.toISOString().split('T')[0]
      })

      for (const date of availabilityUpdates) {
        await supabase.rpc('decrement_booked_rooms', {
          p_hotel_id: booking.hotel_id,
          p_room_id: booking.room_id,
          p_date: date,
          p_count: 1,
        })
      }
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: booking.hotel_id,
      action: action.toUpperCase(),
      entityType: 'booking',
      entityId: booking_id,
      oldValue: { status: booking.status },
      newValue: { status: updated.status },
    })

    return NextResponse.json({ booking: updated })
  } catch (err) {
    console.error('[PATCH /api/admin/bookings] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
