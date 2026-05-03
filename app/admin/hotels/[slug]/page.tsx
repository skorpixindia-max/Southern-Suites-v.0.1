import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HotelGallery from '@/components/hotel/HotelGallery'
import HotelSidebar from '@/components/hotel/HotelSidebar'
import HotelDetailTabs from './HotelDetailTabs'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'

type Props = {
  params: { slug: string }
}

async function getHotel(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hotels')
    .select(
      `
      *,
      hotel_images (id, image_url, alt_text, caption, category, is_primary, sort_order),
      rooms (
        *,
        room_images (id, image_url, alt_text, is_primary, sort_order),
        availability (date, available_rooms)
      ),
      reviews (
        id, reviewer_name, reviewer_photo, rating, review_text,
        review_date, owner_reply, owner_reply_date, is_featured, source
      )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hotel = await getHotel(params.slug)
  if (!hotel) return { title: 'Hotel Not Found | Southern Suites' }

  return {
    title: hotel.seo_title || `${hotel.name} | Southern Suites`,
    description:
      hotel.seo_description ||
      hotel.short_description ||
      `Book ${hotel.name} in ${hotel.city}, Andhra Pradesh. Best rates guaranteed when you book direct.`,
    openGraph: {
      title: hotel.seo_title || hotel.name,
      description: hotel.seo_description || hotel.short_description || '',
      images: hotel.hotel_images
        ?.filter((img: any) => img.is_primary)
        .map((img: any) => ({ url: img.image_url, alt: img.alt_text || hotel.name })),
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  const supabase = createClient()
  const { data } = await supabase
    .from('hotels')
    .select('slug')
    .eq('is_active', true)
    .eq('is_deleted', false)

  return (data ?? []).map((h: { slug: string }) => ({ slug: h.slug }))
}

export default async function HotelDetailPage({ params }: Props) {
  const hotel = await getHotel(params.slug)
  if (!hotel) notFound()

  // Sort images by sort_order, primary first
  const images = [...(hotel.hotel_images ?? [])].sort((a: any, b: any) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  // Get cheapest room price
  const roomPrices = (hotel.rooms ?? [])
    .filter((r: any) => r.is_active && !r.is_deleted)
    .map((r: any) => r.base_price)
  const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : null

  const activeRooms = (hotel.rooms ?? []).filter((r: any) => r.is_active && !r.is_deleted)

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Gallery */}
      <HotelGallery images={images} hotelName={hotel.name} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hotel Title */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-1">
                    {hotel.city}, Andhra Pradesh
                  </p>
                  <h1 className="font-['Playfair_Display'] text-3xl lg:text-4xl text-[#1B2A4A] font-bold leading-tight">
                    {hotel.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    {Array.from({ length: hotel.star_rating }).map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 text-[#C9A84C]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-[#1B2A4A]/50 ml-1">
                      {hotel.star_rating}-Star Hotel
                    </span>
                  </div>
                </div>

                {minPrice && (
                  <div className="text-right">
                    <p className="text-xs text-[#1B2A4A]/50 uppercase tracking-wider">From</p>
                    <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1B2A4A]">
                      ₹{minPrice.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#1B2A4A]/50">per night</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs: Overview, Rooms, Location, Reviews, 360 Tour */}
            <Suspense fallback={<LoadingSkeleton count={3} />}>
              <HotelDetailTabs hotel={hotel} rooms={activeRooms} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 xl:w-96 shrink-0">
            <HotelSidebar hotel={hotel} minPrice={minPrice} />
          </div>
        </div>
      </div>
    </main>
  )
}
