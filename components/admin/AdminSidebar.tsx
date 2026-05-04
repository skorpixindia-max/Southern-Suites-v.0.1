'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CalendarCheck, Users, BedDouble,
  Package, Tag, BadgePercent, BarChart3, UserCog, Settings,
  Menu, X, LogOut
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface AdminSidebarProps {
  staffName?: string;
  staffRole?: string;
  onLogout?: () => void;
}

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: LayoutDashboard },
  { label: 'Hotels',       href: '/admin/hotels',       icon: Building2 },
  { label: 'Bookings',     href: '/admin/bookings',     icon: CalendarCheck },
  { label: 'Guests',       href: '/admin/guests',       icon: Users },
  { label: 'Housekeeping', href: '/admin/housekeeping', icon: BedDouble },
  { label: 'Inventory',    href: '/admin/inventory',    icon: Package },
  { label: 'Pricing',      href: '/admin/pricing',      icon: Tag },
  { label: 'Offers',       href: '/admin/offers',       icon: BadgePercent },
  { label: 'Analytics',    href: '/admin/analytics',    icon: BarChart3 },
  { label: 'Managers',     href: '/admin/managers',     icon: UserCog },
  { label: 'Settings',     href: '/admin/settings',     icon: Settings },
];

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  staffName,
  staffRole,
  onLogout,
  onClose,
}: {
  pathname: string;
  staffName: string;
  staffRole: string;
  onLogout?: () => void;
  onClose?: () => void;
}) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const formatRole = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1B2A4A' }}>
      {/* Logo Area */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Southern Suites
            </h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: '#C9A84C' }}>Admin Panel</p>
          </div>
          {/* Mobile close */}
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors lg:hidden">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${active
                  ? 'text-gray-900'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
                }
              `}
              style={active ? { backgroundColor: '#C9A84C' } : {}}
            >
              {/* Active left border indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: '#1B2A4A' }}
                />
              )}
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${active ? 'text-gray-900' : 'text-white/60 group-hover:text-white'}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}>
            {staffName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{staffName}</p>
            <p className="text-xs font-medium truncate" style={{ color: '#C9A84C' }}>{formatRole(staffRole)}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AdminSidebar({
  staffName = 'Admin User',
  staffRole = 'superadmin',
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Google Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col">
        <SidebarContent
          pathname={pathname}
          staffName={staffName}
          staffRole={staffRole}
          onLogout={onLogout}
        />
      </aside>

      {/* ── Mobile: Top Bar with Hamburger ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: '#1B2A4A' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Southern Suites
        </h1>
        <div className="w-9" /> {/* Spacer to center title */}
      </div>

      {/* ── Mobile: Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: Drawer ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent
          pathname={pathname}
          staffName={staffName}
          staffRole={staffRole}
          onLogout={onLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>
    </>
  );
}
