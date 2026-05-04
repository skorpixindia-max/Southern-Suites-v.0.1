'use client';

import { useState } from 'react';
import { X, Phone, Mail, Edit2, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GuestBooking {
  id: string;
  booking_reference: string;
  hotel: { name: string };
  check_in_date: string;
  check_out_date: string;
  final_amount: number;
  status: string;
}

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyalty_tier: 'silver' | 'gold' | 'platinum';
  total_stays: number;
  total_spent: number;
  loyalty_points: number;
  is_blacklisted: boolean;
  recent_bookings?: GuestBooking[];
}

interface GuestProfileCardProps {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (guest: Guest) => void;
  onViewAllBookings?: (guestId: string) => void;
  onBlacklist?: (guestId: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  silver:   { label: 'Silver',   bg: 'bg-gray-100',    text: 'text-gray-700',    ring: '#9ca3af' },
  gold:     { label: 'Gold',     bg: 'bg-amber-100',   text: 'text-amber-700',   ring: '#C9A84C' },
  platinum: { label: 'Platinum', bg: 'bg-purple-100',  text: 'text-purple-700',  ring: '#a855f7' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: 'Pending',     bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed:   { label: 'Confirmed',   bg: 'bg-blue-100',   text: 'text-blue-800' },
  checked_in:  { label: 'Checked In',  bg: 'bg-green-100',  text: 'text-green-800' },
  checked_out: { label: 'Checked Out', bg: 'bg-gray-100',   text: 'text-gray-700' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-red-100',    text: 'text-red-800' },
  no_show:     { label: 'No Show',     bg: 'bg-orange-100', text: 'text-orange-800' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Blacklist Confirm Dialog ─────────────────────────────────────────────────

function BlacklistDialog({
  guestName, onConfirm, onCancel, loading
}: {
  guestName: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Blacklist Guest</h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to blacklist <span className="font-semibold text-gray-700">{guestName}</span>? They will no longer be able to make bookings.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Blacklist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuestProfileCard({
  guest, open, onClose, onEdit, onViewAllBookings, onBlacklist
}: GuestProfileCardProps) {
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [blacklisting, setBlacklisting] = useState(false);

  const handleBlacklist = async () => {
    if (!guest || !onBlacklist) return;
    setBlacklisting(true);
    try {
      await onBlacklist(guest.id);
      setShowBlacklistDialog(false);
      onClose();
    } finally { setBlacklisting(false); }
  };

  const tier = guest ? TIER_CONFIG[guest.loyalty_tier] : TIER_CONFIG.silver;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {!guest ? null : (
          <>
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-100" style={{ backgroundColor: '#1B2A4A' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ backgroundColor: tier.ring, color: '#1B2A4A' }}
                  >
                    {getInitials(guest.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{guest.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{guest.phone}</span>
                    </div>
                    {guest.email && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">{guest.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Tier badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.bg} ${tier.text}`}>
                  {guest.loyalty_tier === 'platinum' ? '💎' : guest.loyalty_tier === 'gold' ? '⭐' : '🥈'}
                  {tier.label} Member
                </span>
                {guest.is_blacklisted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    🚫 Blacklisted
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                {[
                  { label: 'Total Stays', value: guest.total_stays },
                  { label: 'Total Spent', value: formatCurrency(guest.total_spent) },
                  { label: 'Points Balance', value: guest.loyalty_points.toLocaleString('en-IN') },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 text-center border-r border-gray-100 last:border-r-0">
                    <div className="text-lg font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Bookings */}
              <div className="px-6 py-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Bookings</h3>
                {(!guest.recent_bookings || guest.recent_bookings.length === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {guest.recent_bookings.slice(0, 5).map(booking => {
                      const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                      return (
                        <div key={booking.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold" style={{ color: '#C9A84C' }}>
                                {booking.booking_reference}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 truncate">{booking.hotel.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
                            </p>
                          </div>
                          <div className="text-xs font-semibold text-gray-900 shrink-0 ml-2 mt-0.5">
                            {formatCurrency(booking.final_amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-5 border-t border-gray-100 space-y-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(guest)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 size={15} /> Edit Profile
                </button>
                <button
                  onClick={() => onViewAllBookings?.(guest.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  <ExternalLink size={15} /> All Bookings
                </button>
              </div>
              {!guest.is_blacklisted && (
                <button
                  onClick={() => setShowBlacklistDialog(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle size={15} /> Blacklist Guest
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Blacklist confirm dialog */}
      {showBlacklistDialog && guest && (
        <BlacklistDialog
          guestName={guest.name}
          onConfirm={handleBlacklist}
          onCancel={() => setShowBlacklistDialog(false)}
          loading={blacklisting}
        />
      )}
    </>
  );
}
