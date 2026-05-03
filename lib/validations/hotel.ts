/**
 * lib/validations/hotel.ts
 *
 * Zod schemas for hotel create / update / image operations.
 * All fields map directly to the `hotels` table columns.
 */

import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

const uuid = z.string().uuid({ message: "Must be a valid UUID" });

const httpUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .startsWith("https://", "URL must use HTTPS");

const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number",
  });

/** Indian GST number: 15-character alphanumeric with known structure */
const gstNumber = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Enter a valid 15-character Indian GSTIN"
  );

/** Google Place ID starts with "ChIJ" */
const googlePlaceId = z
  .string()
  .trim()
  .min(10, "Invalid Google Place ID")
  .max(300, "Invalid Google Place ID")
  .optional()
  .nullable()
  .transform((v) => v ?? null);

const embedCode = z
  .string()
  .trim()
  .max(5000, "Embed code is too long")
  .optional()
  .nullable()
  .transform((v) => v ?? null);

// ─── Amenities ────────────────────────────────────────────────────────────────

export const HOTEL_AMENITIES = [
  "wifi",
  "pool",
  "spa",
  "gym",
  "restaurant",
  "bar",
  "room_service",
  "parking",
  "airport_shuttle",
  "conference_hall",
  "laundry",
  "concierge",
  "ev_charging",
  "pet_friendly",
  "kids_club",
  "business_center",
] as const;

export type HotelAmenity = (typeof HOTEL_AMENITIES)[number];

// ─── Create Hotel ─────────────────────────────────────────────────────────────

export const CreateHotelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Hotel name must be at least 3 characters")
    .max(120, "Hotel name must be under 120 characters"),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug must be under 80 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase letters, numbers, and hyphens only",
    }),

  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),

  short_description: z
    .string()
    .trim()
    .min(10, "Short description must be at least 10 characters")
    .max(300, "Short description must be under 300 characters")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  address: z
    .string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be under 500 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(80, "City must be under 80 characters"),

  district: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  state: z.string().trim().default("Andhra Pradesh"),

  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),

  latitude: z
    .number({ invalid_type_error: "Latitude must be a number" })
    .min(-90)
    .max(90)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  longitude: z
    .number({ invalid_type_error: "Longitude must be a number" })
    .min(-180)
    .max(180)
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  phone: indianPhone,

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254),

  gst_number: gstNumber,

  pan_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid 10-character PAN")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  star_rating: z
    .number()
    .int()
    .min(1, "Star rating must be between 1 and 5")
    .max(5, "Star rating must be between 1 and 5")
    .default(5),

  total_rooms: z
    .number()
    .int()
    .min(1, "Hotel must have at least 1 room")
    .max(1000),

  check_in_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format (e.g. 14:00)")
    .default("14:00"),

  check_out_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format (e.g. 11:00)")
    .default("11:00"),

  amenities: z
    .array(z.enum(HOTEL_AMENITIES))
    .min(1, "Select at least one amenity")
    .default([]),

  google_place_id: googlePlaceId,

  map_embed_code: embedCode,

  tour_embed_code: embedCode,

  cover_image_url: httpUrl.optional().nullable().transform((v) => v ?? null),

  is_active: z.boolean().default(true),

  meta_title: z
    .string()
    .trim()
    .max(70, "Meta title must be under 70 characters")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  meta_description: z
    .string()
    .trim()
    .max(160, "Meta description must be under 160 characters")
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

export type CreateHotelInput = z.infer<typeof CreateHotelSchema>;

// ─── Update Hotel (all fields optional except id) ─────────────────────────────

export const UpdateHotelSchema = CreateHotelSchema.partial().extend({
  id: uuid,
});

export type UpdateHotelInput = z.infer<typeof UpdateHotelSchema>;

// ─── Hotel Image ──────────────────────────────────────────────────────────────

export const HotelImageSchema = z.object({
  hotel_id: uuid,

  url: httpUrl,

  alt_text: z
    .string()
    .trim()
    .min(3, "Alt text must be at least 3 characters")
    .max(200, "Alt text must be under 200 characters"),

  caption: z
    .string()
    .trim()
    .max(300, "Caption must be under 300 characters")
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  category: z
    .enum([
      "exterior",
      "lobby",
      "room",
      "bathroom",
      "restaurant",
      "pool",
      "spa",
      "gym",
      "conference",
      "other",
    ])
    .default("other"),

  sort_order: z
    .number()
    .int()
    .min(0)
    .max(999)
    .default(0),

  is_cover: z.boolean().default(false),
});

export type HotelImageInput = z.infer<typeof HotelImageSchema>;
