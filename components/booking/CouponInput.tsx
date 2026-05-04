"use client";

import { useState } from "react";

interface CouponInputProps {
  baseAmount: number;
  onApply: (discount: number, code: string) => void;
  onClear: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

export default function CouponInput({ baseAmount, onApply, onClear }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(
        `/api/offers/validate?code=${encodeURIComponent(trimmed)}&amount=${baseAmount}`
      );
      const data = await res.json() as {
        valid?: boolean;
        discount?: number;
        message?: string;
      };

      if (!res.ok || !data.valid) {
        setStatus("error");
        setMessage(data.message || "Invalid or expired coupon");
        return;
      }

      const discountAmt = data.discount ?? 0;
      setStatus("success");
      setAppliedCode(trimmed);
      setDiscount(discountAmt);
      setMessage(
        `${trimmed} applied — ₹${discountAmt.toLocaleString("en-IN")} off`
      );
      onApply(discountAmt, trimmed);
    } catch {
      setStatus("error");
      setMessage("Could not validate coupon. Please try again.");
    }
  };

  const handleClear = () => {
    setCode("");
    setStatus("idle");
    setMessage("");
    setAppliedCode("");
    setDiscount(0);
    onClear();
  };

  const isApplied = status === "success";

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
        Coupon Code
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          disabled={isApplied}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && !isApplied && handleApply()}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-mono tracking-widest outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 disabled:bg-[#F8F6F1] disabled:text-[#64748B] ${
            status === "error"
              ? "border-red-400"
              : status === "success"
              ? "border-emerald-400"
              : "border-[#E2D9C5]"
          }`}
        />
        {isApplied ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm font-medium text-[#64748B] transition hover:border-red-300 hover:text-red-500"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            disabled={!code.trim() || status === "loading"}
            onClick={handleApply}
            className="rounded-lg bg-[#1B2A4A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243660] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Apply"
            )}
          </button>
        )}
      </div>

      {message && (
        <p
          className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
            status === "success" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {status === "success" ? (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {message}
        </p>
      )}
    </div>
  );
}
