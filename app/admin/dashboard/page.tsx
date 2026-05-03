import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getAllHotelsAdmin, getHotelById } from '@/lib/db/hotels'
import { getDashboardSummary } from '@/lib/db/analytics'
import type { Hotel } from '@/types/database'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.4 2.9L11 4.4l-2.5 2.4.6 3.4L6 8.7l-3.1 1.5.6-3.4L1 4.4l3.6-.5L6 1z"
            fill={i < rating ? '#C9A84C' : 'none'}
            stroke={i < rating ? '#C9A84C' : '#d1d5db'}
            strokeWidth="0.8"
          />
        </svg>
      ))}
    </span>
  )
}

async function HotelCard({ hotel }: { hotel: Hotel }) {
  const [completionRes, summary] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/admin/hotels/${hotel.id}/completion`,
      { cache: 'no-store' }
    ).then((r) => r.json()).catch(() => ({ score: 0, missing: [] })),
    getDashboardSummary(hotel.id),
  ])

  const score: number = completionRes.score ?? 0
  const missing: string[] = completionRes.missing ?? []

  const circumference = 2 * Math.PI * 22
  const dashoffset = circumference - (score / 100) * circumference
  const scoreColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Card header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2A4A 0%, #243755 100%)',
        padding: '1.25rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              background: hotel.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${hotel.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: '999px', padding: '0.2rem 0.625rem',
              marginBottom: '0.625rem',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: hotel.is_active ? '#22c55e' : '#ef4444',
                display: 'block',
              }} />
              <span style={{ fontSize: '0.675rem', fontWeight: 600, color: hotel.is_active ? '#86efac' : '#fca5a5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {hotel.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '0.25rem' }}>
              {hotel.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1C3.3 1 2 2.3 2 4c0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.3-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="rgba(255,255,255,0.5)"/>
              </svg>
              {hotel.area}, {hotel.city}
            </div>
          </div>

          {/* Completion ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke={scoreColor}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{score}%</span>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>setup</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: '0.75rem' }}>
          <StarRating rating={hotel.star_rating} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Today Revenue</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#1B2A4A' }}>
            {formatINR(summary.today_revenue)}
          </div>
        </div>
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Occupancy</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', fontWeight: 700, color: '#1B2A4A' }}>
              {summary.current_occupancy}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>/ {hotel.total_rooms} rooms</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderRight: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Check-ins</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669' }}>{summary.today_checkins}</div>
        </div>
        <div style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: summary.pending_bookings > 0 ? '#f59e0b' : '#6b7280' }}>
            {summary.pending_bookings}
          </div>
        </div>
      </div>

      {/* Missing items */}
      {missing.length > 0 && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '0.675rem', color: '#92400e', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
            Setup incomplete
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {missing.map((item) => (
              <span key={item} style={{
                fontSize: '0.675rem', color: '#b45309',
                background: '#fef3c7', border: '1px solid #fde68a',
                borderRadius: '4px', padding: '0.15rem 0.4rem',
              }}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <Link
          href={`/admin/hotels/${hotel.id}`}
          style={{
            flex: 1, textAlign: 'center',
            padding: '0.5rem 0.75rem',
            background: '#1B2A4A', color: '#fff',
            borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.02em',
            transition: 'background 0.2s',
          }}
        >
          Edit Hotel
        </Link>
        <Link
          href={`/admin/hotels/${hotel.id}/rooms`}
          style={{
            flex: 1, textAlign: 'center',
            padding: '0.5rem 0.75rem',
            background: '#f3f4f6', color: '#374151',
            borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.02em',
            transition: 'background 0.2s',
          }}
        >
          Rooms
        </Link>
        <Link
          href={`/admin/bookings?hotel=${hotel.id}`}
          style={{
            flex: 1, textAlign: 'center',
            padding: '0.5rem 0.75rem',
            background: 'rgba(201,168,76,0.1)', color: '#92400e',
            borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.02em',
            border: '1px solid rgba(201,168,76,0.25)',
            transition: 'background 0.2s',
          }}
        >
          Bookings
        </Link>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const hotels =
    session.role === 'superadmin' || session.role === 'admin'
      ? await getAllHotelsAdmin()
      : session.hotel_id
        ? [await getHotelById(session.hotel_id)].filter(Boolean) as typeof hotels
        : []

  const globalSummary = await getDashboardSummary(
    session.role === 'manager' && session.hotel_id ? session.hotel_id : undefined
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8f7f4; margin: 0; }
        .dash-root { min-height: 100vh; background: #f8f7f4; }
        .topbar {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky; top: 0; z-index: 40;
        }
        .topbar-left { display: flex; align-items: center; gap: 1rem; }
        .topbar-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1B2A4A;
          letter-spacing: -0.02em;
        }
        .topbar-badge {
          font-size: 0.675rem;
          font-weight: 600;
          color: #C9A84C;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 999px;
          padding: 0.2rem 0.625rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .topbar-right { display: flex; align-items: center; gap: 1rem; }
        .staff-pill {
          display: flex; align-items: center; gap: 0.625rem;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 999px; padding: 0.375rem 0.875rem 0.375rem 0.375rem;
        }
        .staff-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #1B2A4A;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6875rem; font-weight: 700; color: #C9A84C; flex-shrink: 0;
        }
        .staff-name { font-size: 0.8125rem; font-weight: 500; color: #374151; }
        .staff-role { font-size: 0.675rem; color: #9ca3af; }
        .logout-btn {
          padding: 0.4375rem 0.875rem;
          background: none; border: 1px solid #e5e7eb;
          border-radius: 8px; font-size: 0.8125rem;
          color: #6b7280; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; text-decoration: none; display: flex; align-items: center; gap: 0.375rem;
        }
        .logout-btn:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .main-content { padding: 2rem; max-width: 1440px; margin: 0 auto; }
        .page-header { margin-bottom: 2rem; }
        .page-eyebrow {
          font-size: 0.72rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: #C9A84C;
          font-weight: 600; margin-bottom: 0.375rem;
        }
        .page-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem; font-weight: 700; color: #1B2A4A;
          letter-spacing: -0.03em; line-height: 1.2;
          margin-bottom: 0.5rem;
        }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; font-weight: 300; }
        .global-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
        }
        .stat-card-label {
          font-size: 0.675rem; color: #9ca3af;
          letter-spacing: 0.08em; text-transform: uppercase;
          font-weight: 600; margin-bottom: 0.5rem;
        }
        .stat-card-value {
          font-family: 'Playfair Display', serif;
          font-size: 1.625rem; font-weight: 700; color: #1B2A4A;
          line-height: 1;
        }
        .stat-card-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
        .hotels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .main-content { padding: 1rem; }
          .topbar { padding: 0 1rem; }
          .hotels-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash-root">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo">Southern Suites</div>
            <div className="topbar-badge">{session.role}</div>
          </div>
          <div className="topbar-right">
            <div className="staff-pill">
              <div className="staff-avatar">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="staff-name">{session.name}</div>
                <div className="staff-role">{session.role}</div>
              </div>
            </div>
            <Link href="/api/admin/auth/logout" className="logout-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </Link>
          </div>
        </header>

        <main className="main-content">
          {/* Page header */}
          <div className="page-header">
            <div className="page-eyebrow">Command Centre</div>
            <h1 className="page-title">
              {session.role === 'superadmin' || session.role === 'admin'
                ? 'All Properties'
                : 'Your Property'}
            </h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Global stats */}
          <div className="global-stats">
            <div className="stat-card">
              <div className="stat-card-label">Today Revenue</div>
              <div className="stat-card-value">{formatINR(globalSummary.today_revenue)}</div>
              <div className="stat-card-sub">Across all properties</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Check-ins Today</div>
              <div className="stat-card-value" style={{ color: '#059669' }}>{globalSummary.today_checkins}</div>
              <div className="stat-card-sub">Guests arriving</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Check-outs Today</div>
              <div className="stat-card-value" style={{ color: '#7c3aed' }}>{globalSummary.today_checkouts}</div>
              <div className="stat-card-sub">Guests departing</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Pending Bookings</div>
              <div className="stat-card-value" style={{ color: globalSummary.pending_bookings > 0 ? '#f59e0b' : '#1B2A4A' }}>
                {globalSummary.pending_bookings}
              </div>
              <div className="stat-card-sub">Awaiting confirmation</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Month Revenue</div>
              <div className="stat-card-value">{formatINR(globalSummary.month_revenue)}</div>
              <div className="stat-card-sub">This month so far</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Total Guests</div>
              <div className="stat-card-value">{globalSummary.total_guests.toLocaleString('en-IN')}</div>
              <div className="stat-card-sub">Registered profiles</div>
            </div>
          </div>

          {/* Hotel cards grid */}
          <div className="hotels-grid">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
