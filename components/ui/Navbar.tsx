'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/hotels', label: 'Hotels' },
  { href: '/cities', label: 'Cities' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export default function Navbar() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'

  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isTransparent = isHomepage && !scrolled && !menuOpen
  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-luxury
          ${isTransparent
            ? 'bg-transparent border-b border-white/10'
            : 'bg-white border-b border-neutral-100 shadow-sm'
          }`}
        style={{ height: 'var(--navbar-height)' }}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            aria-label="Southern Suites — Home"
          >
            {/* Gold diamond icon */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <rect
                  x="16" y="2"
                  width="20" height="20"
                  rx="1"
                  transform="rotate(45 16 16)"
                  className={`transition-colors duration-400 ${isTransparent ? 'fill-accent' : 'fill-accent'}`}
                />
                <rect
                  x="16" y="7"
                  width="12" height="12"
                  rx="0.5"
                  transform="rotate(45 16 16)"
                  fill="none"
                  className={`transition-colors duration-400 ${isTransparent ? 'stroke-primary/40' : 'stroke-primary/30'}`}
                  strokeWidth="0.75"
                />
              </svg>
            </div>

            {/* Text */}
            <div>
              <p className={`font-playfair font-bold text-base leading-tight transition-colors duration-400
                ${isTransparent ? 'text-white' : 'text-primary'}`}>
                Southern Suites
              </p>
              <p className={`font-inter text-2xs tracking-widest uppercase leading-tight transition-colors duration-400
                ${isTransparent ? 'text-white/60' : 'text-neutral-400'}`}>
                Hotels · AP
              </p>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 font-inter font-medium text-sm rounded-sm
                           transition-all duration-200
                           focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1
                           ${isActive(link.href)
                              ? isTransparent
                                ? 'text-accent'
                                : 'text-accent'
                              : isTransparent
                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
                           }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop CTA + Mobile Hamburger ── */}
          <div className="flex items-center gap-4">
            {/* Book Now button — desktop only */}
            <Link
              href="/hotels"
              className="hidden md:inline-flex btn-gold py-2 px-5 text-xs font-bold tracking-wide"
              aria-label="Book a hotel room"
            >
              Book Now
            </Link>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-sm
                         transition-colors duration-200
                         focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1
                         ${isTransparent ? 'hover:bg-white/10' : 'hover:bg-neutral-100'}`}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`block w-5 h-0.5 transition-all duration-300
                ${isTransparent && !menuOpen ? 'bg-white' : 'bg-primary'}
                ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
              />
              <span className={`block w-5 h-0.5 transition-all duration-300
                ${isTransparent && !menuOpen ? 'bg-white' : 'bg-primary'}
                ${menuOpen ? 'opacity-0 scale-x-0' : ''}`}
              />
              <span className={`block w-5 h-0.5 transition-all duration-300
                ${isTransparent && !menuOpen ? 'bg-white' : 'bg-primary'}
                ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden transition-all duration-400 ease-luxury
          ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity duration-400
            ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />

        {/* Slide-down panel */}
        <nav
          className={`absolute top-[var(--navbar-height)] left-0 right-0 bg-white border-b border-neutral-100 shadow-luxury
                     transition-all duration-400 ease-luxury
                     ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-inter font-medium text-base
                           transition-all duration-200
                           ${isActive(link.href)
                              ? 'text-accent bg-accent/5'
                              : 'text-neutral-700 hover:text-primary hover:bg-neutral-50'
                           }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {isActive(link.href) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            ))}

            {/* Book Now CTA */}
            <div className="pt-4 pb-2 border-t border-neutral-100 mt-2">
              <Link
                href="/hotels"
                className="btn-gold w-full justify-center py-3"
                aria-label="Book a hotel room"
              >
                Book Now
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Spacer for non-homepage pages */}
      {!isHomepage && (
        <div style={{ height: 'var(--navbar-height)' }} aria-hidden="true" />
      )}
    </>
  )
}
