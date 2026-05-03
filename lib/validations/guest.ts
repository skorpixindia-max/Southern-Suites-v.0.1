/**
 * lib/validations/guest.ts
 *
 * Zod schemas for guest create / update operations.
 * Indian phone validation required; email optional but validated if provided.
 */

import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

/** 10-digit Indian mobile: must start with 6, 7, 8, or 9 */
const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number (starting with 6–9)",
  });

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email address is too long")
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : (v ?? null)));

const indianPincode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code")
  .optional()
  .nullable()
  .transform((v) => v ?? null);

const indianGST = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Enter a valid 15-character GSTIN"
  )
  .optional()
  .nullable()
  .transform((v) => v ?? null);

// ─── Create Guest ─────────────────────────────────────────────────────────────

export const CreateGuestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[a-zA-Z\s'.,-]+$/, {
      message: "Name contains invalid characters",
    }),

  phone: indianPhone,

  email: optionalEmail,

  /** Aadhaar / Passport / DL / Voter ID */
  id_type: z
    .enum(["aadhaar", "passport", "driving_licence", "voter_id", "pan"])
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  id_number: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "ID number is too short")
    .max(20, "ID number is too long")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  date_of_birth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .refine(
      (val) => {
        const dob = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 18;
      },
      { message: "Primary guest must be at least 18 years old" }
    )
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  address_line1: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  address_line2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  city: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  state: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  pincode: indianPincode,

  /** Corporate booking fields */
  company_name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  gst_number: indianGST,

  /** Marketing consent */
  marketing_consent: z.boolean().default(false),
});

export type CreateGuestInput = z.infer<typeof CreateGuestSchema>;

// ─── Update Guest ─────────────────────────────────────────────────────────────

export const UpdateGuestSchema = CreateGuestSchema.partial().extend({
  id: z.string().uuid("Must be a valid guest UUID"),
});

export type UpdateGuestInput = z.infer<typeof UpdateGuestSchema>;

// ─── Guest Lookup (by phone or email) ────────────────────────────────────────

export const GuestLookupSchema = z
  .object({
    phone: indianPhone.optional(),
    email: optionalEmail,
  })
  .refine((data) => data.phone || data.email, {
    message: "Provide at least a phone number or email address",
  });

export type GuestLookupInput = z.infer<typeof GuestLookupSchema>;
