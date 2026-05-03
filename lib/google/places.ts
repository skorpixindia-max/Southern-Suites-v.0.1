/**
 * lib/google/places.ts
 *
 * Google Places API v1 (New) integration for Southern Suites.
 * Fetches live reviews and ratings using a hotel's Google Place ID.
 * Results are cached to the `reviews` table in Supabase.
 *
 * Env required: GOOGLE_PLACES_API_KEY
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Config ───────────────────────────────────────────────────────────────────

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_API_BASE = "https://places.googleapis.com/v1";

/** Maximum reviews returned per request (Google caps at 5 for Places API v1). */
const MAX_REVIEWS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleReview {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;           // 1–5
  text: string;
  originalText?: string;    // In original language if translated
  publishedAt: string;      // ISO 8601
  relativeTime: string;     // e.g. "2 months ago"
}

export interface HotelRating {
  rating: number;           // e.g. 4.6
  totalRatings: number;     // e.g. 1243
}

export interface FetchReviewsResult {
  success: boolean;
  reviews?: GoogleReview[];
  error?: string;
}

export interface FetchRatingResult {
  success: boolean;
  data?: HotelRating;
  error?: string;
}

export interface CacheReviewsResult {
  success: boolean;
  upserted: number;
  error?: string;
}

// ─── Internal: Raw API Types ──────────────────────────────────────────────────

interface PlacesApiReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text?: { text: string; languageCode: string };
  originalText?: { text: string; languageCode: string };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri?: string;
  };
  publishTime: string;
}

interface PlacesApiResponse {
  name?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesApiReview[];
  error?: { code: number; message: string; status: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFieldMask(fields: string[]): string {
  return fields.join(",");
}

async function fetchPlaceDetails(
  placeId: string,
  fields: string[]
): Promise<{ data: PlacesApiResponse | null; error?: string }> {
  if (!PLACES_API_KEY) {
    return { data: null, error: "GOOGLE_PLACES_API_KEY is not set" };
  }

  const fieldMask = buildFieldMask(fields);
  const url = `${PLACES_API_BASE}/places/${placeId}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      // Revalidate every 6 hours in Next.js fetch cache
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body?.error?.message ?? `HTTP ${res.status}: ${res.statusText}`;
      return { data: null, error: msg };
    }

    const data: PlacesApiResponse = await res.json();

    if (data.error) {
      return { data: null, error: `${data.error.status}: ${data.error.message}` };
    }

    return { data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { data: null, error: msg };
  }
}

function mapReview(raw: PlacesApiReview): GoogleReview {
  return {
    authorName: raw.authorAttribution.displayName,
    authorPhotoUrl: raw.authorAttribution.photoUri,
    rating: raw.rating,
    text: raw.text?.text ?? "",
    originalText: raw.originalText?.text,
    publishedAt: raw.publishTime,
    relativeTime: raw.relativePublishTimeDescription,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the latest reviews for a hotel using its Google Place ID.
 *
 * @param placeId  Google Place ID, e.g. "ChIJN1t_tDeuEmsRUsoyG83frY4"
 * @returns        Array of up to 5 normalised reviews
 */
export async function fetchHotelReviews(
  placeId: string
): Promise<FetchReviewsResult> {
  if (!placeId?.trim()) {
    return { success: false, error: "placeId is required" };
  }

  const { data, error } = await fetchPlaceDetails(placeId, [
    "reviews",
    "reviews.text",
    "reviews.originalText",
    "reviews.rating",
    "reviews.authorAttribution",
    "reviews.publishTime",
    "reviews.relativePublishTimeDescription",
  ]);

  if (error || !data) {
    console.error(`[Places] fetchHotelReviews(${placeId}):`, error);
    return { success: false, error: error ?? "No data returned" };
  }

  const reviews = (data.reviews ?? [])
    .slice(0, MAX_REVIEWS)
    .map(mapReview);

  return { success: true, reviews };
}

/**
 * Fetch the aggregate rating and review count for a hotel.
 *
 * @param placeId  Google Place ID
 */
export async function fetchHotelRating(
  placeId: string
): Promise<FetchRatingResult> {
  if (!placeId?.trim()) {
    return { success: false, error: "placeId is required" };
  }

  const { data, error } = await fetchPlaceDetails(placeId, [
    "rating",
    "userRatingCount",
  ]);

  if (error || !data) {
    console.error(`[Places] fetchHotelRating(${placeId}):`, error);
    return { success: false, error: error ?? "No data returned" };
  }

  if (data.rating === undefined) {
    return { success: false, error: "Rating not available for this place" };
  }

  return {
    success: true,
    data: {
      rating: data.rating,
      totalRatings: data.userRatingCount ?? 0,
    },
  };
}

/**
 * Upsert reviews into the Supabase `reviews` table.
 * Uses (hotel_id, author_name, published_at) as the unique key.
 *
 * @param hotelId  Internal Supabase hotel UUID
 * @param reviews  Array of GoogleReview objects (from fetchHotelReviews)
 */
export async function cacheReviewsToDB(
  hotelId: string,
  reviews: GoogleReview[]
): Promise<CacheReviewsResult> {
  if (!hotelId?.trim()) {
    return { success: false, upserted: 0, error: "hotelId is required" };
  }

  if (!reviews.length) {
    return { success: true, upserted: 0 };
  }

  try {
    const supabase = createAdminClient();

    const rows = reviews.map((r) => ({
      hotel_id: hotelId,
      author_name: r.authorName,
      author_photo_url: r.authorPhotoUrl ?? null,
      rating: r.rating,
      review_text: r.text,
      original_text: r.originalText ?? null,
      published_at: r.publishedAt,
      relative_time: r.relativeTime,
      source: "google",
      updated_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from("reviews")
      .upsert(rows, {
        onConflict: "hotel_id,author_name,published_at",
        count: "exact",
      });

    if (error) {
      console.error("[Places] cacheReviewsToDB:", error.message);
      return { success: false, upserted: 0, error: error.message };
    }

    return { success: true, upserted: count ?? rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DB error";
    return { success: false, upserted: 0, error: msg };
  }
}

/**
 * Convenience: fetch reviews from Google AND cache them in one call.
 *
 * @param hotelId  Internal Supabase hotel UUID
 * @param placeId  Google Place ID
 */
export async function syncHotelReviews(
  hotelId: string,
  placeId: string
): Promise<{ success: boolean; reviews?: GoogleReview[]; upserted?: number; error?: string }> {
  const fetchResult = await fetchHotelReviews(placeId);
  if (!fetchResult.success || !fetchResult.reviews) {
    return { success: false, error: fetchResult.error };
  }

  const cacheResult = await cacheReviewsToDB(hotelId, fetchResult.reviews);
  return {
    success: cacheResult.success,
    reviews: fetchResult.reviews,
    upserted: cacheResult.upserted,
    error: cacheResult.error,
  };
}
