"use client";

import { useState, useEffect, useCallback } from "react";

interface DatePickerProps {
  hotelId: string;
  roomId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function DatePicker({
  hotelId,
  roomId,
  checkIn,
  checkOut,
  onDateChange,
}: DatePickerProps) {
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const minCheckOut = checkIn
    ? toDateString(new Date(checkIn.getTime() + 24 * 60 * 60 * 1000))
    : todayStr;

  useEffect(() => {
    if (!hotelId || !roomId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/bookings/availability?hotelId=${hotelId}&roomId=${roomId}`)
      .then((r) => r.json())
      .then((data: { blockedDates?: string[] }) => {
        if (!cancelled)
          setBlockedDates(new Set(data.blockedDates ?? []));
      })
      .catch(() => {
        if (!cancelled) setBlockedDates(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hotelId, roomId]);

  const handleCheckInChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) {
        onDateChange(null, null);
        return;
      }
      const d = parseLocalDate(val);
      // Reset checkout if it's now invalid
      if (checkOut && checkOut <= d) {
        onDateChange(d, null);
      } else {
        onDateChange(d, checkOut);
      }
    },
    [checkOut, onDateChange]
  );

  const handleCheckOutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) {
        onDateChange(checkIn, null);
        return;
      }
      onDateChange(checkIn, parseLocalDate(val));
    },
    [checkIn, onDateChange]
  );

  // Build comma-separated blocked list for display (native inputs don't support per-date disable)
  // We'll validate on change instead
  const isBlocked = (dateStr: string) => blockedDates.has(dateStr);

  const checkInStr = checkIn ? toDateString(checkIn) : "";
  const checkOutStr = checkOut ? toDateString(checkOut) : "";

  const checkInBlocked = checkInStr && isBlocked(checkInStr);
  const checkOutBlocked = checkOutStr && isBlocked(checkOutStr);

  return (
    <div className="space-y-1">
      {loading && (
        <p className="mb-2 text-xs text-[#94A3B8]">Loading availability…</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Check-In */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
            Check-in
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkInStr}
              min={todayStr}
              onChange={handleCheckInChange}
              className={`w-full rounded-lg border px-3 py-3 text-sm text-[#1B2A4A] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 ${
                checkInBlocked
                  ? "border-red-400 bg-red-50"
                  : "border-[#E2D9C5] bg-white"
              }`}
            />
          </div>
          {checkInBlocked && (
            <p className="mt-1 text-xs text-red-500">
              This date is not available. Please choose another.
            </p>
          )}
        </div>

        {/* Check-Out */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
            Check-out
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkOutStr}
              min={minCheckOut}
              disabled={!checkIn}
              onChange={handleCheckOutChange}
              className={`w-full rounded-lg border px-3 py-3 text-sm text-[#1B2A4A] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                checkOutBlocked
                  ? "border-red-400 bg-red-50"
                  : "border-[#E2D9C5] bg-white"
              }`}
            />
          </div>
          {checkOutBlocked && (
            <p className="mt-1 text-xs text-red-500">
              This date is not available. Please choose another.
            </p>
          )}
          {!checkIn && (
            <p className="mt-1 text-xs text-[#94A3B8]">
              Select check-in first
            </p>
          )}
        </div>
      </div>

      {/* Blocked dates legend */}
      {blockedDates.size > 0 && (
        <p className="pt-1 text-xs text-[#94A3B8]">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400 mr-1 align-middle" />
          Some dates are unavailable due to existing bookings.
        </p>
      )}

      {/* Duration summary */}
      {checkIn && checkOut && !checkInBlocked && !checkOutBlocked && (
        <p className="pt-1 text-xs font-medium text-[#C9A84C]">
          {Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          )}{" "}
          night stay selected
        </p>
      )}
    </div>
  );
}
