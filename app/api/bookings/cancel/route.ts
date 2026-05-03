// app/api/bookings/cancel/route.ts
// Guest-facing cancellation. Restores availability. Triggers refund if paid.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { processRazorpayRefund } from '@/lib/payments/refund'
import { dispatchBookingNotifications } from '@/lib/notifications/dispatcher'
import { z } from 'zod'

const CancelSchema = z.object({
  booking_id: z.string().uuid().optional(),
  booking_reference: z.string().regex(/^SS-\d{4}-\d{5}$/).optional(),
  phone: z.string().regex(/^\+91\d{10}$/),
  reason: z.string().max(300).optional(),
}).refine(
  (d) => d.booking_id || d.booking_reference,
  { message: 'Either booking_id or booking_reference is required' }
)

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { booking_id, booking_reference, phone, reason } = parsed.data
    const supabase = createSupabaseServiceClient()

    // Fetch booking with guest verification
    let query = supabase
      .from('bookings')
      .select(
        `
        id, booking_reference, hotel_id, room_id, guest_id,
        check_in_date, check_out_date, number_of_nights,
        final_amount, status, payment_status,
        loyalty_points_earned, loyalty_points_used, loyalty_discount,
        coupon_code, coupon_discount,
        guest:guests(id, phone, name, email, loyalty_points),
        hotel:hotels(id, name, whatsapp_number, email),
        room:rooms(id, name, cancellation_policy),
        payment:payments(id, razorpay_payment_id, amount, status)
        `
      )
      .eq('is_deleted', false)
      .not('status', 'in', '("cancelled","checked_out","no_show")')

    if (booking_id) query = query.eq('id', booking_id)
    else query = query.eq('booking_reference', booking_reference!)

    const { data: booking, error: fetchErr } = await query.maybeSingle()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify phone matches guest — prevent unauthorized cancellation
    const guest = booking.guest as { id: string; phone: string; name: string; email?: string | null; loyalty_points: number }
    if (guest.phone !== phone) {
      return NextResponse.json({ error: 'Phone number does not match booking' }, { status: 403 })
    }

    // ── Cancellation policy: check if within free cancellation window ─────
    const { data: hotelSetting } = await supabase
      .from('settings')
      .select('value')
      .is('hotel_id', null)
      .eq('key', 'cancellation_hours')
      .single()

    const freeCancellationHours = parseInt(hotelSetting?.value ?? '24')
    const checkInMs = new Date(booking.check_in_date).getTime()
    const nowMs = Date.now()
    const hoursToCheckIn = (checkInMs - nowMs) / (1000 * 60 * 60)
    const isFreeCancellation = hoursToCheckIn >= freeCancellationHours

    // ── Update booking status ──────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? 'Guest requested cancellation',
        cancelled_by: 'guest',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateErr) {
      console.error('[POST /api/bookings/cancel] update error:', updateErr)
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    // ── Restore availability ───────────────────────────────────────────────
    const nights = booking.number_of_nights as number
    const cur = new Date(booking.check_in_date)
    for (let i = 0; i < nights; i++) {
      const date = cur.toISOString().split('T')[0]
      await supabase.rpc('decrement_booked_rooms', {
        p_hotel_id: booking.hotel_id,
        p_room_id: booking.room_id,
        p_date: date,
        p_count: 1,
      })
      cur.setDate(cur.getDate() + 1)
    }

    // ── Reverse loyalty points earned (not yet awarded since pending) ──────
    // Only reverse if booking was confirmed and points were meant to be awarded
    if (booking.loyalty_points_used > 0 && booking.status === 'confirmed') {
      const restored = (guest.loyalty_points ?? 0) + (booking.loyalty_points_used as number)
      await supabase
        .from('guests')
        .update({ loyalty_points: restored })
        .eq('id', guest.id)

      await supabase.from('loyalty_transactions').insert({
        guest_id: guest.id,
        booking_id: booking.id,
        transaction_type: 'adjusted',
        points: booking.loyalty_points_used as number,
        balance_after: restored,
        description: `Refunded points for cancelled booking ${booking.booking_reference}`,
      })
    }

    // ── Process refund if paid ─────────────────────────────────────────────
    let refundResult: { refund_id?: string; refund_amount?: number } = {}
    const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment

    if (
      isFreeCancellation &&
      booking.payment_status === 'paid' &&
      payment?.razorpay_payment_id &&
      payment?.status === 'success'
    ) {
      try {
        refundResult = await processRazorpayRefund({
          payment_id: payment.razorpay_payment_id,
          amount: Number(booking.final_amount),
          reason: 'Guest cancelled within free cancellation window',
          booking_id: booking.id,
        })

        await supabase
          .from('bookings')
          .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', booking.id)
      } catch (refundErr) {
        console.error('[POST /api/bookings/cancel] refund error:', refundErr)
        // Don't block cancellation — refund can be processed manually
      }
    }

    // ── Notifications ──────────────────────────────────────────────────────
    const hotel = booking.hotel as { id: string; name: string; whatsapp_number: string; email: string }
    const room = booking.room as { id: string; name: string }

    dispatchBookingNotifications({
      event: 'booking_cancelled',
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        nights,
        final_amount: Number(booking.final_amount),
        hotel_name: hotel.name,
        room_name: room.name,
      },
      guest: {
        name: guest.name,
        phone: guest.phone,
        email: guest.email ?? undefined,
      },
      hotel: {
        whatsapp_number: hotel.whatsapp_number,
        email: hotel.email,
      },
    }).catch(console.error)

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking_reference: booking.booking_reference,
      cancellation_policy: isFreeCancellation ? 'free' : 'non_refundable',
      refund: refundResult.refund_id
        ? {
            refund_id: refundResult.refund_id,
            refund_amount: refundResult.refund_amount,
            status: 'initiated',
            note: 'Refund will reflect in 5–7 business days',
          }
        : null,
    })
  } catch (err) {
    console.error('[POST /api/bookings/cancel] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
