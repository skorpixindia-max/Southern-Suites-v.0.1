"use client";

import { useState, useEffect } from "react";
import RevenueChart from "@/components/admin/RevenueChart";
import OccupancyCard from "@/components/admin/OccupancyCard";

interface AnalyticsData {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  totalBookings: number;
  monthlyRevenue: { month: string; amount: number }[];
  occupancyByHotel: {
    hotelId: string;
    hotelName: string;
    occupancyPercent: number;
    bookedRooms: number;
    totalRooms: number;
  }[];
  bookingSource: {
    website: number;
    walkin: number;
    phone: number;
  };
  topHotel: { name: string; revenue: number } | null;
}

function formatINR(n: number): string {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function StatCard({
  label,
  value,
  icon,
  trend,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E2D9C5] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B2A4A]">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded bg-[#E2D9C5]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[#E2D9C5]" />
        </div>
      ) : (
        <>
          <p
            className="font-playfair text-2xl font-bold text-[#1B2A4A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {value}
          </p>
          <p className="mt-0.5 text-xs text-[#64748B]">{label}</p>
        </>
      )}
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?year=${year}`)
      .then((r) => r.json())
      .then((d: AnalyticsData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const sourceTotal =
    (data?.bookingSource.website ?? 0) +
    (data?.bookingSource.walkin ?? 0) +
    (data?.bookingSource.phone ?? 0) || 1;

  const sourcePct = {
    website: Math.round(((data?.bookingSource.website ?? 0) / sourceTotal) * 100),
    walkin: Math.round(((data?.bookingSource.walkin ?? 0) / sourceTotal) * 100),
    phone: Math.round(((data?.bookingSource.phone ?? 0) / sourceTotal) * 100),
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="font-playfair text-2xl font-bold text-[#1B2A4A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Analytics
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Business performance overview</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-[#E2D9C5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C9A84C]"
        >
          {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Revenue overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Revenue"
          value={data ? formatINR(data.todayRevenue) : "—"}
          loading={loading}
          icon={<svg className="h-5 w-5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="This Month"
          value={data ? formatINR(data.monthRevenue) : "—"}
          loading={loading}
          icon={<svg className="h-5 w-5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label={`Year ${year}`}
          value={data ? formatINR(data.yearRevenue) : "—"}
          loading={loading}
          icon={<svg className="h-5 w-5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Total Bookings"
          value={data ? data.totalBookings.toLocaleString("en-IN") : "—"}
          loading={loading}
          icon={<svg className="h-5 w-5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue chart — 2/3 width */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[#E2D9C5] bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#1B2A4A]">Monthly Revenue {year}</h2>
            {loading ? (
              <div className="flex h-56 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2D9C5] border-t-[#C9A84C]" />
              </div>
            ) : (
              <RevenueChart data={data?.monthlyRevenue ?? []} year={year} />
            )}
          </div>
        </div>

        {/* Booking source — 1/3 width */}
        <div className="rounded-2xl border border-[#E2D9C5] bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-[#1B2A4A]">Booking Source</h2>
          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2D9C5] border-t-[#C9A84C]" />
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Website", pct: sourcePct.website, color: "#1B2A4A" },
                { label: "Walk-in", pct: sourcePct.walkin, color: "#C9A84C" },
                { label: "Phone", pct: sourcePct.phone, color: "#64748B" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#64748B]">{label}</span>
                    <span className="font-semibold text-[#1B2A4A]">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F1EDE3]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}

              {data?.topHotel && (
                <div className="mt-6 rounded-xl border border-[#E2D9C5] bg-[#F8F6F1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Top Performer
                  </p>
                  <p className="mt-1 font-semibold text-[#1B2A4A]">{data.topHotel.name}</p>
                  <p className="text-sm text-[#C9A84C]">
                    {formatINR(data.topHotel.revenue)} revenue
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Occupancy per hotel */}
      <div>
        <h2 className="mb-4 font-semibold text-[#1B2A4A]">Occupancy by Hotel</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#E2D9C5] bg-[#F8F6F1]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.occupancyByHotel ?? []).map((h) => (
              <OccupancyCard
                key={h.hotelId}
                hotelName={h.hotelName}
                occupancyPercent={h.occupancyPercent}
                bookedRooms={h.bookedRooms}
                totalRooms={h.totalRooms}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
