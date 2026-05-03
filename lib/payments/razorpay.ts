// lib/payments/razorpay.ts

interface CreateOrderParams {
  keyId: string
  keySecret: string
  amountPaise: number
  currency: string
  receipt: string
  notes?: Record<string, string>
}

interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

/**
 * Creates a Razorpay order via their REST API using Basic Auth.
 * No SDK dependency — pure fetch for edge-runtime compatibility.
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
  const { keyId, keySecret, amountPaise, currency, receipt, notes } = params

  if (amountPaise < 100) {
    throw new Error('Minimum order amount is ₹1 (100 paise)')
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt: receipt.slice(0, 40), // Razorpay max 40 chars
      notes: notes ?? {},
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    console.error('[lib/payments/razorpay] Order creation failed:', errBody)
    throw new Error(
      (errBody as { error?: { description?: string } })?.error?.description ??
        'Razorpay order creation failed'
    )
  }

  return response.json() as Promise<RazorpayOrder>
}

/**
 * Verify payment signature on the client callback.
 * Call this server-side after Razorpay redirects back with payment details.
 */
export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
  keySecret: string
}): boolean {
  const crypto = require('crypto') as typeof import('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex')
  return expectedSignature === params.signature
}
