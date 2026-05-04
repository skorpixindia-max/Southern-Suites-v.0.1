"use client";

import { useRef } from "react";
import type { Booking } from "@/lib/types";

interface GSTInvoiceProps {
  booking: Booking;
}

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function GSTInvoice({ booking }: GSTInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.check_out).getTime() -
        new Date(booking.check_in).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const pricePerNight = booking.room_price ?? 0;
  const roomAmount = pricePerNight * nights;
  const couponDiscount = booking.coupon_discount ?? 0;
  const discountedBase = roomAmount - couponDiscount;
  const gstRate = pricePerNight >= 7500 ? 0.18 : 0.12;
  const gstAmount = discountedBase * gstRate;
  const total = discountedBase + gstAmount;

  const invoiceNumber = `INV-SS-${booking.reference?.replace("SS-", "") ?? booking.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const { generateInvoicePDF } = await import("@/lib/invoice/pdf");
    generateInvoicePDF(booking);
  };

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: fixed; inset: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action buttons — hidden on print */}
      <div className="no-print mb-6 flex gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl border border-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B8943E]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Invoice document */}
      <div
        id="invoice-print-area"
        ref={invoiceRef}
        className="bg-white font-sans"
        style={{ width: "210mm", minHeight: "297mm", padding: "20mm", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b-2 border-[#1B2A4A] pb-6">
          {/* Left: Hotel info */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1B2A4A]">
                <span className="text-lg font-bold text-[#C9A84C]">SS</span>
              </div>
              <div>
                <h2
                  className="font-playfair text-xl font-bold text-[#1B2A4A]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {booking.hotel_name ?? "Southern Suites"}
                </h2>
                <p className="text-xs text-[#64748B]">southernsuites.in</p>
              </div>
            </div>
            <div className="text-xs text-[#64748B] leading-relaxed">
              <p>{booking.hotel_address ?? "Andhra Pradesh, India"}</p>
              <p>GSTIN: {booking.hotel_gst_number ?? "37AAAAA0000A1Z5"}</p>
              <p>Tel: {booking.hotel_phone ?? "+91 00000 00000"}</p>
            </div>
          </div>

          {/* Right: Invoice metadata */}
          <div className="text-right">
            <div className="mb-2 inline-block rounded bg-[#1B2A4A] px-4 py-1.5">
              <p className="text-sm font-bold tracking-widest text-[#C9A84C]">TAX INVOICE</p>
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <p>
                <span className="font-medium text-[#1B2A4A]">Invoice No:</span>{" "}
                {invoiceNumber}
              </p>
              <p>
                <span className="font-medium text-[#1B2A4A]">Date:</span>{" "}
                {formatDate(booking.created_at ?? new Date().toISOString())}
              </p>
              <p>
                <span className="font-medium text-[#1B2A4A]">Booking Ref:</span>{" "}
                {booking.reference}
              </p>
            </div>
          </div>
        </div>

        {/* Guest details box */}
        <div className="mb-8 rounded-lg border border-[#E2D9C5] bg-[#F8F6F1] p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#1B2A4A]">
            Bill To
          </h3>
          <p className="text-sm font-semibold text-[#1B2A4A]">{booking.guest_name}</p>
          {booking.guest_address && (
            <p className="text-xs text-[#64748B]">{booking.guest_address}</p>
          )}
          <p className="text-xs text-[#64748B]">{booking.guest_email}</p>
          <p className="text-xs text-[#64748B]">+91 {booking.guest_phone}</p>
          {booking.guest_gst_number && (
            <p className="mt-1 text-xs font-medium text-[#1B2A4A]">
              GSTIN: {booking.guest_gst_number}
            </p>
          )}
        </div>

        {/* Line items table */}
        <table className="mb-8 w-full text-sm">
          <thead>
            <tr className="bg-[#1B2A4A] text-white">
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-center font-medium">Qty</th>
              <th className="px-4 py-2.5 text-right font-medium">Rate</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#E2D9C5]">
              <td className="px-4 py-3 text-[#1B2A4A]">
                {booking.room_name ?? "Room"}
                <span className="ml-2 text-xs text-[#64748B]">
                  ({formatDate(booking.check_in)} – {formatDate(booking.check_out)})
                </span>
              </td>
              <td className="px-4 py-3 text-center text-[#64748B]">
                {nights} night{nights > 1 ? "s" : ""}
              </td>
              <td className="px-4 py-3 text-right text-[#64748B]">
                {formatINR(pricePerNight)}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[#1B2A4A]">
                {formatINR(roomAmount)}
              </td>
            </tr>

            {couponDiscount > 0 && (
              <tr className="border-b border-[#E2D9C5]">
                <td className="px-4 py-3 text-emerald-600">
                  Coupon Discount
                  {booking.coupon_code ? ` (${booking.coupon_code})` : ""}
                </td>
                <td colSpan={2} />
                <td className="px-4 py-3 text-right font-medium text-emerald-600">
                  −{formatINR(couponDiscount)}
                </td>
              </tr>
            )}

            <tr className="border-b border-[#E2D9C5]">
              <td className="px-4 py-3 text-[#64748B]">
                GST ({(gstRate * 100).toFixed(0)}%)
              </td>
              <td colSpan={2} />
              <td className="px-4 py-3 text-right font-medium text-[#1B2A4A]">
                {formatINR(gstAmount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-[#1B2A4A]">
              <td
                colSpan={3}
                className="px-4 py-3 text-right font-bold text-white"
              >
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#C9A84C]">
                {formatINR(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment info */}
        <div className="mb-8 rounded-lg border border-[#E2D9C5] p-4 text-xs text-[#64748B]">
          <p>
            <span className="font-medium text-[#1B2A4A]">Payment Mode:</span>{" "}
            {booking.payment_method ?? "Online (Razorpay)"}
          </p>
          <p>
            <span className="font-medium text-[#1B2A4A]">Payment ID:</span>{" "}
            {booking.razorpay_payment_id ?? "—"}
          </p>
          <p>
            <span className="font-medium text-[#1B2A4A]">Status:</span>{" "}
            <span className="font-semibold text-emerald-600">Paid</span>
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E2D9C5] pt-6 text-center text-xs text-[#94A3B8]">
          <p className="font-medium text-[#1B2A4A]">
            Thank you for choosing Southern Suites.
          </p>
          <p>southernsuites.in · support@southernsuites.in</p>
          <p className="mt-2">
            This is a computer generated invoice and does not require a signature.
          </p>
        </div>
      </div>
    </>
  );
}
