import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Maximize2, Users } from 'lucide-react'

type RoomImage = {
  image_url: string
  alt_text?: string | null
  is_primary?: boolean
  sort_order?: number
}

type Room = {
  id: string
  name: string
  slug: string
  room_type: string
  base_price: number
  weekend_price?: number | null
  size_sqft?: number | null
  bed_type?: string | null
  max_occupancy: number
  amenities: string[]
  room_images?: RoomImage[]
  availability?: { date: string; available_rooms: number }[]
  description?: string | null
}

type Props = {
  room: Room
  hotelSlug: string
  isBestValue?: boolean
}

const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶',
  'Free WiFi': '📶',
  'AC': '❄️',
  'Air Conditioning': '❄️',
  'TV': '📺',
  'Room Service': '🍽️',
  'Geyser': '🚿',
  'Mini Bar': '🍾',
  'Balcony': '🏡',
  'Sea View': '🌊',
  'Pool Access': '🏊',
  'Parking': '🅿️',
  'Laundry': '👔',
  'Safe': '🔒',
  'Bathtub': '🛁',
}

const BED_LABELS: Record<string, string> = {
  king: 'King Bed',
  queen: 'Queen Bed',
  twin: 'Twin Beds',
  double: 'Double Bed',
  single: 'Single Bed',
}

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function getAvailability(room: Room): number | null {
  if (!room.availability || room.availability.length === 0) return null
  const today = new Date().toISOString().split('T')[0]
  const future = room.availability.filter((a) => a.date >= today)
  if (future.length === 0) return null
  return Math.min(...future.map((a) => a.available_rooms))
}

export default function RoomCard({ room, hotelSlug, isBestValue }: Props) {
  const primaryImage =
    room.room_images?.find((img) => img.is_primary) ||
    room.room_images?.[0]

  const amenities: string[] = Array.isArray(room.amenities)
    ? room.amenities
    : typeof room.amenities === 'string'
    ? JSON.parse(room.amenities)
    : []

  const shownAmenities = amenities.slice(0, 5)
  const extraCount = amenities.length - 5

  const available = getAvailability(room)
  const isSoldOut = available !== null && available <= 0
  const isLowStock = available !== null && available > 0 && available < 3

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-[#1B2A4A]/8 ${
        isSoldOut
          ? 'border-[#1B2A4A]/8 opacity-70'
          : 'border-[#1B2A4A]/8 hover:border-[#C9A84C]/30'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1B2A4A]/5">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || room.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🏨</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isSoldOut && (
            <span className="bg-[#1B2A4A]/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Sold Out
            </span>
          )}
          {isLowStock && !isSoldOut && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Only {available} left!
            </span>
          )}
          {isBestValue && !isSoldOut && (
            <span className="bg-[#C9A84C] text-[#1B2A4A] text-xs font-bold px-2.5 py-1 rounded-full">
              Best Value
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Name */}
        <h3 className="font-['Playfair_Display'] text-lg text-[#1B2A4A] font-bold mb-3 leading-tight">
          {room.name}
        </h3>

        {/* Details row */}
        <div className="flex flex-wrap gap-3 text-xs text-[#1B2A4A]/50 mb-4">
          {room.size_sqft && (
            <span className="flex items-center gap-1">
              <Maximize2 size={12} />
              {room.size_sqft} sq ft
            </span>
          )}
          {room.bed_type && (
            <span className="flex items-center gap-1">
              <BedDouble size={12} />
              {BED_LABELS[room.bed_type] || room.bed_type}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} />
            Up to {room.max_occupancy} guests
          </span>
        </div>

        {/* Amenities */}
        {shownAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {shownAmenities.map((a) => (
              <span
                key={a}
                className="text-xs bg-[#1B2A4A]/5 text-[#1B2A4A]/60 px-2 py-1 rounded-md"
              >
                {AMENITY_ICONS[a] || '✓'} {a}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-xs text-[#C9A84C] font-medium px-2 py-1">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-[#1B2A4A]/8">
          <div>
            <p className="text-xs text-[#1B2A4A]/40 uppercase tracking-wider">per night</p>
            <p className="font-['Playfair_Display'] text-2xl font-bold text-[#1B2A4A]">
              {formatINR(room.base_price)}
            </p>
            {room.weekend_price && room.weekend_price > room.base_price && (
              <p className="text-xs text-[#1B2A4A]/40">
                <span className="line-through">{formatINR(room.weekend_price)}</span> on weekends
              </p>
            )}
            <p className="text-xs text-[#1B2A4A]/40 mt-0.5">+ taxes</p>
          </div>

          {isSoldOut ? (
            <button
              disabled
              className="bg-[#1B2A4A]/8 text-[#1B2A4A]/40 font-semibold px-5 py-2.5 rounded-xl text-sm cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <Link
              href={`/booking/${hotelSlug}?room=${room.id}`}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#1B2A4A] font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
