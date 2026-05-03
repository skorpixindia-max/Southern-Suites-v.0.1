/**
 * lib/validations/payment.ts
 *
 * Zod schemas for all Razorpay payment lifecycle operations.
 * Amounts are always in paise (smallest INR unit) to match Razorpay's API.
 */

import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

const uuid = z.string().uuid("Must be a valid UUID");

/** Amount in paise — must be > 0, max ₹5,00,000 (50,000,000 paise) */
const amountInPaise = z
  .number({ invalid_type_error: "Amount must be a number" })
  .int("Amount must be a whole number (paise)")
  .positive("Amount must be greater than zero")
  .max(50_000_000, "Amount cannot exceed ₹5,00,000");

/** Razorpay order ID format: order_XXXXXXXXXXXXXXXX */
const razorpayOrderId = z
  .string()
  .trim()
  .regex(/^order_[a-zA-Z0-9]{14,}$/, "Invalid Razorpay order ID format");

/** Razorpay payment ID format: pay_XXXXXXXXXXXXXXXX */
const razorpayPaymentId = z
  .string()
  .trim()
  .regex(/^pay_[a-zA-Z0-9]{14,}$/, "Invalid Razorpay payment ID format");

/** Razorpay signature: 64-char hex string */
const razorpaySignature = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/, "Invalid Razorpay signature format");

// ─── 1. Create Razorpay Order ─────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
  bookingId: uuid,

  /** Amount in paise. e.g. ₹2,999 → 299900 */
  amount: amountInPaise,

  /** Defaults to INR — only INR supported for Indian hotel bookings */
  currency: z.literal("INR").default("INR"),

  /** Optional notes attached to the Razorpay order */
  notes: z
    .record(z.string().max(256))
    .optional()
    .default({}),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── 2. Verify Payment Signature ─────────────────────────────────────────────

export const VerifyPaymentSchema = z.object({
  orderId: razorpayOrderId,
  paymentId: razorpayPaymentId,
  signature: razorpaySignature,
  /** Pass bookingId for post-verification DB update */
  bookingId: uuid,
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ─── 3. Refund ────────────────────────────────────────────────────────────────

export const RefundSchema = z.object({
  paymentId: razorpayPaymentId,

  /** Amount in paise. Must be ≤ original payment. */
  amount: amountInPaise,

  reason: z
    .enum([
      "duplicate",
      "fraudulent",
      "customer_request",
      "other",
    ])
    .default("customer_request"),

  /** Free-text notes visible in Razorpay dashboard */
  notes: z
    .string()
    .trim()
    .max(500, "Refund notes must be under 500 characters")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  /** Internal booking reference for our records */
  bookingId: uuid,
});

export type RefundInput = z.infer<typeof RefundSchema>;

// ─── 4. Webhook Payload (Razorpay → our server) ───────────────────────────────

export const WebhookPayloadSchema = z.object({
  entity: z.literal("event"),
  account_id: z.string(),
  event: z.enum([
    "payment.authorized",
    "payment.captured",
    "payment.failed",
    "refund.created",
    "refund.processed",
    "refund.failed",
    "order.paid",
  ]),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string(),
          order_id: z.string().optional(),
          amount: z.number(),
          currency: z.string(),
          status: z.string(),
          method: z.string().optional(),
          email: z.string().optional(),
          contact: z.string().optional(),
          notes: z.record(z.unknown()).optional(),
          error_code: z.string().optional().nullable(),
          error_description: z.string().optional().nullable(),
        }),
      })
      .optional(),
    refund: z
      .object({
        entity: z.object({
          id: z.string(),
          payment_id: z.string(),
          amount: z.number(),
          status: z.string(),
          notes: z.record(z.unknown()).optional(),
        }),
      })
      .optional(),
    order: z
      .object({
        entity: z.object({
          id: z.string(),
          amount: z.number(),
          amount_paid: z.number(),
          status: z.string(),
        }),
      })
      .optional(),
  }),
  created_at: z.number(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
