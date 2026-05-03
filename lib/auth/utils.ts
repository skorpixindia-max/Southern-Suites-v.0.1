// lib/utils.ts

/**
 * Format a number as Indian Rupees.
 * e.g. 12500 → "₹12,500.00"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate a booking reference in SS-YYYY-NNNNN format.
 * Used as a fallback if the DB trigger hasn't fired yet.
 */
export function generateBookingRef(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 99999 + 1)
    .toString()
    .padStart(5, '0')
  return `SS-${year}-${rand}`
}

/**
 * Calculate nights between two date strings (YYYY-MM-DD).
 * Returns 0 for invalid/equal dates.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const diff =
    new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate GST per schema: 12% for rooms ≤ ₹2500/night, 18% above.
 */
export function getGSTRate(pricePerNight: number): number {
  return pricePerNight <= 2500 ? 12 : 18
}

/**
 * Apply GST to a base amount. Returns { base, gst, total }.
 */
export function applyGST(baseAmount: number, ratePercent: number) {
  const gst = Math.round(baseAmount * (ratePercent / 100) * 100) / 100
  return {
    base: baseAmount,
    gst,
    total: Math.round((baseAmount + gst) * 100) / 100,
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Mask a phone number: +919876543210 → +91 98765 ••••••
 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return phone.slice(0, -6) + '••••••'
}

/**
 * Mask an email: test@example.com → te••@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}••@${domain}`
}

/**
 * Convert a hotel/room name to a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Sleep for `ms` milliseconds. Use in retry logic.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Safe JSON parse with a typed fallback.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Strip undefined keys from an object (for clean Supabase upserts).
 */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}

/**
 * Convert IST date string to UTC ISO string for Supabase storage.
 */
export function toUTCFromIST(localISOString: string): string {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  return new Date(new Date(localISOString).getTime() - IST_OFFSET_MS).toISOString()
}

/**
 * Format a date as DD Mon YYYY in Indian locale.
 * e.g. 2024-12-25 → "25 Dec 2024"
 */
export function formatDateIN(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
