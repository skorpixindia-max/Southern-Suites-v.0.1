"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PricingRule {
  id: string;
  name: string;
  type: "date_range" | "day_of_week" | "peak_season";
  start_date?: string;
  end_date?: string;
  days_of_week?: number[];
  adjustment_type: "percentage" | "fixed";
  adjustment_value: number;
  is_active: boolean;
  created_at: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_RULE: Omit<PricingRule, "id" | "created_at"> = {
  name: "",
  type: "date_range",
  start_date: "",
  end_date: "",
  days_of_week: [],
  adjustment_type: "percentage",
  adjustment_value: 0,
  is_active: true,
};

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_RULE });
  const [saving, setSaving] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((data: { rules: PricingRule[] }) => setRules(data.rules ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const openNew = () => {
    setForm({ ...EMPTY_RULE });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (rule: PricingRule) => {
    setForm({
      name: rule.name,
      type: rule.type,
      start_date: rule.start_date ?? "",
      end_date: rule.end_date ?? "",
      days_of_week: rule.days_of_week ?? [],
      adjustment_type: rule.adjustment_type,
      adjustment_value: rule.adjustment_value,
      is_active: rule.is_active,
    });
    setEditId(rule.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Rule name is required"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/pricing/${editId}` : "/api/admin/pricing";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save rule");
      toast.success(editId ? "Rule updated" : "Rule created");
      setShowForm(false);
      fetchRules();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error saving rule");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: PricingRule) => {
    await fetch(`/api/admin/pricing/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, is_active: !rule.is_active }),
    });
    fetchRules();
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week?.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...(f.days_of_week ?? []), day],
    }));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pricing Rules
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Dynamic pricing for peak seasons, weekends and special dates</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B8943E]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      {/* Rules table */}
      <div className="rounded-2xl border border-[#E2D9C5] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2D9C5] bg-[#F8F6F1] text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6 py-3">Rule Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Dates / Days</th>
                <th className="px-6 py-3">Adjustment</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F1EDE3]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 animate-pulse rounded bg-[#E2D9C5]" /></td>
                    ))}
                  </tr>
                ))
              ) : rules.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-[#94A3B8]">No pricing rules yet</td></tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-[#F1EDE3] hover:bg-[#F8F6F1]">
                    <td className="px-6 py-4 font-medium text-[#1B2A4A]">{rule.name}</td>
                    <td className="px-6 py-4 capitalize text-[#64748B]">{rule.type.replace("_", " ")}</td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {rule.type === "day_of_week"
                        ? (rule.days_of_week ?? []).map((d) => DAY_NAMES[d]).join(", ")
                        : rule.start_date && rule.end_date
                        ? `${rule.start_date} → ${rule.end_date}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${rule.adjustment_value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {rule.adjustment_value >= 0 ? "+" : ""}{rule.adjustment_value}
                        {rule.adjustment_type === "percentage" ? "%" : " ₹"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleActive(rule)}>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${rule.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEdit(rule)}
                        className="text-sm font-medium text-[#1B2A4A] hover:text-[#C9A84C]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative z-10 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="border-b border-[#E2D9C5] px-6 py-5">
              <h2 className="font-playfair text-lg font-bold text-[#1B2A4A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {editId ? "Edit Rule" : "New Pricing Rule"}
              </h2>
            </div>
            <div className="flex-1 space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Rule Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Diwali Premium, Weekend Surge"
                  className="w-full rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PricingRule["type"] }))}
                  className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]"
                >
                  <option value="date_range">Date Range</option>
                  <option value="day_of_week">Day of Week</option>
                  <option value="peak_season">Peak Season</option>
                </select>
              </div>

              {form.type !== "day_of_week" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Start Date</label>
                    <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">End Date</label>
                    <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className="w-full rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]" />
                  </div>
                </div>
              )}

              {form.type === "day_of_week" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#1B2A4A]">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${(form.days_of_week ?? []).includes(i) ? "bg-[#1B2A4A] text-white" : "border border-[#E2D9C5] text-[#64748B] hover:border-[#C9A84C]"}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1B2A4A]">Adjustment</label>
                <div className="flex gap-2">
                  <select
                    value={form.adjustment_type}
                    onChange={(e) => setForm((f) => ({ ...f, adjustment_type: e.target.value as "percentage" | "fixed" }))}
                    className="rounded-lg border border-[#E2D9C5] px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                  <input
                    type="number"
                    value={form.adjustment_value}
                    onChange={(e) => setForm((f) => ({ ...f, adjustment_value: Number(e.target.value) }))}
                    className="flex-1 rounded-lg border border-[#E2D9C5] px-4 py-2.5 text-sm outline-none focus:border-[#C9A84C]"
                    placeholder="e.g. 20"
                  />
                </div>
                <p className="mt-1 text-xs text-[#94A3B8]">Use positive value to increase price, negative to decrease</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative h-6 w-11 rounded-full transition ${form.is_active ? "bg-[#C9A84C]" : "bg-[#E2D9C5]"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-sm text-[#1B2A4A]">{form.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="flex gap-3 border-t border-[#E2D9C5] px-6 py-5">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-[#E2D9C5] py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8F6F1]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-[#C9A84C] py-2.5 text-sm font-semibold text-white hover:bg-[#B8943E] disabled:opacity-50">
                {saving ? "Saving…" : "Save Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
