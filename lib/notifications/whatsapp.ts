/**
 * lib/notifications/whatsapp.ts
 *
 * Phase 1: wa.me deep-link based messaging (no API key required).
 * Phase 2: WhatsApp Business API template message structure is scaffolded
 *           and will activate automatically when WHATSAPP_API_KEY and
 *           WHATSAPP_PHONE_NUMBER_ID are set in the environment.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppBookingDetails {
  guestName: string;
  guestPhone: string;           // 10-digit Indian number, e.g. "9876543210"
  bookingReference: string;
  hotelName: string;
  hotelPhone: string;
  roomType: string;
  checkIn: string;              // "25 Dec 2025"
  checkOut: string;             // "28 Dec 2025"
  nights: number;
  totalAmount: string;          // "₹14,160"
  checkInTime?: string;         // "2:00 PM"
  hotelAddress?: string;
  mapLink?: string;
}

export interface WhatsAppCancellationDetails {
  guestName: string;
  guestPhone: string;
  bookingReference: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  refundAmount: string;
  refundTimeline: string;       // "5–7 business days"
}

export interface WhatsAppResult {
  waLink: string;               // Always returned (fallback)
  apiSent?: boolean;            // True if Business API was used
  messageId?: string;           // WhatsApp message ID from API
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize Indian phone numbers to E.164 format for wa.me links.
 * Accepts: 9876543210 | +919876543210 | 919876543210 | 09876543210
 */
function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  return digits; // return as-is; validation layer catches bad numbers
}

/** Build a wa.me deep-link with a pre-filled message. */
function buildWaLink(phone: string, message: string): string {
  const normalized = normalizeIndianPhone(phone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${normalized}?text=${encoded}`;
}

// ─── WhatsApp Business API (Phase 2) ─────────────────────────────────────────

const WA_API_KEY = process.env.WHATSAPP_API_KEY;
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API_BASE = "https://graph.facebook.com/v19.0";

interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
  sub_type?: "url";
  index?: number;
}

interface WhatsAppTemplatePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
}

async function sendViaBusinessAPI(
  phone: string,
  payload: WhatsAppTemplatePayload
): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  if (!WA_API_KEY || !WA_PHONE_NUMBER_ID) {
    return { sent: false, error: "WhatsApp Business API credentials not configured" };
  }

  try {
    const res = await fetch(
      `${WA_API_BASE}/${WA_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WA_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        sent: false,
        error: `WhatsApp API error ${res.status}: ${JSON.stringify(errBody)}`,
      };
    }

    const data = await res.json();
    const messageId = data?.messages?.[0]?.id;
    return { sent: true, messageId };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── 1. Booking Confirmation ──────────────────────────────────────────────────

export async function sendBookingConfirmation(
  phone: string,
  details: WhatsAppBookingDetails
): Promise<WhatsAppResult> {
  // Phase 1 — wa.me link
  const message = [
    `🏨 *Southern Suites – Booking Confirmed*`,
    ``,
    `Dear ${details.guestName},`,
    `Your reservation is confirmed. Here are your details:`,
    ``,
    `📋 *Reference:* ${details.bookingReference}`,
    `🏨 *Hotel:* ${details.hotelName}`,
    `🛏 *Room:* ${details.roomType}`,
    `📅 *Check-in:* ${details.checkIn}${details.checkInTime ? ` at ${details.checkInTime}` : ""}`,
    `📅 *Check-out:* ${details.checkOut}`,
    `🌙 *Duration:* ${details.nights} Night${details.nights > 1 ? "s" : ""}`,
    `💰 *Total Paid:* ${details.totalAmount}`,
    ``,
    `📞 Hotel Helpdesk: ${details.hotelPhone}`,
    details.mapLink ? `📍 Directions: ${details.mapLink}` : null,
    ``,
    `Thank you for choosing Southern Suites. We look forward to welcoming you! 🙏`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const waLink = buildWaLink(phone, message);
  const result: WhatsAppResult = { waLink };

  // Phase 2 — Business API template (activates when credentials are present)
  if (WA_API_KEY && WA_PHONE_NUMBER_ID) {
    const payload: WhatsAppTemplatePayload = {
      messaging_product: "whatsapp",
      to: normalizeIndianPhone(phone),
      type: "template",
      template: {
        // Template must be pre-approved in Meta Business Manager
        name: "southern_suites_booking_confirmed",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "text", text: details.bookingReference }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: details.guestName },
              { type: "text", text: details.hotelName },
              { type: "text", text: details.roomType },
              { type: "text", text: details.checkIn },
              { type: "text", text: details.checkOut },
              { type: "text", text: `${details.nights}` },
              { type: "text", text: details.totalAmount },
            ],
          },
        ],
      },
    };

    const apiResult = await sendViaBusinessAPI(phone, payload);
    result.apiSent = apiResult.sent;
    result.messageId = apiResult.messageId;
    if (!apiResult.sent) result.error = apiResult.error;
  }

  return result;
}

// ─── 2. Cancellation Notice ───────────────────────────────────────────────────

export async function sendCancellationNotice(
  phone: string,
  details: WhatsAppCancellationDetails
): Promise<WhatsAppResult> {
  // Phase 1 — wa.me link
  const message = [
    `❌ *Southern Suites – Booking Cancelled*`,
    ``,
    `Dear ${details.guestName},`,
    `Your booking has been cancelled as requested.`,
    ``,
    `📋 *Reference:* ${details.bookingReference}`,
    `🏨 *Hotel:* ${details.hotelName}`,
    `📅 *Check-in:* ${details.checkIn}`,
    `📅 *Check-out:* ${details.checkOut}`,
    ``,
    `💚 *Refund Amount:* ${details.refundAmount}`,
    `⏱ *Refund Timeline:* ${details.refundTimeline}`,
    ``,
    `The refund will be credited to your original payment method.`,
    `For queries, email us: reservations@southernsuites.in`,
    `or call: +91 1800 123 4567 (toll-free)`,
    ``,
    `We hope to welcome you again soon. 🙏`,
  ].join("\n");

  const waLink = buildWaLink(phone, message);
  const result: WhatsAppResult = { waLink };

  // Phase 2 — Business API template
  if (WA_API_KEY && WA_PHONE_NUMBER_ID) {
    const payload: WhatsAppTemplatePayload = {
      messaging_product: "whatsapp",
      to: normalizeIndianPhone(phone),
      type: "template",
      template: {
        name: "southern_suites_booking_cancelled",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "text", text: details.bookingReference }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: details.guestName },
              { type: "text", text: details.hotelName },
              { type: "text", text: details.checkIn },
              { type: "text", text: details.checkOut },
              { type: "text", text: details.refundAmount },
              { type: "text", text: details.refundTimeline },
            ],
          },
        ],
      },
    };

    const apiResult = await sendViaBusinessAPI(phone, payload);
    result.apiSent = apiResult.sent;
    result.messageId = apiResult.messageId;
    if (!apiResult.sent) result.error = apiResult.error;
  }

  return result;
}

// ─── 3. Check-in Reminder ─────────────────────────────────────────────────────

export async function sendCheckinReminder(
  phone: string,
  details: WhatsAppBookingDetails
): Promise<WhatsAppResult> {
  // Phase 1 — wa.me link
  const message = [
    `⏰ *Southern Suites – Check-in Reminder*`,
    ``,
    `Dear ${details.guestName},`,
    `Your stay begins *tomorrow*! We're looking forward to welcoming you.`,
    ``,
    `📋 *Reference:* ${details.bookingReference}`,
    `🏨 *Hotel:* ${details.hotelName}`,
    `🛏 *Room:* ${details.roomType}`,
    `📅 *Check-in:* ${details.checkIn}${details.checkInTime ? ` at ${details.checkInTime}` : ""}`,
    `📅 *Check-out:* ${details.checkOut}`,
    ``,
    details.hotelAddress ? `📍 *Address:* ${details.hotelAddress}` : null,
    details.mapLink ? `🗺 *Directions:* ${details.mapLink}` : null,
    `📞 *Hotel:* ${details.hotelPhone}`,
    ``,
    `📝 *Please carry:*`,
    `• Government-issued photo ID (Aadhaar / Passport / DL)`,
    `• Credit card for security deposit`,
    `• This booking reference: *${details.bookingReference}*`,
    ``,
    `Early check-in available on request (subject to availability).`,
    ``,
    `See you tomorrow! 🙏`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const waLink = buildWaLink(phone, message);
  const result: WhatsAppResult = { waLink };

  // Phase 2 — Business API template
  if (WA_API_KEY && WA_PHONE_NUMBER_ID) {
    const payload: WhatsAppTemplatePayload = {
      messaging_product: "whatsapp",
      to: normalizeIndianPhone(phone),
      type: "template",
      template: {
        name: "southern_suites_checkin_reminder",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "text", text: details.hotelName }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: details.guestName },
              { type: "text", text: details.bookingReference },
              { type: "text", text: details.roomType },
              { type: "text", text: details.checkIn },
              { type: "text", text: details.checkInTime ?? "2:00 PM" },
              { type: "text", text: details.hotelPhone },
            ],
          },
          // CTA button — navigates to map link if available
          ...(details.mapLink
            ? [
                {
                  type: "button" as const,
                  sub_type: "url" as const,
                  index: 0,
                  parameters: [{ type: "text" as const, text: details.mapLink }],
                },
              ]
            : []),
        ],
      },
    };

    const apiResult = await sendViaBusinessAPI(phone, payload);
    result.apiSent = apiResult.sent;
    result.messageId = apiResult.messageId;
    if (!apiResult.sent) result.error = apiResult.error;
  }

  return result;
}
