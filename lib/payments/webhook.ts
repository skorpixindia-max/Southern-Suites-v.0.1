// lib/payments/webhook.ts

import crypto from 'crypto'

/**
 * Verifies a Razorpay webhook signature using HMAC-SHA256.
 * @param rawBody - Raw request body string (not parsed JSON)
 * @param signature - Value of x-razorpay-signature header
 * @param secret - Webhook secret from Razorpay dashboard
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}
