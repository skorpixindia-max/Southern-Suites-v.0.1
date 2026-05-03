// app/api/payment/create-order/route.ts
// Creates a Razorpay order. Fetches amount from DB — never trusts client amount.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createRazorpayOrder } from '@/lib/payments/razorpay'
import { z } from 'zod'

const CreateOrderSchema = z.object({
  booking_id: z.string().uuid(),
  // phone is used as an ownership check — guest must provide their registered phone
  phone: z.string().regex(/^\+91\d{10}$/),
})

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { booking_id, phone } = parsed.data
    const supabase = createSupabaseServiceClient()

    // Fetch booking + guest for ownership verification
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select(
        `
        id, booking_reference, final_amount, status, payment_status,
        hotel_id, guest_id,
        guest:guests(id, name, email, phone),
        hotel:hotels(id, name)
        `
      )
      .eq('id', booking_id)
      .eq('is_deleted', false)
      .single()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const guest = booking.guest as { id: string; name: string; email?: string | null; phone: string }

    // Ownership check
    if (guest.phone !== phone) {
      return NextResponse.json({ error: 'Phone number does not match booking' }, { status: 403 })
    }

    // Status guards
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot pay for a cancelled booking' }, { status: 409 })
    }
    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 409 })
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Booking is not in a payable state' },
        { status: 409 }
      )
    }

    // ── Fetch Razorpay credentials from settings ───────────────────────────
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .is('hotel_id', null)
      .in('key', ['razorpay_key_id', 'razorpay_key_secret'])

    const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]))
    const keyId = settingsMap['razorpay_key_id']
    const keySecret = settingsMap['razorpay_key_secret']

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // ── Amount from DB — in paise (Razorpay requires integer paise) ────────
    const amountPaise = Math.round(Number(booking.final_amount) * 100)

    if (amountPaise < 100) {
      return NextResponse.json(
        { error: 'Booking amount too low for online payment' },
        { status: 422 }
      )
    }

    // ── Create Razorpay order ──────────────────────────────────────────────
    const hotel = booking.hotel as { id: string; name: string }

    const order = await createRazorpayOrder({
      keyId,
      keySecret,
      amountPaise,
      currency: 'INR',
      receipt: booking.booking_reference,
      notes: {
        booking_id,
        booking_reference: booking.booking_reference,
        hotel_name: hotel.name,
        guest_name: guest.name,
      },
    })

    // ── Persist the order in payments table ───────────────────────────────
    const { error: paymentErr } = await supabase.from('payments').insert({
      booking_id,
      guest_id: guest.id,
      amount: Number(booking.final_amount),
      currency: 'INR',
      payment_method: 'razorpay',
      payment_type: 'full',
      razorpay_order_id: order.id,
      status: 'pending',
      metadata: { order },
    })

    if (paymentErr) {
      console.error('[POST /api/payment/create-order] payments insert error:', paymentErr)
      // Non-fatal — order was created; proceed
    }

    return NextResponse.json({
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
      booking_reference: booking.booking_reference,
      prefill: {
        name: guest.name,
        email: guest.email ?? '',
        contact: guest.phone,
      },
      theme: {
        color: '#1B2A4A',
      },
    })
  } catch (err) {
    console.error('[POST /api/payment/create-order] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
