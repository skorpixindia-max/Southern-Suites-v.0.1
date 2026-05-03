// app/api/payment/refund/route.ts
// Admin-initiated refund endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { processRazorpayRefund } from '@/lib/payments/refund'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const RefundSchema = z.object({
  booking_id: z.string().uuid(),
  refund_amount: z.number().positive().optional(), // Partial refund support
  reason: z.string().min(5).max(300),
})

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

    const parsed = RefundSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { booking_id, refund_amount, reason } = parsed.data
    const supabase = createSupabaseServiceClient()

    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select(
        `
        id, booking_reference, hotel_id, final_amount, payment_status,
        payment:payments(id, razorpay_payment_id, amount, status, refund_id)
        `
      )
      .eq('id', booking_id)
      .eq('is_deleted', false)
      .single()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Hotel scope
    if (
      session.role !== 'superadmin' &&
      session.role !== 'admin' &&
      booking.hotel_id !== session.hotel_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!['paid', 'partial'].includes(booking.payment_status)) {
      return NextResponse.json(
        { error: 'Booking has no successful payment to refund' },
        { status: 409 }
      )
    }

    const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment

    if (!payment?.razorpay_payment_id) {
      return NextResponse.json(
        { error: 'No Razorpay payment found for this booking' },
        { status: 422 }
      )
    }

    if (payment.refund_id) {
      return NextResponse.json(
        { error: 'A refund has already been initiated for this payment' },
        { status: 409 }
      )
    }

    const maxRefundable = Number(payment.amount)
    const amountToRefund = refund_amount
      ? Math.min(refund_amount, maxRefundable)
      : maxRefundable

    const refundResult = await processRazorpayRefund({
      payment_id: payment.razorpay_payment_id,
      amount: amountToRefund,
      reason,
      booking_id,
    })

    // Update payment record
    await supabase
      .from('payments')
      .update({
        refund_id: refundResult.refund_id,
        refund_amount: amountToRefund,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        status: amountToRefund >= maxRefundable ? 'refunded' : 'partially_refunded',
      })
      .eq('id', payment.id)

    // Update booking payment status
    const newPaymentStatus = amountToRefund >= maxRefundable ? 'refunded' : 'partial'
    await supabase
      .from('bookings')
      .update({ payment_status: newPaymentStatus, updated_at: new Date().toISOString() })
      .eq('id', booking_id)

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: booking.hotel_id,
      action: 'REFUND',
      entityType: 'payment',
      entityId: payment.id,
      newValue: {
        refund_id: refundResult.refund_id,
        amount: amountToRefund,
        reason,
      },
    })

    return NextResponse.json({
      refund_id: refundResult.refund_id,
      refund_amount: amountToRefund,
      status: 'initiated',
      note: 'Refund will reflect in 5–7 business days',
    })
  } catch (err) {
    console.error('[POST /api/payment/refund] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
