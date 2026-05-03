'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import AmenitiesList from '@/components/hotel/AmenitiesList'
import RoomCard from '@/components/hotel/RoomCard'
import HotelMap from '@/components/hotel/HotelMap'
import { ChevronDown, Star } from 'lucide-react'

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'location', label: 'Location' },
  { id: 'reviews', label: 'Reviews' },
]

type Props = {
  hotel: any
  rooms: any[]
}

function StarBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#1B2A4A]/10 rounded-full h-2">
        <div
          className="bg-[#C9A84C] h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#1B2A4A]/50 w-8 text-right">{count}</span>
    </div>
  )
}

function PoliciesAccordion({ policies }: { policies: Record<string, string> }) {
  const [open, setOpen] = useState<string | null>(null)

  const entries = Object.entries(policies).filter(([, v]) => v)
  if (entries.length === 0) return null

  const labels: Record<string, string> = {
    cancellation: 'Cancellation Policy',
    pets: 'Pet Policy',
    smoking: 'Smoking Policy',
    children: 'Children Policy',
    extra_bed: 'Extra Bed Policy',
  }

  return (
    <div className="divide-y divide-[#1B2A4A]/10 border border-[#1B2A4A]/10 rounded-xl overflow-hidden">
      {entries.map(([key, value]) => (
        <div key={key}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1B2A4A]/3 transition-colors"
            onClick={() => setOpen(open === key ? null : key)}
          >
            <span className="font-medium text-[#1B2A4A] text-sm">
              {labels[key] || key.replace(/_/g, ' ')}
            </span>
            <ChevronDown
              size={16}
              className={`text-[#1B2A4A]/40 transition-transform duration-200 ${
                open === key ? 'rotate-180' : ''
              }`}
            />
          </button>
          {open === key && (
            <div className="px-5 pb-4 text-sm text-[#1B2A4A]/70 bg-[#1B2A4A]/2">
              {value}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function HotelDetailTabs({ hotel, rooms }: Props) {
  const hasTour = !!hotel.tour_embed_code

  const tabs = [...TAB_CONFIG, ...(hasTour ? [{ id: 'tour', label: '360° Tour' }] : [])]
  const [activeTab, setActiveTab] = useState('overview')

  const reviews: any[] = hotel.reviews ?? []
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r: any) => r.rating === s).length,
  }))

  const amenities: string[] = Array.isArray(hotel.amenities)
    ? hotel.amenities
    : typeof hotel.amenities === 'string'
    ? JSON.parse(hotel.amenities)
    : []

  const policies =
    typeof hotel.policies === 'string'
      ? JSON.parse(hotel.policies)
      : hotel.policies ?? {}

  return (
    <div>
      {/* Tab Nav */}
      <div className="border-b border-[#1B2A4A]/10 mb-8">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-[#C9A84C] text-[#1B2A4A]'
                  : 'border-transparent text-[#1B2A4A]/50 hover:text-[#1B2A4A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Description */}
          {hotel.description && (
            <div>
              <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-3">
                About This Hotel
              </h2>
              <p className="text-[#1B2A4A]/70 leading-relaxed">{hotel.description}</p>
            </div>
          )}

          {/* Check-in/out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#1B2A4A]/8">
              <p className="text-xs text-[#1B2A4A]/40 uppercase tracking-wider mb-1">Check-in</p>
              <p className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-semibold">
                {hotel.check_in_time?.slice(0, 5) ?? '12:00'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#1B2A4A]/8">
              <p className="text-xs text-[#1B2A4A]/40 uppercase tracking-wider mb-1">Check-out</p>
              <p className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-semibold">
                {hotel.check_out_time?.slice(0, 5) ?? '11:00'}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-4">
                Amenities
              </h2>
              <AmenitiesList amenities={amenities} />
            </div>
          )}

          {/* Policies */}
          {Object.keys(policies).length > 0 && (
            <div>
              <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-4">
                Policies
              </h2>
              <PoliciesAccordion policies={policies} />
            </div>
          )}
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-6">
            Available Rooms
          </h2>
          {rooms.length === 0 ? (
            <p className="text-[#1B2A4A]/50 text-center py-16">
              No rooms available at this time.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((room: any, idx: number) => {
                const minRoomPrice = Math.min(...rooms.map((r: any) => r.base_price))
                const isCheapest = room.base_price === minRoomPrice
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    hotelSlug={hotel.slug}
                    isBestValue={isCheapest}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Location Tab */}
      {activeTab === 'location' && (
        <div className="space-y-6">
          <HotelMap mapEmbedCode={hotel.map_embed_code ?? null} />

          <div className="bg-white rounded-xl p-6 border border-[#1B2A4A]/8">
            <h3 className="font-['Playfair_Display'] text-xl text-[#1B2A4A] font-bold mb-4">
              Contact & Address
            </h3>
            <div className="space-y-3 text-sm text-[#1B2A4A]/70">
              <p className="flex items-start gap-2">
                <span className="text-[#C9A84C] mt-0.5">📍</span>
                <span>{hotel.address}, {hotel.city}, {hotel.state} – {hotel.pincode}</span>
              </p>
              <a
                href={`tel:${hotel.phone}`}
                className="flex items-center gap-2 hover:text-[#1B2A4A] transition-colors"
              >
                <span className="text-[#C9A84C]">📞</span>
                <span>{hotel.phone}</span>
              </a>
              <a
                href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g, '')}?text=Hello, I'd like to enquire about booking at ${hotel.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#1B2A4A] transition-colors"
              >
                <span className="text-[#C9A84C]">💬</span>
                <span>WhatsApp Us</span>
              </a>
              <a
                href={`mailto:${hotel.email}`}
                className="flex items-center gap-2 hover:text-[#1B2A4A] transition-colors"
              >
                <span className="text-[#C9A84C]">✉️</span>
                <span>{hotel.email}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-8">
          {/* Overall Rating */}
          <div className="bg-white rounded-2xl p-6 border border-[#1B2A4A]/8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="text-center">
                <p className="font-['Playfair_Display'] text-6xl font-bold text-[#1B2A4A]">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(avgRating) ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-[#1B2A4A]/20'}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#1B2A4A]/40 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Star breakdown */}
              <div className="flex-1 space-y-2 justify-center flex flex-col">
                {starCounts.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-[#1B2A4A]/50 w-4">{star}</span>
                    <Star size={12} className="text-[#C9A84C] fill-[#C9A84C]" />
                    <StarBar count={count} total={reviews.length} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          {reviews.length === 0 ? (
            <p className="text-center text-[#1B2A4A]/40 py-12">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl p-6 border border-[#1B2A4A]/8"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {review.reviewer_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-[#1B2A4A] text-sm">{review.reviewer_name}</p>
                        <p className="text-xs text-[#1B2A4A]/40">
                          {review.review_date
                            ? new Date(review.review_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </p>
                      </div>
                      <div className="flex gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={
                              s <= review.rating
                                ? 'text-[#C9A84C] fill-[#C9A84C]'
                                : 'text-[#1B2A4A]/20'
                            }
                          />
                        ))}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-[#1B2A4A]/70 leading-relaxed">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Owner Reply */}
                  {review.owner_reply && (
                    <div className="mt-4 ml-13 pl-4 border-l-2 border-[#C9A84C]/40">
                      <p className="text-xs font-semibold text-[#1B2A4A] mb-1">
                        Response from Management
                      </p>
                      <p className="text-sm text-[#1B2A4A]/60">{review.owner_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 360 Tour Tab */}
      {activeTab === 'tour' && hotel.tour_embed_code && (
        <div>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-4">
            360° Virtual Tour
          </h2>
          <div
            className="w-full rounded-2xl overflow-hidden aspect-video"
            dangerouslySetInnerHTML={{ __html: hotel.tour_embed_code }}
          />
        </div>
      )}
    </div>
  )
}
