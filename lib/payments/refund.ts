// lib/payments/refund.ts

import { createSupabaseServiceClient } from '@/lib/supabase/service'

interface RefundParams {
  payment_id: string
  amount: number // INR, will be converted to paise
  reason: string
  booking_id: string
}

interface RefundResult {
  refund_id: string
  refund_amount: number
  status: string
}

/**
 * Process a Razorpay refund.
 * Fetches API keys from settings table — never from env or client.
 */
export async function processRazorpayRefund(params: RefundParams): Promise<RefundResult> {
  const { payment_id, amount, reason, booking_id } = params

  const supabase = createSupabaseServiceClient()

  // Fetch credentials
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .is('hotel_id', null)
    .in('key', ['razorpay_key_id', 'razorpay_key_secret'])

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]))
  const keyId = settingsMap['razorpay_key_id']
  const keySecret = settingsMap['razorpay_key_secret']

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  const amountPaise = Math.round(amount * 100)
  if (amountPaise < 100) {
    throw new Error('Minimum refund amount is ₹1')
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      notes: {
        reason,
        booking_id,
      },
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    console.error('[lib/payments/refund] Refund failed:', errBody)
    throw new Error(
      (errBody as { error?: { description?: string } })?.error?.description ??
        'Razorpay refund failed'
    )
  }

  const refund = await response.json() as {
    id: string
    amount: number
    status: string
  }

  return {
    refund_id: refund.id,
    refund_amount: refund.amount / 100,
    status: refund.status,
  }
}
