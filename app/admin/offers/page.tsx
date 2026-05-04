"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_booking: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

const EMPTY: Omit<Coupon, "id" | "used_count"> = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  minimum_booking: 0,
  valid_from: "",
  valid_until: "",
  usage_limit: 100,
  is_active: true,
};

export default function AdminOffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    fetch("/api/admin/offers")
      .then((r) => r.json())
      .then((data: { coupons: Coupon[] }) => setCoupons(data.coupons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openNew = () => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, minimum_booking: c.minimum_booking, valid_from: c.valid_from, valid_until: c.valid_until, usage_limit: c.usage_limit, is_active: c.is_active });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Coupon code is required"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/offers/${editId}` : "/api/admin/offers";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed to save coupon");
      toast.success(editId ? "Coupon updated" : "Coupon created");
      setShowForm(false);
      fetchCoupons();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    await fetch(`/api/admin/offers/${coupon.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...coupon, is_active: !coupon.is_active }) });
    fetchCoupons();
  };

  const isExpired = (c: Coupon) => c.valid_until && new Date(c.valid_until) < new Date();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Offers & Coupons
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">{coupons.length} coupons total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B8943E]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Coupon
        </button>
      </div>

      <div className="rounded-2xl border border-[#E2D9C5] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2D9C5] bg-[#F8F6F1] text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Discount</th>
                <th className="px-6 py-3">Min Booking</th>
                <th className="px-6 py-3">Used</th>
                <th className="px-6 py-3">Expires</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F1EDE3]">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 animate-pulse rounded bg-[#E2D9C5]" /></td>
                    ))}
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-[#94A3B8]">No coupons yet</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[#F1EDE3] hover:bg-[#F8F6F1]">
                    <td className="px-6 py-4">
                      <span className="rounded bg-[#1B2A4A] px-2 py-0.5 font-mono text-xs font-bold text-[#C9A84C]">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1B2A4A]">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value.toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {c.minimum_booking > 0 ? `₹${c.minimum_booking.toLocaleString("en-IN")}` : "None"}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {c.used_count}/{c.usage_limit}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleActive(c)}>
                        {isExpired(c) ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Expired</span>
                        ) : c.is_active ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Inactive</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(c)} className="text-sm font-medium text-[#1B2A4A] hover:text-[#C9A84C]">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative z-10 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="border-b border-[#E2D9C5] px-6 py-5">
              <h2 className="font-playfair text-lg font-bold text-[#1B2A4A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {editId ? "Edit Coupon" : "New Coupon"}
              </h2>
            </div>
            <div className="flex-1 space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Coupon Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. DIWALI20" className="w-full rounded-lg border border-[#E2D9C5] px-4 py-2.5 font-mono text-sm uppercase tracking-widest outline-none focus:border-[#C9A84C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Discount Type</label>
                  <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percentage" | "fixed" }))} className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Value</label>
                  <input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))} className="w-full rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Minimum Booking Amount (₹)</label>
                <input type="number" value={form.minimum_booking} onChange={(e) => setForm((f) => ({ ...f, minimum_booking: Number(e.target.value) }))} className="w-full rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Usage Limit</label>
                <input type="number" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: Number(e.target.value) }))} className="w-full rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))} className={`relative h-6 w-11 rounded-full transition ${form.is_active ? "bg-[#C9A84C]" : "bg-[#E2D9C5]"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-sm text-[#1B2A4A]">{form.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-[#E2D9C5] px-6 py-5">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-[#E2D9C5] py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8F6F1]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-[#C9A84C] py-2.5 text-sm font-semibold text-white hover:bg-[#B8943E] disabled:opacity-50">
                {saving ? "Saving…" : "Save Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
