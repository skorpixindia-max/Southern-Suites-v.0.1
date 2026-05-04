'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Hotel { id: string; name: string; city: string; }

interface HousekeepingRoom {
  id: string;
  room_number: string;
  room_id: string;
  hotel_id: string;
  status: RoomStatus;
  assigned_to: string | null;
  notes: string | null;
  staff?: { id: string; name: string };
}

interface StaffMember { id: string; name: string; role: string; }

type RoomStatus = 'ready' | 'cleaning' | 'dirty' | 'maintenance' | 'do_not_disturb' | 'inspecting';

interface ToastState { show: boolean; message: string; type: 'success' | 'error'; }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; text: string; dot: string }> = {
  ready:           { label: 'Ready',           bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  cleaning:        { label: 'Cleaning',        bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  dirty:           { label: 'Dirty',           bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  maintenance:     { label: 'Maintenance',     bg: 'bg-gray-200',   text: 'text-gray-700',   dot: 'bg-gray-500' },
  do_not_disturb:  { label: 'Do Not Disturb',  bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  inspecting:      { label: 'Inspecting',      bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as RoomStatus[];

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (toast.show) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }
  }, [toast.show, onClose]);
  if (!toast.show) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${
      toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {toast.type === 'success' ? <CheckCircle size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

// ─── Room Cell ────────────────────────────────────────────────────────────────

function RoomCell({ room, onClick }: { room: HousekeepingRoom; onClick: () => void }) {
  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.dirty;
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 hover:shadow-md ${cfg.bg} border-transparent hover:border-current`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg font-bold text-gray-900">{room.room_number}</span>
        <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1 ${cfg.dot}`} />
      </div>
      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
      {room.staff && (
        <p className="text-xs text-gray-500 mt-1 truncate">{room.staff.name}</p>
      )}
    </button>
  );
}

// ─── Update Modal ─────────────────────────────────────────────────────────────

function RoomModal({
  room, staff, onClose, onSaved
}: {
  room: HousekeepingRoom; staff: StaffMember[]; onClose: () => void; onSaved: (updated: HousekeepingRoom) => void;
}) {
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [assignedTo, setAssignedTo] = useState(room.assigned_to || '');
  const [notes, setNotes] = useState(room.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/housekeeping/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assigned_to: assignedTo || null, notes }),
      });
      if (!res.ok) throw new Error();
      onSaved({ ...room, status, assigned_to: assignedTo || null, notes });
    } catch { setError('Failed to update room. Please try again.'); }
    finally { setSaving(false); }
  };

  const selectCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ backgroundColor: '#1B2A4A' }}>
          <div>
            <h2 className="text-lg font-semibold text-white font-playfair">Room {room.room_number}</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs mt-1 ${STATUS_CONFIG[room.status]?.text || 'text-gray-300'}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[room.status]?.dot || 'bg-gray-400'}`} />
              Current: {STATUS_CONFIG[room.status]?.label || room.status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Update Status</label>
            <select className={selectCls} value={status} onChange={e => setStatus(e.target.value as RoomStatus)}>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Assign Staff</label>
            <select className={selectCls} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {staff.filter(s => ['housekeeping', 'maintenance'].includes(s.role)).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
              rows={3}
              placeholder="Any special notes about this room…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HousekeepingPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HousekeepingRoom | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ show: true, message, type });

  // Load hotels
  useEffect(() => {
    fetch('/api/admin/hotels?minimal=true')
      .then(r => r.json())
      .then(d => {
        const list = d.hotels || d || [];
        setHotels(list);
        if (list.length > 0) setSelectedHotel(list[0].id);
      })
      .catch(() => {});
    fetch('/api/admin/staff?minimal=true')
      .then(r => r.json())
      .then(d => setStaff(d.staff || d || []))
      .catch(() => {});
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!selectedHotel) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/housekeeping?hotel_id=${selectedHotel}`);
      const data = await res.json();
      setRooms(data.rooms || data || []);
      setLastRefresh(new Date());
    } catch { showToast('Failed to load rooms', 'error'); }
    finally { setLoading(false); }
  }, [selectedHotel]);

  useEffect(() => {
    fetchRooms();
    // Auto-refresh every 60 seconds
    timerRef.current = setInterval(fetchRooms, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchRooms]);

  // Group rooms by status for summary
  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = rooms.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleRoomSaved = (updated: HousekeepingRoom) => {
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelectedRoom(null);
    showToast('Room status updated', 'success');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="px-6 py-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-playfair">Housekeeping</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')} · Auto-refreshes every 60s
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Hotel Selector */}
              <select
                value={selectedHotel}
                onChange={e => setSelectedHotel(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white text-gray-900 font-medium"
              >
                {hotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <button
                onClick={fetchRooms}
                disabled={loading}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 bg-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Summary */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ALL_STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className={`${cfg.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${cfg.text}`}>{statusCounts[s] || 0}</div>
                  <div className={`text-xs font-medium ${cfg.text} mt-0.5`}>{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* Room Grid */}
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {Array(30).fill(0).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛏️</span>
              </div>
              <p className="text-gray-500 font-medium">No rooms found for this hotel</p>
              <p className="text-xs text-gray-400 mt-1">Rooms will appear here once housekeeping records are created</p>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">{rooms.length} Rooms · Click any room to update status</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {rooms.map(room => (
                  <RoomCell key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {ALL_STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-gray-500">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room Update Modal */}
      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          staff={staff}
          onClose={() => setSelectedRoom(null)}
          onSaved={handleRoomSaved}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(t => ({ ...t, show: false }))} />
    </>
  );
}
