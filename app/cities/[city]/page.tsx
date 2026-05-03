import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HotelCard from '@/components/hotel/HotelCard'

type Props = {
  params: { city: string }
}

function decodeCity(slug: string) {
  return decodeURIComponent(slug)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function getHotelsByCity(city: string) {
  const supabase = createClient()
  const { data, error } = await supabase
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
    .ilike('city', city)
    .order('name', { ascending: true })

  if (error) return []
  return data ?? []
}

async function getAllCities() {
  const supabase = createClient()
  const { data } = await supabase
    .from('hotels')
    .select('city')
    .eq('is_active', true)
    .eq('is_deleted', false)
  return [...new Set((data ?? []).map((h: any) => h.city))]
}

export async function generateStaticParams() {
  const cities = await getAllCities()
  return cities.map((city: string) => ({
    city: city.toLowerCase().replace(/\s+/g, '-'),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = decodeCity(params.city)
  return {
    title: `Hotels in ${cityName} | Southern Suites`,
    description: `Find and book the best Southern Suites hotels in ${cityName}, Andhra Pradesh. Best rates guaranteed on direct booking.`,
    openGraph: {
      title: `Hotels in ${cityName} | Southern Suites`,
      description: `Luxury hotels in ${cityName}. Book direct for the best rates.`,
      type: 'website',
    },
  }
}

export default async function CityHotelsPage({ params }: Props) {
  const cityName = decodeCity(params.city)
  const hotels = await getHotelsByCity(cityName)

  if (hotels.length === 0) notFound()

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Hero */}
      <section className="relative bg-[#1B2A4A] overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            Andhra Pradesh
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-4xl lg:text-5xl font-bold leading-tight mb-3">
            Hotels in {cityName}
          </h1>
          <p className="text-white/60 text-base">
            {hotels.length} propert{hotels.length === 1 ? 'y' : 'ies'} available · Book direct
            for best rates
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {hotels.map((hotel: any) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </section>
    </main>
  )
}
