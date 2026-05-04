"use client";

interface GuestCounterProps {
  adults: number;
  children: number;
  maxOccupancy: number;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
}

interface CounterRowProps {
  label: string;
  subLabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}

function CounterRow({ label, subLabel, value, min, max, onChange, disabled }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#1B2A4A]">{label}</p>
        <p className="text-xs text-[#94A3B8]">{subLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={value <= min || disabled}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2D9C5] bg-white text-[#1B2A4A] transition hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-4 text-center text-sm font-semibold text-[#1B2A4A]">
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max || disabled}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2D9C5] bg-white text-[#1B2A4A] transition hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function GuestCounter({
  adults,
  children,
  maxOccupancy,
  onAdultsChange,
  onChildrenChange,
}: GuestCounterProps) {
  const totalGuests = adults + children;
  const overCapacity = totalGuests > maxOccupancy;

  const guestSummary = [
    `${adults} Adult${adults !== 1 ? "s" : ""}`,
    children > 0 ? `${children} Child${children !== 1 ? "ren" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-lg border border-[#E2D9C5] bg-white p-4">
      {/* Summary chip */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#64748B]">{guestSummary}</p>
        <span className="rounded-full bg-[#F8F6F1] px-2.5 py-0.5 text-xs font-medium text-[#64748B]">
          Max {maxOccupancy}
        </span>
      </div>

      <div className="space-y-4">
        <CounterRow
          label="Adults"
          subLabel="Age 13+"
          value={adults}
          min={1}
          max={6}
          onChange={onAdultsChange}
        />
        <div className="border-t border-[#F1EDE3]" />
        <CounterRow
          label="Children"
          subLabel="Age 2–12"
          value={children}
          min={0}
          max={4}
          onChange={onChildrenChange}
        />
      </div>

      {overCapacity && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xs text-amber-700">
            {totalGuests} guests exceeds this room&apos;s maximum occupancy of{" "}
            {maxOccupancy}. Please select a larger room or reduce guest count.
          </p>
        </div>
      )}
    </div>
  );
}
