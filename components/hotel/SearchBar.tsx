'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  cities: string[]
  initialCity?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  compact?: boolean // for non-hero use
}

export default function SearchBar({
  cities,
  initialCity = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  compact = false,
}: SearchBarProps) {
  const router = useRouter()

  // Get today and tomorrow in YYYY-MM-DD format
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const [city, setCity]           = useState(initialCity)
  const [checkIn, setCheckIn]     = useState(initialCheckIn || todayStr)
  const [checkOut, setCheckOut]   = useState(initialCheckOut || tomorrowStr)
  const [guests, setGuests]       = useState(initialGuests)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const guestsRef = useRef<HTMLDivElement>(null)

  // Close guests dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setGuestsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Ensure check-out is always after check-in
  function handleCheckInChange(value: string) {
    setCheckIn(value)
    if (value >= checkOut) {
      const next = new Date(value)
      next.setDate(next.getDate() + 1)
      setCheckOut(next.toISOString().split('T')[0])
    }
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (city)     params.set('city', city)
    if (checkIn)  params.set('checkin', checkIn)
    if (checkOut) params.set('checkout', checkOut)
    if (guests)   params.set('guests', String(guests))
    router.push(`/hotels?${params.toString()}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const baseClass = compact
    ? 'bg-white border border-neutral-200 shadow-card rounded-sm p-2 flex flex-col md:flex-row gap-0 md:gap-0 md:items-stretch'
    : 'bg-white/95 backdrop-blur-luxury border border-white/20 shadow-luxury rounded-sm p-2 flex flex-col md:flex-row gap-0 md:gap-0 md:items-stretch'

  return (
    <div
      className={baseClass}
      role="search"
      aria-label="Search hotels"
      onKeyDown={handleKeyDown}
    >
      {/* Divider utility */}
  

      {/* ── City ── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 md:py-2 group">
        <label htmlFor="search-city" className="text-2xs font-bold tracking-widest uppercase text-neutral-400 mb-1 group-focus-within:text-accent transition-colors">
          Destination
        </label>
        <select
          id="search-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-inter font-medium text-primary cursor-pointer w-full
                     appearance-none focus:ring-0"
          aria-label="Select city"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="hidden md:block w-px bg-neutral-200 self-stretch my-2" aria-hidden="true" />
      <div className="block md:hidden h-px bg-neutral-100 mx-4" aria-hidden="true" />

      {/* ── Check-in ── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 md:py-2 group">
        <label htmlFor="search-checkin" className="text-2xs font-bold tracking-widest uppercase text-neutral-400 mb-1 group-focus-within:text-accent transition-colors">
          Check-in
        </label>
        <input
          id="search-checkin"
          type="date"
          value={checkIn}
          min={todayStr}
          onChange={(e) => handleCheckInChange(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-inter font-medium text-primary w-full focus:ring-0 cursor-pointer"
          aria-label="Check-in date"
        />
      </div>

      <div className="hidden md:block w-px bg-neutral-200 self-stretch my-2" aria-hidden="true" />
      <div className="block md:hidden h-px bg-neutral-100 mx-4" aria-hidden="true" />

      {/* ── Check-out ── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 md:py-2 group">
        <label htmlFor="search-checkout" className="text-2xs font-bold tracking-widest uppercase text-neutral-400 mb-1 group-focus-within:text-accent transition-colors">
          Check-out
          {nights > 0 && (
            <span className="ml-2 text-accent normal-case tracking-normal font-semibold">
              {nights} night{nights > 1 ? 's' : ''}
            </span>
          )}
        </label>
        <input
          id="search-checkout"
          type="date"
          value={checkOut}
          min={checkIn || tomorrowStr}
          onChange={(e) => setCheckOut(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-inter font-medium text-primary w-full focus:ring-0 cursor-pointer"
          aria-label="Check-out date"
        />
      </div>

      <div className="hidden md:block w-px bg-neutral-200 self-stretch my-2" aria-hidden="true" />
      <div className="block md:hidden h-px bg-neutral-100 mx-4" aria-hidden="true" />

      {/* ── Guests ── */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 md:py-2 relative" ref={guestsRef}>
        <span className="text-2xs font-bold tracking-widest uppercase text-neutral-400 mb-1">
          Guests
        </span>
        <button
          type="button"
          onClick={() => setGuestsOpen(!guestsOpen)}
          className="text-sm font-inter font-medium text-primary text-left focus:outline-none"
          aria-expanded={guestsOpen}
          aria-haspopup="listbox"
        >
          {guests} {guests === 1 ? 'Guest' : 'Guests'}
        </button>

        {/* Guests dropdown */}
        {guestsOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-neutral-200 rounded-sm shadow-navy z-50 p-4">
            <p className="text-xs font-semibold text-neutral-500 mb-3">Number of Guests</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center
                           text-neutral-600 hover:border-accent hover:text-accent transition-colors"
                aria-label="Decrease guests"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="font-inter font-bold text-primary text-lg w-8 text-center">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center
                           text-neutral-600 hover:border-accent hover:text-accent transition-colors"
                aria-label="Increase guests"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Search Button ── */}
      <div className="px-2 py-2 flex items-stretch md:items-center">
        <button
          type="button"
          onClick={handleSearch}
          className="w-full md:w-auto btn-gold px-6 md:px-8 py-3 text-sm font-bold tracking-wide rounded-xs"
          aria-label="Search available hotels"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>
    </div>
  )
}
