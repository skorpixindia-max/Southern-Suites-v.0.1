'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Room = {
  id: string
  name: string
  base_price: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  hotelSlug: string
  rooms: Room[]
}

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function BookNowPopup({ isOpen, onClose, hotelSlug, rooms }: Props) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<string>(rooms[0]?.id ?? '')

  const today = new Date().toISOString().split('T')[0]

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom)

  const nights =
    checkIn && checkOut
      ? Math.max(0, (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0

  const handleBook = () => {
    if (!selectedRoom) return
    const params = new URLSearchParams({
      room: selectedRoom,
      ...(checkIn && { checkIn }),
      ...(checkOut && { checkOut }),
      adults: String(adults),
      children: String(children),
    })
    router.push(`/booking/${hotelSlug}?${params.toString()}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-[#1B2A4A]/15 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-[#1B2A4A]/8">
          <h3 className="font-['Playfair_Display'] text-lg text-[#1B2A4A] font-bold">Book a Room</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center hover:bg-[#1B2A4A]/15 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Room Selector */}
          <div>
            <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
              Select Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-4 py-3 border border-[#1B2A4A]/15 rounded-xl bg-[#F7F5F0] text-[#1B2A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} — {formatINR(room.base_price)}/night
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Check-in</label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                  if (checkOut && e.target.value >= checkOut) setCheckOut('')
                }}
                className="w-full px-3 py-2.5 border border-[#1B2A4A]/15 rounded-xl bg-[#F7F5F0] text-[#1B2A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1B2A4A]/15 rounded-xl bg-[#F7F5F0] text-[#1B2A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
              />
            </div>
          </div>

          {/* Guests */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Adults', value: adults, setter: setAdults, min: 1, max: 6 },
              { label: 'Children', value: children, setter: setChildren, min: 0, max: 4 },
            ].map((g) => (
              <div key={g.label}>
                <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
                  {g.label}
                </label>
                <div className="flex items-center justify-between border border-[#1B2A4A]/15 rounded-xl px-3 py-2.5 bg-[#F7F5F0]">
                  <button
                    onClick={() => g.setter(Math.max(g.min, g.value - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-[#1B2A4A]/15 flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold text-[#1B2A4A]">{g.value}</span>
                  <button
                    onClick={() => g.setter(Math.min(g.max, g.value + 1))}
                    className="w-7 h-7 rounded-full bg-white border border-[#1B2A4A]/15 flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Price Preview */}
          {selectedRoomData && nights > 0 && (
            <div className="bg-[#1B2A4A]/4 rounded-xl p-3 text-sm">
              <div className="flex justify-between text-[#1B2A4A]/60">
                <span>
                  {formatINR(selectedRoomData.base_price)} × {nights} night{nights !== 1 ? 's' : ''}
                </span>
                <span className="font-bold text-[#1B2A4A]">
                  {formatINR(selectedRoomData.base_price * nights)}
                </span>
              </div>
              <p className="text-xs text-[#1B2A4A]/40 mt-1">+ taxes as applicable</p>
            </div>
          )}
        </div>

        {/* Book Button */}
        <div className="px-5 py-4 border-t border-[#1B2A4A]/8">
          <button
            onClick={handleBook}
            disabled={!selectedRoom}
            className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#1B2A4A] font-bold py-4 rounded-xl text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C9A84C]/20"
          >
            Continue to Booking
          </button>
        </div>
      </div>
    </>
  )
}
