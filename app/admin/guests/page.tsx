"use client";

import { useState, useEffect, useCallback } from "react";
import GuestProfileCard from "@/components/admin/GuestProfileCard";
import type { Guest } from "@/lib/types";

interface GuestsResponse {
  guests: Guest[];
  total: number;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 20;

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(debouncedSearch && { search: debouncedSearch }),
    });
    try {
      const res = await fetch(`/api/admin/guests?${params}`);
      const data: GuestsResponse = await res.json();
      setGuests(data.guests ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="font-playfair text-2xl font-bold text-[#1B2A4A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Guests
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">{total} registered guests</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E2D9C5] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E2D9C5] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2D9C5] bg-[#F8F6F1] text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-center">Stays</th>
                <th className="px-6 py-3 text-right">Total Spent</th>
                <th className="px-6 py-3 text-center">Tier</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F1EDE3]">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-[#E2D9C5]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#94A3B8]">
                    No guests found
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className="cursor-pointer border-b border-[#F1EDE3] transition hover:bg-[#F8F6F1]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-sm font-bold text-[#C9A84C]">
                          {guest.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-[#1B2A4A]">{guest.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{guest.phone}</td>
                    <td className="px-6 py-4 text-[#64748B]">{guest.email}</td>
                    <td className="px-6 py-4 text-center font-medium text-[#1B2A4A]">
                      {guest.total_stays ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#1B2A4A]">
                      ₹{(guest.total_spent ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {guest.loyalty_tier && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_COLORS[guest.loyalty_tier] ?? "bg-gray-100 text-gray-700"}`}>
                          {guest.loyalty_tier}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">
                      {guest.created_at
                        ? new Date(guest.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2D9C5] px-6 py-4">
            <p className="text-sm text-[#64748B]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#E2D9C5] px-3 py-1.5 text-sm font-medium text-[#1B2A4A] hover:bg-[#F8F6F1] disabled:opacity-40"
              >← Prev</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#E2D9C5] px-3 py-1.5 text-sm font-medium text-[#1B2A4A] hover:bg-[#F8F6F1] disabled:opacity-40"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile drawer */}
      {selectedGuest && (
        <GuestProfileCard
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
          onUpdate={fetchGuests}
        />
      )}
    </div>
  );
}
