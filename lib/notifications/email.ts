import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@southernsuites.in";
const FROM_NAME = "Southern Suites";
const BRAND_NAVY = "#1B2A4A";
const BRAND_GOLD = "#C9A84C";

// ─── Shared Layout ────────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Southern Suites</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#F5F3EE;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;
                 overflow:hidden;box-shadow:0 2px 16px rgba(27,42,74,0.10);">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_NAVY};padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:${BRAND_GOLD};
                         text-transform:uppercase;font-weight:600;">Luxury Hospitality</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:700;
                          letter-spacing:1px;font-family:Georgia,'Times New Roman',serif;">
                Southern Suites
              </h1>
              <div style="width:48px;height:2px;background:${BRAND_GOLD};margin:14px auto 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND_NAVY};padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:${BRAND_GOLD};font-size:13px;font-weight:600;
                         letter-spacing:1px;">SOUTHERN SUITES HOSPITALITY</p>
              <p style="margin:0 0 4px;color:#8FA3C3;font-size:12px;">
                9 Luxury Properties across Andhra Pradesh, India
              </p>
              <p style="margin:0 0 16px;color:#8FA3C3;font-size:12px;">
                reservations@southernsuites.in &nbsp;|&nbsp; +91 1800 123 4567
              </p>
              <p style="margin:0;color:#5A6E8C;font-size:11px;line-height:1.6;">
                © ${new Date().getFullYear()} Southern Suites Hospitality Pvt. Ltd. All rights reserved.<br/>
                <a href="https://southernsuites.in/privacy" style="color:${BRAND_GOLD};text-decoration:none;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="https://southernsuites.in/terms" style="color:${BRAND_GOLD};text-decoration:none;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function divider(): string {
  return `<div style="height:1px;background:linear-gradient(to right,transparent,${BRAND_GOLD},transparent);
                      margin:28px 0;"></div>`;
}

function detailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #EEE8DC;vertical-align:top;">
      <span style="font-size:11px;font-weight:600;letter-spacing:1px;color:#8FA3C3;
                   text-transform:uppercase;">${label}</span>
    </td>
    <td style="padding:10px 0 10px 16px;border-bottom:1px solid #EEE8DC;
               vertical-align:top;text-align:right;">
      <span style="font-size:14px;font-weight:600;color:${BRAND_NAVY};">${value}</span>
    </td>
  </tr>`;
}

function goldBadge(text: string): string {
  return `<div style="display:inline-block;background:${BRAND_GOLD};color:#ffffff;
                      font-size:11px;font-weight:700;letter-spacing:2px;
                      text-transform:uppercase;padding:6px 18px;border-radius:2px;
                      margin-bottom:4px;">${text}</div>`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingEmailDetails {
  guestName: string;
  guestEmail: string;
  bookingReference: string;
  hotelName: string;
  hotelAddress: string;
  roomType: string;
  checkIn: string;        // "25 Dec 2025"
  checkOut: string;       // "28 Dec 2025"
  nights: number;
  adults: number;
  children: number;
  baseAmount: string;     // "₹12,000"
  gstAmount: string;      // "₹2,160"
  totalAmount: string;    // "₹14,160"
  qrCodeUrl?: string;
  specialRequests?: string;
}

export interface CancellationEmailDetails {
  guestName: string;
  guestEmail: string;
  bookingReference: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  refundAmount: string;
  refundTimeline: string; // "5–7 business days"
  cancellationReason?: string;
}

export interface CheckinReminderDetails {
  guestName: string;
  guestEmail: string;
  bookingReference: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  checkInTime: string;    // "2:00 PM"
  mapLink?: string;
}

export interface FeedbackRequestDetails {
  guestName: string;
  guestEmail: string;
  bookingReference: string;
  hotelName: string;
  checkOut: string;
  feedbackLink: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── 1. Booking Confirmed ─────────────────────────────────────────────────────

export async function sendBookingConfirmationEmail(
  details: BookingEmailDetails
): Promise<EmailResult> {
  const qrSection = details.qrCodeUrl
    ? `${divider()}
       <div style="text-align:center;padding:8px 0 4px;">
         <p style="margin:0 0 12px;font-size:13px;color:#6B7280;letter-spacing:0.5px;">
           Present this QR code at the hotel reception
         </p>
         <img src="${details.qrCodeUrl}" alt="Booking QR Code"
              width="140" height="140"
              style="border:3px solid ${BRAND_GOLD};border-radius:4px;display:block;margin:0 auto;" />
         <p style="margin:10px 0 0;font-size:11px;color:#8FA3C3;letter-spacing:1px;">
           BOOKING REFERENCE: <strong style="color:${BRAND_NAVY};">${details.bookingReference}</strong>
         </p>
       </div>`
    : "";

  const guestCount =
    details.children > 0
      ? `${details.adults} Adults, ${details.children} Children`
      : `${details.adults} Adults`;

  const specialSection = details.specialRequests
    ? `${divider()}
       <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:1px;
                  color:#8FA3C3;text-transform:uppercase;">Special Requests</p>
       <p style="margin:0;font-size:14px;color:#4B5563;font-style:italic;">
         "${details.specialRequests}"
       </p>`
    : "";

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:28px;">
      ${goldBadge("Booking Confirmed")}
      <h2 style="margin:16px 0 6px;font-size:22px;font-weight:700;color:${BRAND_NAVY};
                  font-family:Georgia,'Times New Roman',serif;">
        Your stay is confirmed, ${details.guestName.split(" ")[0]}!
      </h2>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        We look forward to welcoming you to <strong>${details.hotelName}</strong>.<br/>
        Your booking details are below.
      </p>
    </div>

    <!-- Reference Banner -->
    <div style="background:#F8F5EE;border:1px solid #EEE8DC;border-left:4px solid ${BRAND_GOLD};
                border-radius:4px;padding:16px 20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#8FA3C3;
                 text-transform:uppercase;font-weight:600;">Booking Reference</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${BRAND_NAVY};letter-spacing:2px;">
        ${details.bookingReference}
      </p>
    </div>

    <!-- Booking Details Table -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${detailRow("Hotel", details.hotelName)}
      ${detailRow("Room", details.roomType)}
      ${detailRow("Check-in", details.checkIn)}
      ${detailRow("Check-out", details.checkOut)}
      ${detailRow("Duration", `${details.nights} Night${details.nights > 1 ? "s" : ""}`)}
      ${detailRow("Guests", guestCount)}
    </table>

    ${divider()}

    <!-- Amount Breakdown -->
    <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:1px;
               color:#8FA3C3;text-transform:uppercase;">Payment Summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${detailRow("Base Amount", details.baseAmount)}
      ${detailRow("GST", details.gstAmount)}
    </table>
    <div style="background:${BRAND_NAVY};border-radius:4px;padding:14px 16px;
                margin-top:12px;display:flex;justify-content:space-between;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:0;">
            <span style="font-size:13px;font-weight:600;color:#8FA3C3;letter-spacing:1px;">
              TOTAL PAID
            </span>
          </td>
          <td style="padding:0;text-align:right;">
            <span style="font-size:20px;font-weight:700;color:${BRAND_GOLD};">
              ${details.totalAmount}
            </span>
          </td>
        </tr>
      </table>
    </div>

    ${qrSection}
    ${specialSection}

    ${divider()}

    <!-- Hotel Address -->
    <div style="background:#F8F5EE;border-radius:4px;padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:1px;
                 color:#8FA3C3;text-transform:uppercase;">Hotel Address</p>
      <p style="margin:0;font-size:14px;color:${BRAND_NAVY};line-height:1.6;">
        ${details.hotelAddress}
      </p>
    </div>

    <p style="margin:28px 0 0;font-size:13px;color:#6B7280;line-height:1.7;text-align:center;">
      Need assistance? Contact us at
      <a href="mailto:reservations@southernsuites.in"
         style="color:${BRAND_GOLD};text-decoration:none;font-weight:600;">
        reservations@southernsuites.in
      </a>
      or call <strong>+91 1800 123 4567</strong> (toll-free).
    </p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [details.guestEmail],
      subject: `Booking Confirmed – ${details.bookingReference} | ${details.hotelName}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ─── 2. Booking Cancelled ─────────────────────────────────────────────────────

export async function sendBookingCancellationEmail(
  details: CancellationEmailDetails
): Promise<EmailResult> {
  const reasonSection = details.cancellationReason
    ? `${divider()}
       <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:1px;
                  color:#8FA3C3;text-transform:uppercase;">Cancellation Reason</p>
       <p style="margin:0;font-size:14px;color:#4B5563;">${details.cancellationReason}</p>`
    : "";

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#EF4444;color:#fff;
                  font-size:11px;font-weight:700;letter-spacing:2px;
                  text-transform:uppercase;padding:6px 18px;border-radius:2px;
                  margin-bottom:4px;">Booking Cancelled</div>
      <h2 style="margin:16px 0 6px;font-size:22px;font-weight:700;color:${BRAND_NAVY};
                  font-family:Georgia,'Times New Roman',serif;">
        Your booking has been cancelled
      </h2>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        We're sorry to see you go, <strong>${details.guestName.split(" ")[0]}</strong>.
        Your refund is being processed as per our policy.
      </p>
    </div>

    <!-- Reference Banner -->
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-left:4px solid #EF4444;
                border-radius:4px;padding:16px 20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#8FA3C3;
                 text-transform:uppercase;font-weight:600;">Cancelled Reference</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:${BRAND_NAVY};letter-spacing:2px;">
        ${details.bookingReference}
      </p>
    </div>

    <!-- Stay Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${detailRow("Hotel", details.hotelName)}
      ${detailRow("Room", details.roomType)}
      ${detailRow("Check-in", details.checkIn)}
      ${detailRow("Check-out", details.checkOut)}
      ${detailRow("Amount Paid", details.totalAmount)}
    </table>

    ${divider()}

    <!-- Refund Info -->
    <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:1px;
               color:#8FA3C3;text-transform:uppercase;">Refund Information</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:4px;padding:20px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:0 0 8px;">
            <span style="font-size:13px;color:#16A34A;font-weight:600;">Refund Amount</span>
          </td>
          <td style="padding:0 0 8px;text-align:right;">
            <span style="font-size:20px;font-weight:700;color:#16A34A;">
              ${details.refundAmount}
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0;">
            <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.6;">
              The refund will be credited to your original payment method within
              <strong>${details.refundTimeline}</strong>. If you have any queries,
              please quote your booking reference <strong>${details.bookingReference}</strong>.
            </p>
          </td>
        </tr>
      </table>
    </div>

    ${reasonSection}

    ${divider()}

    <div style="text-align:center;">
      <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
        We hope to welcome you at Southern Suites on another occasion.
      </p>
      <a href="https://southernsuites.in/hotels"
         style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;
                font-size:13px;font-weight:600;letter-spacing:1px;text-decoration:none;
                padding:12px 28px;border-radius:4px;border:2px solid ${BRAND_GOLD};">
        Browse Our Properties
      </a>
    </div>

    <p style="margin:28px 0 0;font-size:13px;color:#6B7280;line-height:1.7;text-align:center;">
      Questions about your refund?
      <a href="mailto:reservations@southernsuites.in"
         style="color:${BRAND_GOLD};text-decoration:none;font-weight:600;">
        reservations@southernsuites.in
      </a>
    </p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [details.guestEmail],
      subject: `Booking Cancelled – ${details.bookingReference} | Refund Update`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ─── 3. Check-in Reminder ─────────────────────────────────────────────────────

export async function sendCheckinReminderEmail(
  details: CheckinReminderDetails
): Promise<EmailResult> {
  const mapLink = details.mapLink
    ? `<a href="${details.mapLink}"
           style="display:inline-block;margin-top:12px;background:${BRAND_GOLD};
                  color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;
                  text-decoration:none;padding:9px 22px;border-radius:4px;">
         View on Map
       </a>`
    : "";

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:28px;">
      ${goldBadge("Check-in Tomorrow")}
      <h2 style="margin:16px 0 6px;font-size:22px;font-weight:700;color:${BRAND_NAVY};
                  font-family:Georgia,'Times New Roman',serif;">
        Your stay begins tomorrow, ${details.guestName.split(" ")[0]}!
      </h2>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        We're preparing your room at <strong>${details.hotelName}</strong> and
        can't wait to welcome you.
      </p>
    </div>

    <!-- Check-in Time Highlight -->
    <div style="background:${BRAND_NAVY};border-radius:6px;padding:20px;text-align:center;
                margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#8FA3C3;
                 text-transform:uppercase;font-weight:600;">Check-in Time</p>
      <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND_GOLD};letter-spacing:1px;">
        ${details.checkInTime}
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#8FA3C3;">
        Early check-in subject to availability. Please call ahead.
      </p>
    </div>

    <!-- Booking Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${detailRow("Booking Ref", details.bookingReference)}
      ${detailRow("Room", details.roomType)}
      ${detailRow("Check-in", details.checkIn)}
      ${detailRow("Check-out", details.checkOut)}
      ${detailRow("Duration", `${details.nights} Night${details.nights > 1 ? "s" : ""}`)}
    </table>

    ${divider()}

    <!-- Hotel Contact -->
    <div style="background:#F8F5EE;border-radius:4px;padding:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:1px;
                 color:#8FA3C3;text-transform:uppercase;">Hotel Address & Contact</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${BRAND_NAVY};">
        ${details.hotelName}
      </p>
      <p style="margin:0 0 10px;font-size:14px;color:#4B5563;line-height:1.6;">
        ${details.hotelAddress}
      </p>
      <p style="margin:0;font-size:14px;color:${BRAND_NAVY};font-weight:600;">
        📞 ${details.hotelPhone}
      </p>
      ${mapLink}
    </div>

    ${divider()}

    <!-- Tips -->
    <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:1px;
               color:#8FA3C3;text-transform:uppercase;">What to bring</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;">
          <span style="font-size:16px;">🪪</span>
        </td>
        <td style="padding:8px 0 8px 12px;font-size:13px;color:#4B5563;line-height:1.5;">
          A valid government-issued photo ID (Aadhaar, Passport, or Driving Licence)
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;">
          <span style="font-size:16px;">📱</span>
        </td>
        <td style="padding:8px 0 8px 12px;font-size:13px;color:#4B5563;line-height:1.5;">
          This email or your booking reference: <strong>${details.bookingReference}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;">
          <span style="font-size:16px;">💳</span>
        </td>
        <td style="padding:8px 0 8px 12px;font-size:13px;color:#4B5563;line-height:1.5;">
          A credit card for incidentals / security deposit at check-in
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:#6B7280;line-height:1.7;text-align:center;">
      We look forward to exceeding your expectations. Safe travels!<br/>
      <strong style="color:${BRAND_NAVY};">– The Southern Suites Team</strong>
    </p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [details.guestEmail],
      subject: `Your Stay Begins Tomorrow – ${details.hotelName} | ${details.bookingReference}`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ─── 4. Post-Stay Feedback Request ───────────────────────────────────────────

export async function sendFeedbackRequestEmail(
  details: FeedbackRequestDetails
): Promise<EmailResult> {
  const stars = `
    <span style="font-size:28px;letter-spacing:4px;">⭐⭐⭐⭐⭐</span>`;

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:28px;">
      ${goldBadge("We'd Love Your Feedback")}
      <h2 style="margin:16px 0 6px;font-size:22px;font-weight:700;color:${BRAND_NAVY};
                  font-family:Georgia,'Times New Roman',serif;">
        How was your stay, ${details.guestName.split(" ")[0]}?
      </h2>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        We hope your time at <strong>${details.hotelName}</strong> was exceptional.
        Your feedback helps us continue delivering world-class hospitality.
      </p>
    </div>

    <div style="background:#F8F5EE;border-radius:6px;padding:28px;text-align:center;
                margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:13px;color:#8FA3C3;letter-spacing:0.5px;">
        Rate your experience
      </p>
      ${stars}
      <p style="margin:16px 0 0;font-size:14px;color:#4B5563;line-height:1.6;">
        Booking Reference: <strong style="color:${BRAND_NAVY};">${details.bookingReference}</strong>
        &nbsp;·&nbsp; Check-out: ${details.checkOut}
      </p>
    </div>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${details.feedbackLink}"
         style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;
                font-size:14px;font-weight:600;letter-spacing:1px;text-decoration:none;
                padding:14px 36px;border-radius:4px;border:2px solid ${BRAND_GOLD};">
        Share Your Experience
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">
        Takes less than 2 minutes
      </p>
    </div>

    ${divider()}

    <!-- What we'd like to know -->
    <p style="margin:0 0 16px;font-size:11px;font-weight:600;letter-spacing:1px;
               color:#8FA3C3;text-transform:uppercase;">We'd love to hear about</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#4B5563;vertical-align:top;width:20px;">🛏</td>
        <td style="padding:6px 0 6px 10px;font-size:13px;color:#4B5563;">Room comfort and cleanliness</td>
        <td style="padding:6px 0;font-size:13px;color:#4B5563;vertical-align:top;width:20px;">🍽</td>
        <td style="padding:6px 0 6px 10px;font-size:13px;color:#4B5563;">Dining experience</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#4B5563;vertical-align:top;">👋</td>
        <td style="padding:6px 0 6px 10px;font-size:13px;color:#4B5563;">Staff friendliness</td>
        <td style="padding:6px 0;font-size:13px;color:#4B5563;vertical-align:top;">✨</td>
        <td style="padding:6px 0 6px 10px;font-size:13px;color:#4B5563;">Overall experience</td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.7;text-align:center;">
      Thank you for choosing Southern Suites. We hope to welcome you back soon.<br/>
      <strong style="color:${BRAND_NAVY};">– The Southern Suites Team</strong>
    </p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [details.guestEmail],
      subject: `How was your stay at ${details.hotelName}? We'd love to hear from you`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
