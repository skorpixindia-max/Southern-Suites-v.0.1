/**
 * lib/notifications/dispatcher.ts
 *
 * Central notification dispatcher for Southern Suites.
 * Rules:
 *   - booking_confirmed  → email + whatsapp
 *   - cancellation       → email + whatsapp
 *   - checkin_reminder   → whatsapp only
 *
 * Every notification attempt (success or failure) is logged
 * to the `notifications` table in Supabase.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendCheckinReminderEmail,
  type BookingEmailDetails,
  type CancellationEmailDetails,
  type CheckinReminderDetails,
} from "./email";
import {
  sendBookingConfirmation as sendWhatsAppConfirmation,
  sendCancellationNotice as sendWhatsAppCancellation,
  sendCheckinReminder as sendWhatsAppReminder,
  type WhatsAppBookingDetails,
  type WhatsAppCancellationDetails,
} from "./whatsapp";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationChannel = "email" | "whatsapp";
type NotificationEvent =
  | "booking_confirmed"
  | "booking_cancelled"
  | "checkin_reminder"
  | "feedback_request";
type NotificationStatus = "sent" | "failed" | "skipped";

interface NotificationLogEntry {
  booking_id: string;
  guest_phone?: string;
  guest_email?: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  status: NotificationStatus;
  message_id?: string;
  wa_link?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

interface DispatchResult {
  email?: { success: boolean; messageId?: string; error?: string };
  whatsapp?: { success: boolean; waLink?: string; messageId?: string; error?: string };
}

// ─── DB Logger ────────────────────────────────────────────────────────────────

async function logNotification(entry: NotificationLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("notifications").insert({
      booking_id: entry.booking_id,
      guest_phone: entry.guest_phone ?? null,
      guest_email: entry.guest_email ?? null,
      channel: entry.channel,
      event: entry.event,
      status: entry.status,
      message_id: entry.message_id ?? null,
      wa_link: entry.wa_link ?? null,
      error_message: entry.error_message ?? null,
      metadata: entry.metadata ?? null,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Dispatcher] Failed to log notification:", error.message);
    }
  } catch (err) {
    // Non-blocking — logging failure must never crash a booking flow
    console.error(
      "[Dispatcher] Unexpected error logging notification:",
      err instanceof Error ? err.message : err
    );
  }
}

// ─── Shared Params Types ──────────────────────────────────────────────────────

export interface BookingConfirmationParams {
  bookingId: string;
  email: BookingEmailDetails;
  whatsapp: WhatsAppBookingDetails;
}

export interface CancellationParams {
  bookingId: string;
  email: CancellationEmailDetails;
  whatsapp: WhatsAppCancellationDetails;
}

export interface ReminderParams {
  bookingId: string;
  whatsapp: WhatsAppBookingDetails;
  /** Optional: also send reminder email (off by default per spec) */
  emailDetails?: CheckinReminderDetails;
}

// ─── 1. Booking Confirmed: Email + WhatsApp ───────────────────────────────────

export async function dispatchBookingConfirmation(
  params: BookingConfirmationParams
): Promise<DispatchResult> {
  const result: DispatchResult = {};
  const { bookingId, email, whatsapp } = params;

  // ── Email ──
  const emailRes = await sendBookingConfirmationEmail(email);
  result.email = emailRes;

  await logNotification({
    booking_id: bookingId,
    guest_email: email.guestEmail,
    channel: "email",
    event: "booking_confirmed",
    status: emailRes.success ? "sent" : "failed",
    message_id: emailRes.messageId,
    error_message: emailRes.error,
    metadata: { bookingReference: email.bookingReference },
  });

  // ── WhatsApp ──
  const waRes = await sendWhatsAppConfirmation(whatsapp.guestPhone, whatsapp);
  result.whatsapp = {
    success: waRes.apiSent ?? true, // wa.me link is always available
    waLink: waRes.waLink,
    messageId: waRes.messageId,
    error: waRes.error,
  };

  await logNotification({
    booking_id: bookingId,
    guest_phone: whatsapp.guestPhone,
    channel: "whatsapp",
    event: "booking_confirmed",
    // If Business API was attempted and failed, mark failed; wa.me link is always a success
    status: waRes.apiSent === false && !waRes.messageId ? "failed" : "sent",
    message_id: waRes.messageId,
    wa_link: waRes.waLink,
    error_message: waRes.error,
    metadata: {
      bookingReference: whatsapp.bookingReference,
      apiUsed: !!waRes.apiSent,
    },
  });

  return result;
}

// ─── 2. Cancellation: Email + WhatsApp ───────────────────────────────────────

export async function dispatchCancellation(
  params: CancellationParams
): Promise<DispatchResult> {
  const result: DispatchResult = {};
  const { bookingId, email, whatsapp } = params;

  // ── Email ──
  const emailRes = await sendBookingCancellationEmail(email);
  result.email = emailRes;

  await logNotification({
    booking_id: bookingId,
    guest_email: email.guestEmail,
    channel: "email",
    event: "booking_cancelled",
    status: emailRes.success ? "sent" : "failed",
    message_id: emailRes.messageId,
    error_message: emailRes.error,
    metadata: { bookingReference: email.bookingReference },
  });

  // ── WhatsApp ──
  const waRes = await sendWhatsAppCancellation(whatsapp.guestPhone, whatsapp);
  result.whatsapp = {
    success: waRes.apiSent ?? true,
    waLink: waRes.waLink,
    messageId: waRes.messageId,
    error: waRes.error,
  };

  await logNotification({
    booking_id: bookingId,
    guest_phone: whatsapp.guestPhone,
    channel: "whatsapp",
    event: "booking_cancelled",
    status: waRes.apiSent === false && !waRes.messageId ? "failed" : "sent",
    message_id: waRes.messageId,
    wa_link: waRes.waLink,
    error_message: waRes.error,
    metadata: {
      bookingReference: whatsapp.bookingReference,
      apiUsed: !!waRes.apiSent,
    },
  });

  return result;
}

// ─── 3. Check-in Reminder: WhatsApp only (+ optional email) ──────────────────

export async function dispatchReminder(
  params: ReminderParams
): Promise<DispatchResult> {
  const result: DispatchResult = {};
  const { bookingId, whatsapp, emailDetails } = params;

  // ── WhatsApp (primary channel for reminders) ──
  const waRes = await sendWhatsAppReminder(whatsapp.guestPhone, whatsapp);
  result.whatsapp = {
    success: waRes.apiSent ?? true,
    waLink: waRes.waLink,
    messageId: waRes.messageId,
    error: waRes.error,
  };

  await logNotification({
    booking_id: bookingId,
    guest_phone: whatsapp.guestPhone,
    channel: "whatsapp",
    event: "checkin_reminder",
    status: waRes.apiSent === false && !waRes.messageId ? "failed" : "sent",
    message_id: waRes.messageId,
    wa_link: waRes.waLink,
    error_message: waRes.error,
    metadata: {
      bookingReference: whatsapp.bookingReference,
      apiUsed: !!waRes.apiSent,
    },
  });

  // ── Optional email reminder ──
  if (emailDetails) {
    const { sendCheckinReminderEmail } = await import("./email");
    const emailRes = await sendCheckinReminderEmail(emailDetails);
    result.email = emailRes;

    await logNotification({
      booking_id: bookingId,
      guest_email: emailDetails.guestEmail,
      channel: "email",
      event: "checkin_reminder",
      status: emailRes.success ? "sent" : "failed",
      message_id: emailRes.messageId,
      error_message: emailRes.error,
      metadata: { bookingReference: emailDetails.bookingReference },
    });
  }

  return result;
}
