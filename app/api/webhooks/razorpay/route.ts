// app/api/webhooks/razorpay/route.ts
// Razorpay webhook handler. Verifies HMAC signature before processing any event.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { verifyRazorpayWebhook } from '@/lib/payments/webhook'
import { dispatchBookingNotifications } from '@/lib/notifications/dispatcher'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    // Fetch webhook secret from settings
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .is('hotel_id', null)
      .eq('key', 'razorpay_key_secret')
      .single()

    const webhookSecret = setting?.value
    if (!webhookSecret) {
      console.error('[webhook/razorpay] Webhook secret not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    // Verify signature
    const isValid = verifyRazorpayWebhook(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.warn('[webhook/razorpay] Invalid signature received')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let event: {
      event: string
      payload: {
        payment?: { entity?: Record<string, unknown> }
        refund?: { entity?: Record<string, unknown> }
        order?: { entity?: Record<string, unknown> }
      }
    }

    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const eventType = event.event
    console.info('[webhook/razorpay] Event received:', eventType)

    // ── payment.captured ────────────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload.payment?.entity as Record<string, unknown>
      const razorpayPaymentId = paymentEntity?.id as string
      const razorpayOrderId = paymentEntity?.order_id as string
      const amountPaise = paymentEntity?.amount as number
      const razorpaySignature = paymentEntity?.signature as string | undefined

      if (!razorpayPaymentId || !razorpayOrderId) {
        return NextResponse.json({ error: 'Missing payment details in payload' }, { status: 400 })
      }

      // Find the payment record by order ID
      const { data: payment, error: paymentFetchErr } = await supabase
        .from('payments')
        .select('id, booking_id, guest_id, amount, status')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle()

      if (paymentFetchErr || !payment) {
        console.error('[webhook/razorpay] Payment record not found for order:', razorpayOrderId)
        // Acknowledge to prevent retry storm — we'll reconcile manually
        return NextResponse.json({ received: true })
      }

      // Idempotency guard
      if (payment.status === 'success') {
        return NextResponse.json({ received: true, note: 'Already processed' })
      }

      // Verify amount matches
      const expectedPaise = Math.round(Number(payment.amount) * 100)
      if (amountPaise !== expectedPaise) {
        console.error(
          `[webhook/razorpay] Amount mismatch for order ${razorpayOrderId}: ` +
            `expected ${expectedPaise}, got ${amountPaise}`
        )
        // Still update payment but flag in metadata
      }

      // Update payment record
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature ?? null,
          status: 'success',
          metadata: {
            ...((paymentEntity?.notes as Record<string, unknown>) ?? {}),
            captured_at: new Date().toISOString(),
            amount_paise_received: amountPaise,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      // Update booking payment status and confirm it
      const { data: booking } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id)
        .select(
          `
          id, booking_reference, check_in_date, check_out_date,
          number_of_nights, final_amount, loyalty_points_earned,
          guest:guests(id, name, phone, email, loyalty_points),
          hotel:hotels(id, name, whatsapp_number, email),
          room:rooms(id, name)
          `
        )
        .single()
        .then(({ data }) => data)

      if (booking) {
        const guest = booking.guest as { id: string; name: string; phone: string; email?: string | null; loyalty_points: number }
        const hotel = booking.hotel as { id: string; name: string; whatsapp_number: string; email: string }
        const room = booking.room as { id: string; name: string }

        // Award loyalty points
        if (booking.loyalty_points_earned > 0) {
          const newBalance = (guest.loyalty_points ?? 0) + Number(booking.loyalty_points_earned)

          await supabase
            .from('guests')
            .update({
              loyalty_points: newBalance,
              total_stays: supabase.rpc as unknown as number, // incremented via trigger ideally
              total_spent: supabase.rpc as unknown as number,
            })
            .eq('id', guest.id)

          // Simple direct update
          await supabase
            .from('guests')
            .update({ loyalty_points: newBalance })
            .eq('id', guest.id)

          await supabase.from('loyalty_transactions').insert({
            guest_id: guest.id,
            booking_id: booking.id,
            transaction_type: 'earned',
            points: Number(booking.loyalty_points_earned),
            balance_after: newBalance,
            description: `Earned for booking ${booking.booking_reference}`,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }

        // Update guest stats
        await supabase.rpc('increment_guest_stats', {
          p_guest_id: guest.id,
          p_amount: Number(booking.final_amount),
        })

        // Fire confirmation notifications
        dispatchBookingNotifications({
          event: 'payment_confirmed',
          booking: {
            id: booking.id,
            booking_reference: booking.booking_reference,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            nights: Number(booking.number_of_nights),
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
      }
    }

    // ── payment.failed ──────────────────────────────────────────────────────
    else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload.payment?.entity as Record<string, unknown>
      const razorpayOrderId = paymentEntity?.order_id as string
      const failureReason =
        (paymentEntity?.error_description as string) ?? 'Payment failed'

      if (razorpayOrderId) {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failure_reason: failureReason,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', razorpayOrderId)
      }
    }

    // ── refund.processed ───────────────────────────────────────────────────
    else if (eventType === 'refund.processed') {
      const refundEntity = event.payload.refund?.entity as Record<string, unknown>
      const refundId = refundEntity?.id as string
      const paymentId = refundEntity?.payment_id as string

      if (refundId && paymentId) {
        await supabase
          .from('payments')
          .update({
            refund_id: refundId,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', paymentId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/razorpay] Unexpected error:', err)
    // Return 200 to prevent Razorpay retry storm
    return NextResponse.json({ received: true, error: 'Internal processing error' })
  }
}

// Disable body parsing — we need raw bytes for signature verification
export const config = {
  api: { bodyParser: false },
}
