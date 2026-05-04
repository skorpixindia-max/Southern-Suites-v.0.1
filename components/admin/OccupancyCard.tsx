'use client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OccupancyCardProps {
  hotelName: string;
  occupancyRate: number;       // 0–100
  bookedRooms: number;
  totalRooms: number;
  onClick?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOccupancyColor(rate: number): { bar: string; text: string; badge: string } {
  if (rate >= 70) return { bar: '#22c55e', text: 'text-green-700', badge: 'bg-green-100 text-green-700' };
  if (rate >= 40) return { bar: '#f59e0b', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' };
  return { bar: '#ef4444', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
}

function getOccupancyLabel(rate: number): string {
  if (rate >= 90) return 'Near Full';
  if (rate >= 70) return 'High';
  if (rate >= 40) return 'Moderate';
  if (rate > 0) return 'Low';
  return 'Empty';
}

// Truncate long hotel names consistently
function truncateName(name: string, max = 28): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + '…';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OccupancyCard({
  hotelName,
  occupancyRate,
  bookedRooms,
  totalRooms,
  onClick,
}: OccupancyCardProps) {
  const rate = Math.min(100, Math.max(0, Math.round(occupancyRate)));
  const colors = getOccupancyColor(rate);
  const label = getOccupancyLabel(rate);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''
      }`}
    >
      {/* Hotel name */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight" title={hotelName}>
          {truncateName(hotelName)}
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${colors.badge}`}>
          {label}
        </span>
      </div>

      {/* Percentage */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-bold tabular-nums leading-none ${colors.text}`}>
          {rate}
        </span>
        <span className={`text-xl font-bold mb-0.5 ${colors.text}`}>%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${rate}%`, backgroundColor: colors.bar }}
        />
      </div>

      {/* Room count */}
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-gray-700">{bookedRooms}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalRooms}</span> rooms booked
      </p>

      {/* Available count */}
      <p className="text-xs text-gray-400 mt-0.5">
        {totalRooms - bookedRooms} available
      </p>
    </div>
  );
}
