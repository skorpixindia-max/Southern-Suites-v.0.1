"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/types";

interface ConfirmationClientProps {
  bookingId: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-[#E2D9C5] ${className ?? ""}`} />
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function buildICS(booking: Booking): string {
  const start = new Date(booking.check_in);
  const end = new Date(booking.check_out);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Southern Suites//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dt(start)}`,
    `DTEND;VALUE=DATE:${dt(end)}`,
    `SUMMARY:Stay at ${booking.hotel_name ?? "Southern Suites"}`,
    `DESCRIPTION:Booking ref: ${booking.reference}. Room: ${booking.room_name ?? ""}`,
    `LOCATION:${booking.hotel_name ?? "Southern Suites"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(booking: Booking) {
  const blob = new Blob([buildICS(booking)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `southern-suites-${booking.reference}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ConfirmationClient({ bookingId }: ConfirmationClientProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Booking not found");
        return r.json() as Promise<Booking>;
      })
      .then(setBooking)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const whatsappLink = booking
    ? `https://wa.me/?text=${encodeURIComponent(
        `I just booked a stay at ${booking.hotel_name ?? "Southern Suites"}! 🏨\nRef: ${booking.reference}\nCheck-in: ${formatDate(booking.check_in)} | Check-out: ${formatDate(booking.check_out)}`
      )}`
    : "#";

  return (
    <div className="min-h-screen bg-[#F8F6F1] px-4 py-12">
      <div className="mx-auto max-w-xl">
        {loading && (
          <div className="rounded-2xl border border-[#E2D9C5] bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {booking && !loading && (
          <div className="overflow-hidden rounded-2xl border border-[#E2D9C5] bg-white shadow-sm">
            {/* Success header */}
            <div className="bg-[#1B2A4A] px-8 py-10 text-center">
              {/* Animated checkmark */}
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ animation: "checkmark 0.5s ease-out" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1
                className="mb-1 font-playfair text-2xl font-bold text-[#C9A84C]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Booking Confirmed!
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Your stay has been reserved successfully
              </p>
              <div className="mt-4 inline-block rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-5 py-2">
                <p className="font-mono text-lg font-bold tracking-widest text-[#C9A84C]">
                  {booking.reference}
                </p>
              </div>
            </div>

            {/* Booking details */}
            <div className="px-8 py-6">
              <div className="space-y-3 text-sm">
                {[
                  { label: "Hotel", value: booking.hotel_name ?? "—" },
                  { label: "Room", value: booking.room_name ?? "—" },
                  {
                    label: "Check-in",
                    value: `${formatDate(booking.check_in)} (12:00 PM)`,
                  },
                  {
                    label: "Check-out",
                    value: `${formatDate(booking.check_out)} (11:00 AM)`,
                  },
                  {
                    label: "Guests",
                    value: `${booking.adults ?? 1} Adult${(booking.adults ?? 1) > 1 ? "s" : ""}${
                      booking.children ? `, ${booking.children} Child${booking.children > 1 ? "ren" : ""}` : ""
                    }`,
                  },
                  {
                    label: "Amount Paid",
                    value: formatINR(booking.total_amount),
                    highlight: true,
                  },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between border-b border-[#F1EDE3] pb-3 last:border-0 last:pb-0">
                    <span className="text-[#64748B]">{label}</span>
                    <span
                      className={`font-medium ${
                        highlight ? "font-bold text-[#1B2A4A]" : "text-[#1B2A4A]"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 border-t border-[#E2D9C5] px-8 py-6">
              <a
                href={`/api/bookings/${bookingId}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#1B2A4A] px-4 py-3 text-sm font-medium text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download Invoice
              </a>

              <button
                type="button"
                onClick={() => downloadICS(booking)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#1B2A4A] px-4 py-3 text-sm font-medium text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Calendar
              </button>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.837L.057 23.215a.75.75 0 00.918.918l5.379-1.453A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.696 9.696 0 01-4.95-1.354l-.356-.213-3.695.998.978-3.588-.232-.37A9.696 9.696 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
                Share on WhatsApp
              </a>

              <Link
                href="/hotels"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#B8943E]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Book Another Stay
              </Link>
            </div>

            {/* Footer note */}
            <div className="border-t border-[#E2D9C5] bg-[#F8F6F1] px-8 py-4 text-center">
              <p className="text-xs text-[#64748B]">
                📧 Confirmation sent to your email and WhatsApp
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes checkmark {
          from { stroke-dashoffset: 100; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
