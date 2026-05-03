'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Minus, Plus } from 'lucide-react'

type Props = {
  hotel: any
  minPrice: number | null
}

function formatINR(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export default function HotelSidebar({ hotel, minPrice }: Props) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [showMobileBar, setShowMobileBar] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

  const estimatedTotal = minPrice && nights > 0 ? minPrice * nights : null

  const handleBook = () => {
    const params = new URLSearchParams({
      ...(checkIn && { checkIn }),
      ...(checkOut && { checkOut }),
      adults: String(adults),
      children: String(children),
    })
    router.push(`/hotels/${hotel.slug}#rooms`)
  }

  const SidebarContent = () => (
    <div className="space-y-4">
      {/* Price */}
      {minPrice && (
        <div>
          <p className="text-xs text-[#1B2A4A]/40 uppercase tracking-wider">Starting from</p>
          <div className="flex items-baseline gap-1">
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1B2A4A]">
              {formatINR(minPrice)}
            </p>
            <p className="text-sm text-[#1B2A4A]/50">/ night</p>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Check-in</label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2A4A]/30 pointer-events-none"
            />
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value)
                if (checkOut && e.target.value >= checkOut) setCheckOut('')
              }}
              className="w-full pl-8 pr-2 py-2.5 text-xs border border-[#1B2A4A]/15 rounded-lg bg-[#F7F5F0] text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 cursor-pointer"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Check-out</label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2A4A]/30 pointer-events-none"
            />
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full pl-8 pr-2 py-2.5 text-xs border border-[#1B2A4A]/15 rounded-lg bg-[#F7F5F0] text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Guests</label>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center justify-between border border-[#1B2A4A]/15 rounded-lg px-3 py-2">
            <span className="text-xs text-[#1B2A4A]/60">Adults</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-6 h-6 rounded-full bg-[#1B2A4A]/8 hover:bg-[#1B2A4A]/15 flex items-center justify-center transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-semibold text-[#1B2A4A] w-4 text-center">{adults}</span>
              <button
                onClick={() => setAdults(Math.min(6, adults + 1))}
                className="w-6 h-6 rounded-full bg-[#1B2A4A]/8 hover:bg-[#1B2A4A]/15 flex items-center justify-center transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-between border border-[#1B2A4A]/15 rounded-lg px-3 py-2">
            <span className="text-xs text-[#1B2A4A]/60">Children</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="w-6 h-6 rounded-full bg-[#1B2A4A]/8 hover:bg-[#1B2A4A]/15 flex items-center justify-center transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-semibold text-[#1B2A4A] w-4 text-center">{children}</span>
              <button
                onClick={() => setChildren(Math.min(4, children + 1))}
                className="w-6 h-6 rounded-full bg-[#1B2A4A]/8 hover:bg-[#1B2A4A]/15 flex items-center justify-center transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Preview */}
      {estimatedTotal && (
        <div className="bg-[#1B2A4A]/4 rounded-xl p-3 border border-[#1B2A4A]/8">
          <div className="flex justify-between text-sm text-[#1B2A4A]/60">
            <span>
              {formatINR(minPrice!)} × {nights} night{nights !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-[#1B2A4A]">{formatINR(estimatedTotal)}</span>
          </div>
          <p className="text-xs text-[#1B2A4A]/40 mt-1">+ taxes as applicable</p>
        </div>
      )}

      {/* Book Now */}
      <button
        onClick={handleBook}
        className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#1B2A4A] font-bold py-4 rounded-xl transition-colors text-sm tracking-wide shadow-lg shadow-[#C9A84C]/20"
      >
        Check Room Availability
      </button>

      <p className="text-center text-xs text-[#1B2A4A]/40">
        Best rate guaranteed · No booking fees
      </p>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-white rounded-2xl border border-[#1B2A4A]/8 p-6 shadow-xl shadow-[#1B2A4A]/5">
          <h3 className="font-['Playfair_Display'] text-lg text-[#1B2A4A] font-bold mb-4 pb-3 border-b border-[#1B2A4A]/8">
            {hotel.name}
          </h3>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#1B2A4A]/10 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          {minPrice ? (
            <>
              <p className="text-xs text-[#1B2A4A]/40">From</p>
              <p className="font-['Playfair_Display'] text-xl font-bold text-[#1B2A4A]">
                {formatINR(minPrice)}
                <span className="text-xs font-normal text-[#1B2A4A]/50 ml-1">/ night</span>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-[#1B2A4A]">{hotel.name}</p>
          )}
        </div>
        <button
          onClick={handleBook}
          className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#1B2A4A] font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Book Now
        </button>
      </div>
    </>
  )
}
