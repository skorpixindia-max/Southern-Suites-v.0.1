import { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HotelCard from '@/components/hotel/HotelCard'
import SearchBar from '@/components/hotel/SearchBar'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import HotelsClientWrapper from './HotelsClientWrapper'

export const metadata: Metadata = {
  title: 'Our Hotels | Southern Suites – 9 Properties Across Andhra Pradesh',
  description:
    'Discover Southern Suites across 9 cities in Andhra Pradesh – Vijayawada, Visakhapatnam, Tirupati, Guntur, Nellore, Kurnool, Kakinada, Rajahmundry & Kadapa. Book direct for the best rates.',
  openGraph: {
    title: 'Our Hotels | Southern Suites',
    description: '9 luxury properties across Andhra Pradesh. Book direct for best rates.',
    type: 'website',
  },
}

async function getHotels() {
  const supabase = createClient()
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select(
      `
      id, name, slug, short_description, city, area, address,
      star_rating, phone, whatsapp_number, amenities,
      hotel_images (image_url, alt_text, is_primary, sort_order),
      rooms (base_price)
    `
    )
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('city', { ascending: true })

  if (error) {
    console.error('Error fetching hotels:', error)
    return []
  }

  return hotels ?? []
}

async function getCities() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hotels')
    .select('city')
    .eq('is_active', true)
    .eq('is_deleted', false)

  if (error || !data) return []

  const unique = [...new Set(data.map((h) => h.city))].sort()
  return unique
}

export default async function HotelsPage() {
  const [hotels, cities] = await Promise.all([getHotels(), getCities()])

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Hero Banner */}
      <section className="relative bg-[#1B2A4A] overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            Southern Suites Collection
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-4xl lg:text-6xl font-bold leading-tight mb-4">
            Our Properties
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Nine handpicked hotels across the heart of Andhra Pradesh — from beachfronts to
            pilgrim towns, business hubs to heritage rivers.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Filters & Grid */}
      <Suspense fallback={<LoadingSkeleton count={9} />}>
        <HotelsClientWrapper hotels={hotels} cities={cities} />
      </Suspense>
    </main>
  )
}
