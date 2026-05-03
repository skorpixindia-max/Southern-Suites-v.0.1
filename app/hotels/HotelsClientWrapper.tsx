'use client'

import { useState, useMemo } from 'react'
import HotelCard from '@/components/hotel/HotelCard'
import { MapPin, SlidersHorizontal } from 'lucide-react'

type HotelImage = {
  image_url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

type Room = {
  base_price: number
}

type Hotel = {
  id: string
  name: string
  slug: string
  short_description: string | null
  city: string
  area: string
  address: string
  star_rating: number
  phone: string
  whatsapp_number: string
  amenities: string[]
  hotel_images: HotelImage[]
  rooms: Room[]
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'stars_desc', label: 'Star Rating' },
]

export default function HotelsClientWrapper({
  hotels,
  cities,
}: {
  hotels: Hotel[]
  cities: string[]
}) {
  const [activeCity, setActiveCity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('price_asc')

  const getMinPrice = (hotel: Hotel) => {
    const prices = hotel.rooms?.map((r) => r.base_price) ?? []
    return prices.length > 0 ? Math.min(...prices) : Infinity
  }

  const filtered = useMemo(() => {
    let result = [...hotels]

    if (activeCity !== 'all') {
      result = result.filter((h) => h.city === activeCity)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return getMinPrice(a) - getMinPrice(b)
        case 'price_desc':
          return getMinPrice(b) - getMinPrice(a)
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'stars_desc':
          return b.star_rating - a.star_rating
        default:
          return 0
      }
    })

    return result
  }, [hotels, activeCity, sortBy])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        {/* City Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCity('all')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              activeCity === 'all'
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                : 'bg-white text-[#1B2A4A] border-[#1B2A4A]/20 hover:border-[#1B2A4A]/60'
            }`}
          >
            All Properties
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeCity === 'all' ? 'bg-[#C9A84C] text-[#1B2A4A]' : 'bg-[#F7F5F0] text-[#1B2A4A]'
              }`}
            >
              {hotels.length}
            </span>
          </button>

          {cities.map((city) => {
            const count = hotels.filter((h) => h.city === city).length
            return (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCity === city
                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                    : 'bg-white text-[#1B2A4A] border-[#1B2A4A]/20 hover:border-[#1B2A4A]/60'
                }`}
              >
                <MapPin size={12} />
                {city}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeCity === city ? 'bg-[#C9A84C] text-[#1B2A4A]' : 'bg-[#F7F5F0] text-[#1B2A4A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal size={16} className="text-[#1B2A4A]/50" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-[#1B2A4A]/20 rounded-lg px-3 py-2 bg-white text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#1B2A4A]/50 mb-6">
        {filtered.length === 0
          ? 'No properties found'
          : `Showing ${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'}${
              activeCity !== 'all' ? ` in ${activeCity}` : ''
            }`}
      </p>

      {/* Hotel Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1B2A4A]/5 flex items-center justify-center">
            <MapPin size={32} className="text-[#1B2A4A]/30" />
          </div>
          <h3 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] mb-2">
            No Properties Found
          </h3>
          <p className="text-[#1B2A4A]/50 mb-6">
            No hotels match your current filter. Try selecting a different city.
          </p>
          <button
            onClick={() => setActiveCity('all')}
            className="px-6 py-3 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243656] transition-colors"
          >
            View All Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </section>
  )
}
