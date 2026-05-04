'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, Calendar, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsData {
  today_revenue: number;
  yesterday_revenue: number;
  new_bookings_today: number;
  checkins_today: number;
  checkouts_today: number;
  checkin_guests: Array<{ name: string; room: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function trendPercent(current: number, prev: number) {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="w-16 h-5 rounded-full bg-gray-100" />
      </div>
      <div className="w-24 h-8 rounded-lg bg-gray-100 mb-1" />
      <div className="w-32 h-4 rounded bg-gray-100" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
  trend,
  children,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  trend?: number | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      {children}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorCard() {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm col-span-full">
      <p className="text-sm text-red-500 text-center">⚠️ Failed to load stats. Refresh to retry.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuickStats() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ErrorCard />
      </div>
    );
  }

  const revTrend = trendPercent(data.today_revenue, data.yesterday_revenue);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Today Revenue */}
      <StatCard
        icon={IndianRupee}
        iconBg="bg-amber-500"
        label="Today's Revenue"
        value={formatCurrency(data.today_revenue)}
        trend={revTrend}
        sub={`vs ₹${(data.yesterday_revenue / 1000).toFixed(0)}K yesterday`}
      />

      {/* Card 2: New Bookings */}
      <StatCard
        icon={Calendar}
        iconBg="bg-blue-500"
        label="New Bookings"
        value={String(data.new_bookings_today)}
        sub="today"
      />

      {/* Card 3: Check-ins Today */}
      <StatCard
        icon={ArrowDownToLine}
        iconBg="bg-green-500"
        label="Check-ins Today"
        value={String(data.checkins_today)}
        sub={data.checkins_today > 0 ? 'Guests arriving' : 'No arrivals today'}
      >
        {data.checkin_guests && data.checkin_guests.length > 0 && data.checkin_guests.length <= 5 && (
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            {data.checkin_guests.slice(0, 5).map((g, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium truncate max-w-[70%]">{g.name}</span>
                <span className="text-gray-400">{g.room}</span>
              </div>
            ))}
          </div>
        )}
      </StatCard>

      {/* Card 4: Check-outs Today */}
      <StatCard
        icon={ArrowUpFromLine}
        iconBg="bg-purple-500"
        label="Check-outs Today"
        value={String(data.checkouts_today)}
        sub={data.checkouts_today > 0 ? 'Guests departing' : 'No departures today'}
      />
    </div>
  );
}
