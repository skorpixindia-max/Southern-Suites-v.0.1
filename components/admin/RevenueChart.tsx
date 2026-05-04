'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  year?: number;
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatYAxis(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

function formatTooltip(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: '#C9A84C' }}>
        {formatTooltip(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-end gap-2 h-48 px-4">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="flex-1 bg-gray-100 rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
        ))}
      </div>
      <div className="flex gap-2 px-4 pt-2">
        {MONTH_LABELS.map(m => (
          <div key={m} className="flex-1 h-3 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RevenueChart({ data, year, loading = false }: RevenueChartProps) {
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Normalise data to always have 12 months
  const chartData = MONTH_LABELS.map((label, i) => {
    const found = data.find(d => {
      const monthIdx = new Date(d.month + '-01').getMonth();
      return monthIdx === i;
    });
    return { month: label, revenue: found?.revenue ?? 0, index: i };
  });

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  if (loading) return <ChartSkeleton />;

  const hasData = chartData.some(d => d.revenue > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm font-medium">No revenue data yet</p>
        <p className="text-xs mt-0.5">Revenue will appear here once bookings are confirmed</p>
      </div>
    );
  }

  return (
    <div>
      {year && (
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Monthly Revenue · {year}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.08)', radius: 6 }} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.revenue === maxRevenue ? '#C9A84C' : entry.index === currentMonth ? '#1B2A4A' : '#e8d9a8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend hint */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C9A84C' }} />
          <span className="text-xs text-gray-500">Highest month</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#1B2A4A' }} />
          <span className="text-xs text-gray-500">Current month</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#e8d9a8' }} />
          <span className="text-xs text-gray-500">Other months</span>
        </div>
      </div>
    </div>
  );
}
