/**
 * lib/utils.ts
 *
 * Shared pure utility functions for Southern Suites.
 * No external dependencies — safe to import in server and client components.
 */

// ─── 1. formatCurrency ────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees using the en-IN locale.
 *
 * @example
 * formatCurrency(2999)    // "₹2,999"
 * formatCurrency(125000)  // "₹1,25,000"
 * formatCurrency(0)       // "₹0"
 * formatCurrency(1299.5)  // "₹1,300" (no decimal for whole paise)
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format with decimal paise (use for invoice line items).
 * @example formatCurrencyExact(1299.50) → "₹1,299.50"
 */
export function formatCurrencyExact(amount: number): string {
  if (!isFinite(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── 2. formatDate ────────────────────────────────────────────────────────────

/**
 * Format a date string or Date object to a human-readable form.
 *
 * @example
 * formatDate("2025-12-25")  // "25 Dec 2025"
 * formatDate(new Date())    // "04 May 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format with day of week.
 * @example formatDateLong("2025-12-25") → "Thursday, 25 Dec 2025"
 */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date and time.
 * @example formatDateTime("2025-12-25T14:00:00") → "25 Dec 2025, 2:00 PM"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── 3. calculateNights ───────────────────────────────────────────────────────

/**
 * Calculate the number of nights between two ISO date strings.
 * Returns 0 if checkOut ≤ checkIn.
 *
 * @example
 * calculateNights("2025-12-25", "2025-12-28")  // 3
 * calculateNights("2025-12-28", "2025-12-25")  // 0
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;

  const diffMs = outDate.getTime() - inDate.getTime();
  const nights = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
}

// ─── 4. generateBookingReference ─────────────────────────────────────────────

/**
 * Generate a unique booking reference in the format SS-YYYY-XXXXX.
 * The suffix is a cryptographically random 5-character alphanumeric string.
 *
 * @example
 * generateBookingReference()  // "SS-2025-A3K9M"
 *
 * Server-safe: uses crypto.getRandomValues when available, falls back to Math.random.
 */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes ambiguous: 0/O, 1/I

  let suffix = "";
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      suffix += chars[byte % chars.length];
    }
  } else {
    for (let i = 0; i < 5; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return `SS-${year}-${suffix}`;
}

// ─── 5. formatPhone ───────────────────────────────────────────────────────────

/**
 * Format a 10-digit Indian mobile number to display format.
 *
 * @example
 * formatPhone("9876543210")     // "+91 98765 43210"
 * formatPhone("919876543210")   // "+91 98765 43210"
 * formatPhone("+919876543210")  // "+91 98765 43210"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  let tenDigit = digits;
  if (digits.length === 12 && digits.startsWith("91")) {
    tenDigit = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigit = digits.slice(1);
  }

  if (tenDigit.length !== 10) return phone; // Return as-is if unrecognised

  return `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`;
}

// ─── 6. slugify ───────────────────────────────────────────────────────────────

/**
 * Convert any string to a URL-safe slug.
 *
 * @example
 * slugify("The Grand Palace Hotel!")  // "the-grand-palace-hotel"
 * slugify("Vizag Beach & Resort")     // "vizag-beach-resort"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")                         // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "")          // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")            // Remove non-alphanumeric except space/hyphen
    .trim()
    .replace(/\s+/g, "-")                     // Replace spaces with hyphens
    .replace(/-+/g, "-")                      // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");                // Trim leading/trailing hyphens
}

// ─── 7. truncate ─────────────────────────────────────────────────────────────

/**
 * Truncate a string to a maximum length, appending an ellipsis.
 * Breaks at word boundaries when possible.
 *
 * @example
 * truncate("A beautiful beachfront hotel", 20)  // "A beautiful beachfro…"
 * truncate("Short text", 50)                    // "Short text"
 */
export function truncate(text: string, length: number, ellipsis = "…"): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length - ellipsis.length).trimEnd() + ellipsis;
}

/**
 * Truncate at the nearest word boundary before `length`.
 */
export function truncateWords(text: string, length: number, ellipsis = "…"): string {
  if (!text) return "";
  if (text.length <= length) return text;

  const cut = text.slice(0, length - ellipsis.length);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + ellipsis;
}

// ─── 8. getInitials ──────────────────────────────────────────────────────────

/**
 * Extract initials from a full name (up to 2 characters).
 *
 * @example
 * getInitials("Southern Suites")     // "SS"
 * getInitials("Rajesh Kumar Verma")  // "RK"
 * getInitials("Madonna")             // "M"
 */
export function getInitials(name: string): string {
  if (!name?.trim()) return "?";

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// ─── Bonus Utilities (project-specific) ──────────────────────────────────────

/**
 * Convert an amount in rupees to paise (for Razorpay).
 * @example rupeesToPaise(1299)  // 129900
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees (from Razorpay response).
 * @example paiseToRupees(129900)  // 1299
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Check if a date string represents today or a future date.
 */
export function isFutureOrToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Get a friendly relative time string.
 * @example relativeTime("2026-05-03") → "yesterday" / "2 days ago"
 */
export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}

/**
 * Safely parse JSON without throwing.
 */
export function safeParseJSON<T = unknown>(str: string | null | undefined): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a URL-safe random token (for email verification, password reset, etc.)
 * @param length  Number of characters (default 32)
 */
export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}
