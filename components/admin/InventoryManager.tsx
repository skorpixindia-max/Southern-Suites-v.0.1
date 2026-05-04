'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Save, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryDay {
  date: string;          // YYYY-MM-DD
  total_rooms: number;
  booked_rooms: number;
  blocked_rooms: number;
  available_rooms: number;
  is_blocked: boolean;
  block_reason?: string;
  override_price?: number | null;
}

interface EditingCell {
  date: string;
  available: number;
  is_blocked: boolean;
}

interface InventoryManagerProps {
  hotelId: string;
  roomId: string;
  month?: number;   // 1–12
  year?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun → convert to Mon-based (0=Mon)
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS_OF_WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Cell color ───────────────────────────────────────────────────────────────

function getCellStyle(day: InventoryDay | undefined): string {
  if (!day) return 'bg-white';
  if (day.is_blocked) return 'bg-gray-100 text-gray-400';
  if (day.available_rooms === 0) return 'bg-red-50 border-red-200';
  if (day.available_rooms <= 2) return 'bg-orange-50 border-orange-200';
  return 'bg-green-50 border-green-200';
}

function getAvailableColor(available: number, is_blocked: boolean): string {
  if (is_blocked) return 'text-gray-400';
  if (available === 0) return 'text-red-600 font-bold';
  if (available <= 2) return 'text-orange-600 font-semibold';
  return 'text-green-700 font-semibold';
}

// ─── Inline Edit Panel ────────────────────────────────────────────────────────

function EditPanel({
  editing, onSave, onCancel, saving
}: {
  editing: EditingCell;
  onSave: (cell: EditingCell) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [cell, setCell] = useState(editing);

  return (
    <div className="absolute z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-56"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Edit {editing.date.slice(8)}</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Available Rooms</label>
          <input
            type="number"
            min="0"
            value={cell.available}
            onChange={e => setCell(c => ({ ...c, available: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setCell(c => ({ ...c, is_blocked: !c.is_blocked }))}
            className={`relative w-9 h-5 rounded-full transition-colors ${cell.is_blocked ? 'bg-gray-500' : 'bg-green-500'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cell.is_blocked ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs text-gray-600">{cell.is_blocked ? 'Blocked' : 'Available'}</span>
        </label>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(cell)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
          style={{ backgroundColor: '#C9A84C' }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventoryManager({ hotelId, roomId, month: initMonth, year: initYear }: InventoryManagerProps) {
  const now = new Date();
  const [month, setMonth] = useState(initMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(initYear ?? now.getFullYear());
  const [inventory, setInventory] = useState<Record<string, InventoryDay>>({});
  const [loading, setLoading] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!hotelId || !roomId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/inventory?hotel_id=${hotelId}&room_id=${roomId}&month=${year}-${pad(month)}`
      );
      const data = await res.json();
      const map: Record<string, InventoryDay> = {};
      (data.inventory || data || []).forEach((d: InventoryDay) => { map[d.date] = d; });
      setInventory(map);
    } catch {/* silent */}
    finally { setLoading(false); }
  }, [hotelId, roomId, month, year]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleSave = async (cell: EditingCell) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId, room_id: roomId, date: cell.date,
          available_rooms: cell.available, is_blocked: cell.is_blocked,
        }),
      });
      setInventory(prev => {
        const existing = prev[cell.date] || { date: cell.date, total_rooms: 0, booked_rooms: 0, blocked_rooms: 0, available_rooms: 0, is_blocked: false };
        return { ...prev, [cell.date]: { ...existing, available_rooms: cell.available, is_blocked: cell.is_blocked } };
      });
      setEditingDate(null);
    } catch {/* silent */}
    finally { setSaving(false); }
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
          {loading && <p className="text-xs text-amber-600 flex items-center justify-center gap-1 mt-0.5">
            <Loader2 size={10} className="animate-spin" /> Loading…
          </p>}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square border-b border-r border-gray-50 bg-gray-50/50" />;

          const dateStr = toDateStr(year, month, day);
          const inv = inventory[dateStr];
          const isToday = dateStr === today;
          const isEditing = editingDate === dateStr;
          const isPast = dateStr < today;

          return (
            <div
              key={idx}
              className={`relative aspect-square border-b border-r border-gray-100 transition-all cursor-pointer ${getCellStyle(inv)} ${isToday ? 'ring-2 ring-inset ring-amber-400' : ''} ${isPast ? 'opacity-60' : 'hover:shadow-sm'}`}
              onClick={() => !isPast && setEditingDate(isEditing ? null : dateStr)}
            >
              {/* Date number */}
              <span className={`absolute top-1.5 left-2 text-xs font-semibold ${isToday ? 'text-amber-600' : 'text-gray-600'}`}>
                {day}
              </span>

              {/* Available count */}
              {inv && (
                <div className="flex items-center justify-center h-full">
                  {inv.is_blocked ? (
                    <span className="text-lg text-gray-300">✕</span>
                  ) : (
                    <span className={`text-xl ${getAvailableColor(inv.available_rooms, inv.is_blocked)}`}>
                      {inv.available_rooms}
                    </span>
                  )}
                </div>
              )}

              {/* Edit panel */}
              {isEditing && (
                <EditPanel
                  editing={{
                    date: dateStr,
                    available: inv?.available_rooms ?? 0,
                    is_blocked: inv?.is_blocked ?? false,
                  }}
                  onSave={handleSave}
                  onCancel={() => setEditingDate(null)}
                  saving={saving}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-4">
        {[
          { color: 'bg-green-100', label: '3+ available' },
          { color: 'bg-orange-100', label: '1–2 available' },
          { color: 'bg-red-100', label: '0 available' },
          { color: 'bg-gray-100', label: 'Blocked' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${color} border border-gray-200`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
