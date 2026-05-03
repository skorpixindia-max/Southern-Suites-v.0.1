/**
 * lib/invoice/gst.ts
 *
 * Indian GST calculation for hotel room bookings.
 *
 * GST slabs (as per Notification No. 11/2017-CT(Rate)):
 *   < ₹2,500 per night  →  12% GST (6% CGST + 6% SGST)
 *   ≥ ₹2,500 per night  →  18% GST (9% CGST + 9% SGST)
 *
 * All amounts in paise (integer) internally; converted to rupees for output.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const GST_LOW_SLAB_THRESHOLD = 2500;   // ₹ per night
const GST_LOW_RATE = 0.12;             // 12%
const GST_HIGH_RATE = 0.18;            // 18%

// ─── Types ────────────────────────────────────────────────────────────────────

export type GSTRate = 12 | 18;

export interface GSTBreakdown {
  pricePerNight: number;        // ₹ — input room rate
  nights: number;
  baseAmount: number;           // ₹ — pricePerNight × nights
  gstRate: GSTRate;             // 12 or 18
  cgstRate: number;             // half of gstRate
  sgstRate: number;             // half of gstRate
  cgstAmount: number;           // ₹
  sgstAmount: number;           // ₹
  gstAmount: number;            // ₹ — cgst + sgst
  totalAmount: number;          // ₹ — base + gst
  /** Formatted strings for display */
  formatted: {
    pricePerNight: string;
    baseAmount: string;
    cgstAmount: string;
    sgstAmount: string;
    gstAmount: string;
    totalAmount: string;
  };
}

export interface InvoiceLineItem {
  description: string;
  hsn: string;               // HSN/SAC code for hotel services
  quantity: number;          // nights
  unitPrice: number;         // ₹ per night
  amount: number;            // ₹
}

export interface InvoiceGuest {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  gstNumber?: string;        // For corporate bookings
  companyName?: string;
}

export interface InvoiceHotel {
  name: string;
  address: string;
  gstNumber: string;
  sacCode: string;           // SAC code for accommodation services
  phone: string;
  email: string;
  panNumber?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;       // "25 Dec 2025"
  bookingReference: string;
  hotel: InvoiceHotel;
  guest: InvoiceGuest;
  lineItems: InvoiceLineItem[];
  gstBreakdown: GSTBreakdown;
  paymentMethod: string;
  paymentReference?: string; // Razorpay payment ID
  notes?: string;
}

// Matches the shape returned by your booking DB queries
export interface BookingForInvoice {
  id: string;
  booking_reference: string;
  check_in: string;          // ISO date "2025-12-25"
  check_out: string;
  nights: number;
  room_price_per_night: number;
  payment_id?: string;
  payment_method?: string;
  special_requests?: string;
  guests: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    gst_number?: string;
    company_name?: string;
  };
  rooms: {
    name: string;
    type: string;
  };
  hotels: {
    name: string;
    address: string;
    gst_number: string;
    phone: string;
    email: string;
    pan_number?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundToTwo(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function generateInvoiceNumber(bookingReference: string): string {
  const year = new Date().getFullYear();
  const seq = bookingReference.replace(/[^0-9]/g, "").slice(-5);
  return `INV/${year}/${seq}`;
}

// ─── Core: GST Calculation ────────────────────────────────────────────────────

/**
 * Calculate GST for a hotel room booking.
 *
 * @param pricePerNight  Room rate in ₹ (excluding GST)
 * @param nights         Number of nights
 */
export function calculateGST(
  pricePerNight: number,
  nights: number
): GSTBreakdown {
  if (pricePerNight < 0) throw new RangeError("pricePerNight cannot be negative");
  if (nights < 1) throw new RangeError("nights must be at least 1");

  const rate: GSTRate =
    pricePerNight < GST_LOW_SLAB_THRESHOLD ? 12 : 18;

  const baseAmount = roundToTwo(pricePerNight * nights);
  const gstAmount = roundToTwo(baseAmount * (rate / 100));
  const halfRate = rate / 2;
  const cgstAmount = roundToTwo(gstAmount / 2);
  const sgstAmount = roundToTwo(gstAmount - cgstAmount); // handles rounding remainder
  const totalAmount = roundToTwo(baseAmount + gstAmount);

  return {
    pricePerNight,
    nights,
    baseAmount,
    gstRate: rate,
    cgstRate: halfRate,
    sgstRate: halfRate,
    cgstAmount,
    sgstAmount,
    gstAmount,
    totalAmount,
    formatted: {
      pricePerNight: formatCurrencyINR(pricePerNight),
      baseAmount: formatCurrencyINR(baseAmount),
      cgstAmount: formatCurrencyINR(cgstAmount),
      sgstAmount: formatCurrencyINR(sgstAmount),
      gstAmount: formatCurrencyINR(gstAmount),
      totalAmount: formatCurrencyINR(totalAmount),
    },
  };
}

// ─── Core: Invoice Data Builder ───────────────────────────────────────────────

/**
 * Build a complete, structured invoice object from a booking record.
 * This is the data layer — pass the result to generateInvoicePDF().
 *
 * SAC code 996311 = "Room or unit accommodation services provided by Hotels,
 * INN, Guest House, Club etc." — standard for hotel accommodation in India.
 */
export function formatInvoiceData(booking: BookingForInvoice): InvoiceData {
  const gst = calculateGST(booking.room_price_per_night, booking.nights);

  const hotel: InvoiceHotel = {
    name: booking.hotels.name,
    address: booking.hotels.address,
    gstNumber: booking.hotels.gst_number,
    sacCode: "996311",
    phone: booking.hotels.phone,
    email: booking.hotels.email,
    panNumber: booking.hotels.pan_number,
  };

  const guest: InvoiceGuest = {
    name: booking.guests.name,
    email: booking.guests.email,
    phone: booking.guests.phone,
    address: booking.guests.address,
    gstNumber: booking.guests.gst_number,
    companyName: booking.guests.company_name,
  };

  const lineItems: InvoiceLineItem[] = [
    {
      description: `${booking.rooms.name} (${booking.rooms.type}) — ${formatDate(booking.check_in)} to ${formatDate(booking.check_out)}`,
      hsn: "996311",
      quantity: booking.nights,
      unitPrice: booking.room_price_per_night,
      amount: gst.baseAmount,
    },
  ];

  return {
    invoiceNumber: generateInvoiceNumber(booking.booking_reference),
    invoiceDate: formatDate(new Date().toISOString()),
    bookingReference: booking.booking_reference,
    hotel,
    guest,
    lineItems,
    gstBreakdown: gst,
    paymentMethod: booking.payment_method ?? "Online Payment",
    paymentReference: booking.payment_id,
    notes: booking.special_requests,
  };
}
