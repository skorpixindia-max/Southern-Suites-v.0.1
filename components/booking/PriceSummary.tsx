"use client";

import type { Room } from "@/lib/types";

interface PriceSummaryProps {
  room: Room;
  checkIn: Date;
  checkOut: Date;
  couponDiscount: number;
}

function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function getDayType(date: Date): "weekend" | "weekday" {
  const day = date.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

function getEffectiveNightlyRate(room: Room, checkIn: Date, checkOut: Date): number {
  let total = 0;
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + i);
    const isWeekend = getDayType(d) === "weekend";
    total += isWeekend && room.weekend_price ? room.weekend_price : room.base_price;
  }
  return total / Math.max(nights, 1);
}

const GST_RATE = 0.12; // 12% GST for hotels with tariff < ₹7500; use 18% above

export default function PriceSummary({
  room,
  checkIn,
  checkOut,
  couponDiscount,
}: PriceSummaryProps) {
  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );

  const avgRate = getEffectiveNightlyRate(room, checkIn, checkOut);
  const roomTotal = avgRate * nights;
  const discountedBase = Math.max(0, roomTotal - couponDiscount);
  const gstRate = avgRate >= 7500 ? 0.18 : 0.12;
  const gstAmount = discountedBase * gstRate;
  const grandTotal = discountedBase + gstAmount;

  return (
    <div className="rounded-2xl border border-[#E2D9C5] bg-white p-5 shadow-sm">
      <h3
        className="mb-4 font-playfair text-base font-bold text-[#1B2A4A]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Price Summary
      </h3>

      <div className="space-y-2.5 text-sm">
        {/* Room name */}
        <div className="flex justify-between">
          <span className="text-[#64748B]">{room.name}</span>
        </div>

        {/* Rate × nights */}
        <div className="flex justify-between">
          <span className="text-[#64748B]">
            {formatINR(avgRate)} × {nights} night{nights > 1 ? "s" : ""}
          </span>
          <span className="font-medium text-[#1B2A4A]">{formatINR(roomTotal)}</span>
        </div>

        {/* Coupon discount */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Coupon discount</span>
            <span className="font-medium">−{formatINR(couponDiscount)}</span>
          </div>
        )}

        {/* GST */}
        <div className="flex justify-between">
          <span className="text-[#64748B]">GST ({(gstRate * 100).toFixed(0)}%)</span>
          <span className="font-medium text-[#1B2A4A]">{formatINR(gstAmount)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-[#E2D9C5] pt-2" />

        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold text-[#1B2A4A]">Total</span>
          <span
            className="text-xl font-bold text-[#C9A84C]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {formatINR(grandTotal)}
          </span>
        </div>

        <p className="text-xs text-[#94A3B8]">Inclusive of all taxes</p>
      </div>
    </div>
  );
}
