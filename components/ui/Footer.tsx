import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/hotels', label: 'All Properties' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Travel Blog' },
]

const CITIES = [
  'Vijayawada',
  'Visakhapatnam',
  'Tirupati',
  'Guntur',
  'Nellore',
  'Kurnool',
  'Kakinada',
  'Rajahmundry',
  'Kadapa',
]

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cancellation-policy', label: 'Cancellation Policy' },
]

async function getHotelSlugs() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('hotels')
      .select('name, slug')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name')
    return data ?? []
  } catch {
    // Return fallback if DB unavailable during build
    return []
  }
}

export default async function Footer() {
  const hotels = await getHotelSlugs()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white" role="contentinfo">
      {/* Gold top border */}
      <div className="h-0.5 bg-gold-gradient" />

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Column 1: Brand ── */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-5 focus-visible:ring-2 focus-visible:ring-accent rounded-sm">
              <div className="w-8 h-8 flex-shrink-0">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                  <rect x="16" y="2" width="20" height="20" rx="1" transform="rotate(45 16 16)" fill="#C9A84C" />
                  <rect x="16" y="7" width="12" height="12" rx="0.5" transform="rotate(45 16 16)" fill="none" stroke="rgba(27,42,74,0.4)" strokeWidth="0.75" />
                </svg>
              </div>
              <div>
                <p className="font-playfair font-bold text-base text-white leading-tight">Southern Suites</p>
                <p className="font-inter text-2xs tracking-widest uppercase text-white/50 leading-tight">Hotels · AP</p>
              </div>
            </Link>

            <p className="font-inter text-sm text-white/60 leading-relaxed mb-6">
              Nine premium hotels across Andhra Pradesh. Your trusted home away from home, wherever your journey takes you.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                {
                  label: 'Facebook',
                  href: 'https://facebook.com',
                  icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  ),
                },
                {
                  label: 'Instagram',
                  href: 'https://instagram.com',
                  icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  ),
                },
                {
                  label: 'WhatsApp',
                  href: 'https://wa.me/919000000001',
                  icon: (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-sm bg-white/10 border border-white/10 flex items-center justify-center
                             text-white/60 hover:text-accent hover:bg-white/15 hover:border-accent/30
                             transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="font-playfair text-sm font-semibold text-white mb-5">Quick Links</h3>
            <div className="w-8 h-px bg-accent mb-5" />
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-inter text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-white/20 group-hover:bg-accent group-hover:w-4 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-inter text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-white/20 group-hover:bg-accent group-hover:w-4 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Our Properties ── */}
          <div>
            <h3 className="font-playfair text-sm font-semibold text-white mb-5">Our Properties</h3>
            <div className="w-8 h-px bg-accent mb-5" />
            <ul className="space-y-3">
              {(hotels.length > 0 ? hotels : CITIES.map(c => ({ name: `Southern Suites ${c}`, slug: `southern-suites-${c.toLowerCase()}` }))).map((hotel) => (
                <li key={hotel.slug}>
                  <Link
                    href={`/hotels/${hotel.slug}`}
                    className="font-inter text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-white/20 group-hover:bg-accent group-hover:w-4 transition-all duration-200" />
                    <span className="truncate">{hotel.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Cities + Contact ── */}
          <div>
            <h3 className="font-playfair text-sm font-semibold text-white mb-5">Destinations</h3>
            <div className="w-8 h-px bg-accent mb-5" />
            <ul className="space-y-2 mb-8">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link
                    href={`/cities/${city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="font-inter text-sm text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-3 h-px bg-white/20 group-hover:bg-accent group-hover:w-4 transition-all duration-200" />
                    {city}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact info */}
            <div className="space-y-2">
              <a
                href="mailto:support@southernsuites.in"
                className="flex items-center gap-2 font-inter text-sm text-white/60 hover:text-accent transition-colors"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@southernsuites.in
              </a>
              <a
                href="tel:+919000000001"
                className="flex items-center gap-2 font-inter text-sm text-white/60 hover:text-accent transition-colors"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +91 9000 000 001
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Gold divider */}
      <div className="border-t border-white/10" />

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs font-inter">
          <p>
            &copy; {year} Southern Suites Hotels. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>in Andhra Pradesh</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
