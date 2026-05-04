'use client';

import { useState } from 'react';
import { MoreVertical, ChevronDown, Loader2, CalendarX } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  booking_reference: string;
  guest: { name: string; phone: string };
  hotel: { name: string };
  room: { name: string; room_type: string };
  check_in_date: string;
  check_out_date: string;
  number_of_nights: number;
  final_amount: number;
  status: BookingStatus;
}

type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

interface BookingTableProps {
  bookings: Booking[];
  loading?: boolean;
  onStatusChange?: (id: string, status: BookingStatus) => Promise<void>;
  onViewDetails?: (booking: Booking) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed:   { label: 'Confirmed',   bg: 'bg-blue-100',   text: 'text-blue-800' },
  checked_in:  { label: 'Checked In',  bg: 'bg-green-100',  text: 'text-green-800' },
  checked_out: { label: 'Checked Out', bg: 'bg-gray-100',   text: 'text-gray-700' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-red-100',    text: 'text-red-800' },
  no_show:     { label: 'No Show',     bg: 'bg-orange-100', text: 'text-orange-800' },
};

const ACTIONS: Array<{ label: string; status?: BookingStatus; type?: 'view' | 'cancel' }> = [
  { label: '👁 View Details', type: 'view' },
  { label: '✅ Mark Confirmed',    status: 'confirmed' },
  { label: '🏨 Mark Checked In',   status: 'checked_in' },
  { label: '🚪 Mark Checked Out',  status: 'checked_out' },
  { label: '❌ Cancel Booking',    status: 'cancelled', type: 'cancel' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array(9).fill(0).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  booking, open, onToggle, onStatusChange, onViewDetails, changing
}: {
  booking: Booking;
  open: boolean;
  onToggle: () => void;
  onStatusChange?: (id: string, status: BookingStatus) => Promise<void>;
  onViewDetails?: (booking: Booking) => void;
  changing: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {changing ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1.5 overflow-hidden">
          {ACTIONS.map(action => (
            <button
              key={action.label}
              onClick={async () => {
                onToggle();
                if (action.type === 'view') {
                  onViewDetails?.(booking);
                } else if (action.status) {
                  await onStatusChange?.(booking.id, action.status);
                }
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                action.type === 'cancel' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingTable({
  bookings,
  loading = false,
  onStatusChange,
  onViewDetails,
}: BookingTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    if (!onStatusChange) return;
    setChangingId(id);
    try { await onStatusChange(id, status); }
    finally { setChangingId(null); }
  };

  const toggleMenu = (id: string) =>
    setOpenMenuId(prev => prev === id ? null : id);

  const COLS = ['Reference', 'Guest', 'Hotel', 'Room', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Status', 'Actions'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Overlay to close menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ backgroundColor: '#1B2A4A' }}>
              {COLS.map(col => (
                <th key={col} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <CalendarX size={24} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">No bookings found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map(booking => {
                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    {/* Reference */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-semibold text-sm" style={{ color: '#C9A84C' }}>
                        {booking.booking_reference}
                      </span>
                    </td>

                    {/* Guest */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900 whitespace-nowrap">{booking.guest.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{booking.guest.phone}</div>
                    </td>

                    {/* Hotel */}
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap max-w-[160px] truncate">
                      {booking.hotel.name}
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {booking.room.name}
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(booking.check_in_date)}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(booking.check_out_date)}</td>

                    {/* Nights */}
                    <td className="px-4 py-3.5 text-center text-gray-600 font-medium">
                      {booking.number_of_nights}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(booking.final_amount)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <ActionDropdown
                        booking={booking}
                        open={openMenuId === booking.id}
                        onToggle={() => toggleMenu(booking.id)}
                        onStatusChange={handleStatusChange}
                        onViewDetails={onViewDetails}
                        changing={changingId === booking.id}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
