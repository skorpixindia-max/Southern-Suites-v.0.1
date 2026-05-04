"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GuestCounter from "./GuestCounter";
import PriceSummary from "./PriceSummary";
import CouponInput from "./CouponInput";
import type { Room, Hotel } from "@/lib/types";

interface BookingFormProps {
  hotel: Hotel;
  room: Room;
  checkIn: Date;
  checkOut: Date;
}

interface GuestDetails {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const STEPS = ["Guest Details", "Payment"] as const;

export default function BookingForm({ hotel, room, checkIn, checkOut }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    fullName: "",
    phone: "",
    email: "",
    specialRequests: "",
  });
  const [errors, setErrors] = useState<Partial<GuestDetails>>({});

  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );

  const validate = (): boolean => {
    const newErrors: Partial<GuestDetails> = {};
    if (!guestDetails.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!guestDetails.phone.match(/^\d{10}$/))
      newErrors.phone = "Enter a valid 10-digit phone number";
    if (!guestDetails.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(1);
  };

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Create order server-side
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: hotel.id,
          roomId: room.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests: { adults, children },
          couponCode: couponCode || undefined,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Failed to create order");
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Payment gateway failed to load. Please try again.");

      setLoading(false);

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: hotel.name,
        description: `${room.name} · ${nights} night${nights > 1 ? "s" : ""}`,
        order_id: orderId,
        prefill: {
          name: guestDetails.fullName,
          email: guestDetails.email,
          contact: `+91${guestDetails.phone}`,
        },
        theme: { color: "#C9A84C" },
        handler: async (response: RazorpayResponse) => {
          setLoading(true);
          try {
            const bookingRes = await fetch("/api/bookings/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                hotelId: hotel.id,
                roomId: room.id,
                checkIn: checkIn.toISOString(),
                checkOut: checkOut.toISOString(),
                guests: { adults, children },
                guestDetails,
                couponCode: couponCode || undefined,
                payment: {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
              }),
            });

            if (!bookingRes.ok) {
              const err = await bookingRes.json();
              throw new Error(err.message || "Booking creation failed");
            }

            const { bookingId } = await bookingRes.json();
            router.push(`/confirmation/${bookingId}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled. Your booking was not confirmed.");
          },
        },
      });

      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [hotel, room, checkIn, checkOut, adults, children, guestDetails, couponCode, nights, router]);

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Step progress bar */}
      <div className="border-b border-[#E2D9C5] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      i <= step
                        ? "bg-[#C9A84C] text-white"
                        : "border-2 border-[#CBD5E1] text-[#94A3B8]"
                    }`}
                  >
                    {i < step ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`font-inter text-sm font-medium ${
                      i <= step ? "text-[#1B2A4A]" : "text-[#94A3B8]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-12 ${i < step ? "bg-[#C9A84C]" : "bg-[#E2D9C5]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main form column */}
          <div className="lg:col-span-2">
            {/* STEP 1 — Guest Details */}
            {step === 0 && (
              <div className="rounded-2xl border border-[#E2D9C5] bg-white p-6 shadow-sm">
                <h2
                  className="mb-6 font-playfair text-2xl font-bold text-[#1B2A4A]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Guest Details
                </h2>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="As on government ID"
                      value={guestDetails.fullName}
                      onChange={(e) =>
                        setGuestDetails((p) => ({ ...p, fullName: e.target.value }))
                      }
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#1B2A4A] placeholder-[#94A3B8] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 ${
                        errors.fullName ? "border-red-400" : "border-[#E2D9C5]"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center rounded-l-lg border border-r-0 border-[#E2D9C5] bg-[#F8F6F1] px-3 text-sm font-medium text-[#1B2A4A]">
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={guestDetails.phone}
                        onChange={(e) =>
                          setGuestDetails((p) => ({
                            ...p,
                            phone: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className={`flex-1 rounded-r-lg border px-4 py-3 text-sm text-[#1B2A4A] placeholder-[#94A3B8] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 ${
                          errors.phone ? "border-red-400" : "border-[#E2D9C5]"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Booking confirmation will be sent here"
                      value={guestDetails.email}
                      onChange={(e) =>
                        setGuestDetails((p) => ({ ...p, email: e.target.value }))
                      }
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-[#1B2A4A] placeholder-[#94A3B8] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 ${
                        errors.email ? "border-red-400" : "border-[#E2D9C5]"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
                      Guests
                    </label>
                    <GuestCounter
                      adults={adults}
                      children={children}
                      maxOccupancy={room.max_occupancy}
                      onAdultsChange={setAdults}
                      onChildrenChange={setChildren}
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">
                      Special Requests{" "}
                      <span className="text-xs font-normal text-[#94A3B8]">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Early check-in, dietary preferences, special occasions..."
                      value={guestDetails.specialRequests}
                      onChange={(e) =>
                        setGuestDetails((p) => ({ ...p, specialRequests: e.target.value }))
                      }
                      className="w-full resize-none rounded-lg border border-[#E2D9C5] px-4 py-3 text-sm text-[#1B2A4A] placeholder-[#94A3B8] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#B8943E] active:scale-[0.98]"
                >
                  Continue to Payment
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* STEP 2 — Payment */}
            {step === 1 && (
              <div className="rounded-2xl border border-[#E2D9C5] bg-white p-6 shadow-sm">
                <button
                  onClick={() => setStep(0)}
                  className="mb-5 flex items-center gap-1.5 text-sm font-medium text-[#1B2A4A] opacity-70 hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <h2
                  className="mb-6 font-playfair text-2xl font-bold text-[#1B2A4A]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Review &amp; Pay
                </h2>

                {/* Order Summary Card */}
                <div className="mb-6 rounded-xl border border-[#E2D9C5] bg-[#F8F6F1] p-5">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Hotel</span>
                      <span className="font-medium text-[#1B2A4A]">{hotel.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Room</span>
                      <span className="font-medium text-[#1B2A4A]">{room.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Check-in</span>
                      <span className="font-medium text-[#1B2A4A]">
                        {checkIn.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Check-out</span>
                      <span className="font-medium text-[#1B2A4A]">
                        {checkOut.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Duration</span>
                      <span className="font-medium text-[#1B2A4A]">
                        {nights} night{nights > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Guests</span>
                      <span className="font-medium text-[#1B2A4A]">
                        {adults} Adult{adults > 1 ? "s" : ""}
                        {children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <CouponInput
                    baseAmount={room.base_price * nights}
                    onApply={(discount, code) => {
                      setCouponDiscount(discount);
                      setCouponCode(code);
                    }}
                    onClear={() => {
                      setCouponDiscount(0);
                      setCouponCode("");
                    }}
                  />
                </div>

                {/* Price breakdown inside step 2 */}
                <div className="mb-6">
                  <PriceSummary
                    room={room}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    couponDiscount={couponDiscount}
                  />
                </div>

                {/* Security note */}
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#E2D9C5] bg-[#F8F6F1] px-4 py-3">
                  <svg
                    className="h-4 w-4 shrink-0 text-[#C9A84C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="text-xs text-[#64748B]">
                    100% secure payment via Razorpay. UPI, cards, netbanking accepted.
                  </p>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[#B8943E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar — Price Summary (Step 1 only) */}
          {step === 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* Hotel quick info */}
                <div className="mb-4 rounded-2xl border border-[#E2D9C5] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A]">
                      <svg
                        className="h-5 w-5 text-[#C9A84C]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="font-playfair font-semibold text-[#1B2A4A]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {hotel.name}
                      </p>
                      <p className="text-xs text-[#64748B]">{room.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span>
                      📅{" "}
                      {checkIn.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {" → "}
                      {checkOut.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span>·</span>
                    <span>🌙 {nights} night{nights > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <PriceSummary
                  room={room}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  couponDiscount={0}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
