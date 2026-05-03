/**
 * lib/validations/booking.ts
 *
 * Zod schemas for all booking-related operations.
 * Used in API route handlers and server actions.
 */

import { z } from "zod";

// ─── Shared Field Definitions ─────────────────────────────────────────────────

/** Indian mobile number: exactly 10 digits, starts with 6–9 */
const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number (starting with 6–9)",
  });

/** ISO date string: YYYY-MM-DD */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  .refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date" }
  );

const uuid = z.string().uuid({ message: "Must be a valid UUID" });

// ─── 1. Create Booking ────────────────────────────────────────────────────────

export const CreateBookingSchema = z
  .object({
    hotelId: uuid,
    roomId: uuid,
    checkIn: isoDate,
    checkOut: isoDate,
    adults: z
      .number({ invalid_type_error: "Adults must be a number" })
      .int("Adults must be a whole number")
      .min(1, "At least 1 adult is required")
      .max(10, "Maximum 10 adults per booking"),
    children: z
      .number({ invalid_type_error: "Children must be a number" })
      .int("Children must be a whole number")
      .min(0, "Children cannot be negative")
      .max(10, "Maximum 10 children per booking")
      .default(0),
    guestName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .regex(/^[a-zA-Z\s'.,-]+$/, {
        message: "Name contains invalid characters",
      }),
    guestPhone: indianPhone,
    guestEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .max(254, "Email address is too long"),
    specialRequests: z
      .string()
      .trim()
      .max(500, "Special requests must be under 500 characters")
      .optional()
      .nullable()
      .transform((v) => v ?? null),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      return checkOut > checkIn;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    },
    {
      message: "Check-in date cannot be in the past",
      path: ["checkIn"],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const nights =
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
      return nights <= 365;
    },
    {
      message: "Booking duration cannot exceed 365 nights",
      path: ["checkOut"],
    }
  );

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ─── 2. Cancel Booking ────────────────────────────────────────────────────────

export const CancelBookingSchema = z.object({
  bookingId: uuid,
  reason: z
    .string()
    .trim()
    .min(5, "Please provide a reason (at least 5 characters)")
    .max(500, "Reason must be under 500 characters"),
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

// ─── 3. Check Availability ────────────────────────────────────────────────────

export const CheckAvailabilitySchema = z
  .object({
    hotelId: uuid,
    roomId: uuid,
    checkIn: isoDate,
    checkOut: isoDate,
    adults: z
      .number({ invalid_type_error: "Adults must be a number" })
      .int()
      .min(1, "At least 1 adult is required")
      .max(10, "Maximum 10 adults"),
  })
  .refine(
    (data) => new Date(data.checkOut) > new Date(data.checkIn),
    {
      message: "Check-out must be after check-in",
      path: ["checkOut"],
    }
  )
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.checkIn) >= today;
    },
    {
      message: "Check-in cannot be in the past",
      path: ["checkIn"],
    }
  );

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;

// ─── 4. Update Booking (partial patch) ───────────────────────────────────────

export const UpdateBookingSchema = z.object({
  bookingId: uuid,
  specialRequests: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  adults: z.number().int().min(1).max(10).optional(),
  children: z.number().int().min(0).max(10).optional(),
});

export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
