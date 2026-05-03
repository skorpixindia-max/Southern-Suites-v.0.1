// app/api/bookings/[id]/route.ts
// GET a single booking with full details. Accessible by guest (by ref) or staff.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'

interface RouteContext {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUUID = UUID_RE.test(id)
    const isRef = /^SS-\d{4}-\d{5}$/.test(id)

    if (!isUUID && !isRef) {
      return NextResponse.json(
        { error: 'Invalid booking ID or reference' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServiceClient()

    let query = supabase
      .from('bookings')
      .select(
        `
        id, booking_reference, check_in_date, check_out_date, number_of_nights,
        adults, children, room_price_per_night, total_room_amount, discount_amount,
        gst_rate, gst_amount, final_amount, source, status, payment_status,
        special_requests, coupon_code, coupon_discount,
        loyalty_points_used, loyalty_points_earned, loyalty_discount,
        cancelled_at, cancellation_reason, checked_in_at, checked_out_at,
        created_at, updated_at,
        hotel:hotels(id, name, address, city, area, phone, whatsapp_number, email, check_in_time, check_out_time, google_maps_url),
        room:rooms(id, name, room_type, bed_type, floor_number, amenities, inclusions, cancellation_policy),
        guest:guests(id, name, email, phone, loyalty_tier, loyalty_points),
        payment:payments(id, amount, payment_method, payment_type, razorpay_payment_id, status, created_at)
        `
      )
      .eq('is_deleted', false)

    if (isUUID) {
      query = query.eq('id', id)
    } else {
      query = query.eq('booking_reference', id)
    }

    const { data: booking, error } = await query.maybeSingle()

    if (error) {
      console.error('[GET /api/bookings/[id]]', error)
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // If caller is admin, return full data including internal notes
    const session = await requireAdminSession(req).catch(() => null)
    if (session) {
      const { data: full } = await supabase
        .from('bookings')
        .select('internal_notes, ezee_booking_id, cancelled_by')
        .eq('id', booking.id)
        .single()

      return NextResponse.json({ booking: { ...booking, ...full } })
    }

    // Guest-facing: strip internal fields
    return NextResponse.json({ booking })
  } catch (err) {
    console.error('[GET /api/bookings/[id]] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
