'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, X, Eye, EyeOff, Search, MoreVertical,
  CheckCircle, AlertCircle, Loader2, RefreshCw, KeyRound
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Hotel { id: string; name: string; city: string; }

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hotel_id: string | null;
  hotel?: { name: string; city: string };
  last_login_at: string | null;
  is_active: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  hotel_id: string;
}

interface ToastState { show: boolean; message: string; type: 'success' | 'error'; }

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'frontdesk', label: 'Front Desk' },
  { value: 'housekeeping', label: 'Housekeeping' },
];

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  frontdesk: 'bg-green-100 text-green-700',
  housekeeping: 'bg-teal-100 text-teal-700',
  maintenance: 'bg-gray-100 text-gray-700',
};

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

// ─── Slide-in Form ────────────────────────────────────────────────────────────

function ManagerForm({
  open, onClose, hotels, onSaved
}: {
  open: boolean; onClose: () => void; hotels: Hotel[]; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', password: '', role: 'frontdesk', hotel_id: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.password || !form.hotel_id) {
      setError('All fields are required'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      onSaved(); onClose();
      setForm({ name: '', email: '', phone: '', password: '', role: 'frontdesk', hotel_id: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create manager');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100" style={{ backgroundColor: '#1B2A4A' }}>
          <div>
            <h2 className="text-lg font-semibold text-white font-playfair">Add New Manager</h2>
            <p className="text-xs text-gray-400 mt-0.5">Create a staff account</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input className={inputCls} placeholder="Ravi Kumar" value={form.name} onChange={update('name')} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input className={inputCls} type="email" placeholder="ravi@southernsuites.in" value={form.email} onChange={update('email')} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input className={inputCls} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <div className="relative">
              <input
                className={inputCls + ' pr-10'}
                type={showPass ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={update('password')}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Role *</label>
            <select className={inputCls} value={form.role} onChange={update('role')}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Assigned Hotel *</label>
            <select className={inputCls} value={form.hotel_id} onChange={update('hotel_id')}>
              <option value="">Select hotel</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {saving ? 'Creating…' : 'Create Manager'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ show: true, message, type });

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/managers');
      const data = await res.json();
      setManagers(data.staff || data || []);
    } catch { showToast('Failed to load managers', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchManagers();
    fetch('/api/admin/hotels?minimal=true')
      .then(r => r.json())
      .then(d => setHotels(d.hotels || d || []))
      .catch(() => {});
  }, [fetchManagers]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/managers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      if (!res.ok) throw new Error();
      setManagers(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m));
      showToast(`Manager ${current ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch { showToast('Failed to update status', 'error'); }
    setActionMenuId(null);
  };

  const resetPassword = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/managers/${id}/reset-password`, { method: 'POST' });
      if (!res.ok) throw new Error();
      showToast('Password reset email sent', 'success');
    } catch { showToast('Failed to reset password', 'error'); }
    setActionMenuId(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  };

  const filtered = managers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="px-6 py-6 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Managers & Staff</h1>
            <p className="text-sm text-gray-500 mt-1">{managers.length} staff members across all hotels</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all hover:shadow-md"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            <UserPlus size={16} />
            Add New Manager
          </button>
        </div>

        <div className="p-6">
          {/* Search + Refresh */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white"
              />
            </div>
            <button onClick={fetchManagers} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 bg-white">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100" style={{ backgroundColor: '#1B2A4A' }}>
                    {['Name', 'Email', 'Role', 'Hotel', 'Last Login', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        {Array(7).fill(0).map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserPlus size={20} className="text-gray-300" />
                          </div>
                          <p className="text-sm font-medium">No staff found</p>
                          <p className="text-xs">Add your first manager to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: '#1B2A4A' }}>
                            {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{m.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-700'}`}>
                          {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{m.hotel?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDate(m.last_login_at)}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleActive(m.id, m.is_active)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${m.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${m.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === m.id ? null : m.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenuId === m.id && (
                          <div className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1">
                            <button
                              onClick={() => toggleActive(m.id, m.is_active)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              {m.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                            </button>
                            <button
                              onClick={() => resetPassword(m.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <KeyRound size={14} /> Reset Password
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ManagerForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hotels={hotels}
        onSaved={() => { fetchManagers(); showToast('Manager created successfully', 'success'); }}
      />

      <Toast toast={toast} onClose={() => setToast(t => ({ ...t, show: false }))} />

      {/* Close action menu on outside click */}
      {actionMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setActionMenuId(null)} />
      )}
    </>
  );
}
