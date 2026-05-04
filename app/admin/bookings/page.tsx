"use client";

import { useState, useEffect, useCallback } from "react";
import BookingTable from "@/components/admin/BookingTable";
import type { Booking, Hotel } from "@/lib/types";

interface BookingsResponse {
  bookings: Booking[];
  total: number;
}

const STATUS_OPTIONS = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

const PAGE_SIZE = 20;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [hotelId, setHotelId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load hotels for filter dropdown
  useEffect(() => {
    fetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((data: { hotels: Hotel[] }) => setHotels(data.hotels ?? []))
      .catch(() => {});
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(hotelId !== "all" && { hotelId }),
      ...(status !== "all" && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(debouncedSearch && { search: debouncedSearch }),
    });
    try {
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data: BookingsResponse = await res.json();
      setBookings(data.bookings ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, hotelId, status, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [hotelId, status, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirm = async (bookingId: string) => {
    await fetch(`/api/admin/bookings/${bookingId}/confirm`, { method: "POST" });
    fetchBookings();
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: "POST" });
    fetchBookings();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    const params = new URLSearchParams({
      ...(hotelId !== "all" && { hotelId }),
      ...(status !== "all" && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(debouncedSearch && { search: debouncedSearch }),
      export: "csv",
    });
    try {
      const res = await fetch(`/api/admin/bookings/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

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
            Bookings
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            {total} booking{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl border border-[#1B2A4A] px-4 py-2.5 text-sm font-semibold text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Guest name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E2D9C5] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
          />
        </div>

        {/* Hotel dropdown */}
        <select
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
          className="rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
        >
          <option value="all">All Hotels</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-[#E2D9C5] bg-white px-3 py-2.5 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E2D9C5] bg-white shadow-sm">
        <BookingTable
          bookings={bookings}
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2D9C5] px-6 py-4">
            <p className="text-sm text-[#64748B]">
              Page {page} of {totalPages} · {total} results
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#E2D9C5] px-3 py-1.5 text-sm font-medium text-[#1B2A4A] transition hover:bg-[#F8F6F1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      p === page
                        ? "border-[#C9A84C] bg-[#C9A84C] text-white"
                        : "border-[#E2D9C5] text-[#1B2A4A] hover:bg-[#F8F6F1]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#E2D9C5] px-3 py-1.5 text-sm font-medium text-[#1B2A4A] transition hover:bg-[#F8F6F1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
