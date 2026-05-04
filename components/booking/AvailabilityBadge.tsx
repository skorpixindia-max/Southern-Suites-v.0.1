interface AvailabilityBadgeProps {
  availableCount: number;
}

export default function AvailabilityBadge({ availableCount }: AvailabilityBadgeProps) {
  if (availableCount >= 4) return null;

  if (availableCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Sold Out
      </span>
    );
  }

  if (availableCount === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        Only 1 room left
      </span>
    );
  }

  // 2 or 3
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
      Only {availableCount} rooms left
    </span>
  );
}
