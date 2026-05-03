import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/booking/BookingForm'

type Props = {
  params: { slug: string }
  searchParams: { room?: string; checkIn?: string; checkOut?: string; adults?: string; children?: string }
}

async function getBookingData(hotelSlug: string, roomId?: string) {
  const supabase = createClient()

  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('id, name, slug, address, city, gst_number, phone, email')
    .eq('slug', hotelSlug)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (hotelError || !hotel) return null

  let room = null
  if (roomId) {
    const { data: roomData } = await supabase
      .from('rooms')
      .select(
        `
        id, name, base_price, weekend_price, gst_rate, max_occupancy,
        bed_type, size_sqft,
        room_images (image_url, alt_text, is_primary)
      `
      )
      .eq('id', roomId)
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    room = roomData ?? null
  }

  // If no specific room, fetch all rooms
  let rooms: any[] = []
  if (!room) {
    const { data: allRooms } = await supabase
      .from('rooms')
      .select(
        `id, name, base_price, gst_rate, max_occupancy, bed_type, size_sqft,
        room_images (image_url, alt_text, is_primary)`
      )
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('base_price', { ascending: true })

    rooms = allRooms ?? []
  }

  return { hotel, room, rooms }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Complete Your Booking | Southern Suites',
    description: 'Secure your hotel booking at Southern Suites. Best rates guaranteed.',
    robots: { index: false },
  }
}

export default async function BookingPage({ params, searchParams }: Props) {
  const data = await getBookingData(params.slug, searchParams.room)
  if (!data) notFound()

  const { hotel, room, rooms } = data

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <div className="bg-[#1B2A4A] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-1">
            Booking
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-2xl lg:text-3xl font-bold">
            {hotel.name}
          </h1>
          <p className="text-white/50 text-sm mt-1">{hotel.address}, {hotel.city}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingForm
          hotel={hotel}
          selectedRoom={room}
          rooms={rooms}
          initialCheckIn={searchParams.checkIn ?? ''}
          initialCheckOut={searchParams.checkOut ?? ''}
          initialAdults={parseInt(searchParams.adults ?? '2')}
          initialChildren={parseInt(searchParams.children ?? '0')}
        />
      </div>
    </main>
  )
}
