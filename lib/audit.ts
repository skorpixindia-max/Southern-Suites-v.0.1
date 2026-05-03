/**
 * lib/audit.ts
 *
 * Single-function audit logger for Southern Suites admin operations.
 * Writes structured records to the `audit_log` Supabase table.
 *
 * Design principles:
 *   - Non-blocking: never throws — a logging failure must never crash a request
 *   - Serialises old/new values safely (no circular-reference crash)
 *   - Sanitises sensitive fields before persisting
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditAction =
  // Auth
  | "login"
  | "logout"
  | "login_failed"
  | "password_changed"
  // Bookings
  | "booking_created"
  | "booking_cancelled"
  | "booking_updated"
  | "booking_checked_in"
  | "booking_checked_out"
  // Hotels
  | "hotel_created"
  | "hotel_updated"
  | "hotel_deactivated"
  | "hotel_image_added"
  | "hotel_image_deleted"
  // Rooms
  | "room_created"
  | "room_updated"
  | "room_deactivated"
  // Payments
  | "payment_captured"
  | "refund_initiated"
  | "refund_completed"
  // Staff
  | "staff_created"
  | "staff_updated"
  | "staff_deactivated"
  // Guests
  | "guest_created"
  | "guest_updated"
  // Reviews
  | "review_published"
  | "review_hidden"
  // System
  | "settings_updated"
  | "export_generated";

export type AuditEntityType =
  | "booking"
  | "hotel"
  | "room"
  | "guest"
  | "staff"
  | "payment"
  | "refund"
  | "review"
  | "settings"
  | "auth";

export interface LogActionParams {
  /** UUID of the staff member performing the action (null for system actions) */
  staffId: string | null;
  staffName: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  /** UUID of the affected record */
  entityId: string | null;
  /** Record state before the change (for updates/deletes) */
  oldValue?: Record<string, unknown> | null;
  /** Record state after the change (for creates/updates) */
  newValue?: Record<string, unknown> | null;
  /** Client IP address from request headers */
  ipAddress?: string | null;
  /** User-Agent string from request headers */
  userAgent?: string | null;
  /** Additional context that doesn't fit the schema */
  metadata?: Record<string, unknown> | null;
}

// ─── Sensitive Fields (redacted before storage) ───────────────────────────────

const SENSITIVE_FIELDS = new Set([
  "password",
  "password_hash",
  "token",
  "refresh_token",
  "secret",
  "api_key",
  "private_key",
  "card_number",
  "cvv",
  "otp",
  "pin",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitise(
  obj: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!obj) return null;

  try {
    const clone: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        clone[key] = "[REDACTED]";
      } else if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        clone[key] = sanitise(val as Record<string, unknown>);
      } else {
        clone[key] = val;
      }
    }
    return clone;
  } catch {
    return { _error: "Could not sanitise value" };
  }
}

function safeStringify(obj: unknown): string | null {
  if (obj === null || obj === undefined) return null;
  try {
    return JSON.stringify(obj, (_key, value) => {
      // Break circular references
      if (typeof value === "bigint") return value.toString();
      return value;
    });
  } catch {
    return null;
  }
}

/**
 * Extract a best-effort IP from Next.js request headers.
 * Pass `request.headers` from a Route Handler or Middleware.
 */
export function extractIP(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    null
  );
}

// ─── Core: logAction ──────────────────────────────────────────────────────────

/**
 * Write a single audit log entry to the `audit_log` table.
 * Always resolves — never rejects or throws.
 *
 * @example
 * await logAction({
 *   staffId: session.userId,
 *   staffName: session.name,
 *   action: "booking_cancelled",
 *   entityType: "booking",
 *   entityId: bookingId,
 *   oldValue: previousBooking,
 *   newValue: updatedBooking,
 *   ipAddress: extractIP(request.headers),
 *   userAgent: request.headers.get("user-agent"),
 * });
 */
export async function logAction(params: LogActionParams): Promise<void> {
  const {
    staffId,
    staffName,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    metadata,
  } = params;

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("audit_log").insert({
      staff_id: staffId ?? null,
      staff_name: staffName ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      old_value: safeStringify(sanitise(oldValue ?? null)),
      new_value: safeStringify(sanitise(newValue ?? null)),
      ip_address: ipAddress ?? null,
      user_agent: userAgent ? userAgent.slice(0, 500) : null, // truncate long UA strings
      metadata: safeStringify(metadata ?? null),
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Log to console but never propagate — audit must not break the app
      console.error(
        `[Audit] Failed to write log (${action} on ${entityType}/${entityId}):`,
        error.message
      );
    }
  } catch (err) {
    console.error(
      "[Audit] Unexpected error writing audit log:",
      err instanceof Error ? err.message : err
    );
  }
}
