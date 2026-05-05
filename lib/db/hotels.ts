import { adminClient } from '@/lib/supabase/admin'
import type { Hotel, HotelWithRooms, HotelWithStats } from '@/types/database'

export async function getAllHotels(): Promise<Hotel[]> {
  const { data, error } = await adminClient
    .from('hotels')
    .select('*')
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getAllHotels: ${error.message}`)
  return data
}

export async function getAllHotelsAdmin(): Promise<Hotel[]> {
  const { data, error } = await adminClient
    .from('hotels')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getAllHotelsAdmin: ${error.message}`)
  return data
}

export async function getHotelBySlug(slug: string): Promise<HotelWithRooms | null> {
  const { data, error } = await adminClient
    .from('hotels')
    .select(`
      *,
      rooms (
        *,
        room_images (*)
      ),
      hotel_images (*)
    `)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getHotelBySlug: ${error.message}`)
  }
  return data
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const { data, error } = await adminClient
    .from('hotels')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getHotelById: ${error.message}`)
  }
  return data
}

export async function getHotelsByCity(city: string): Promise<Hotel[]> {
  const { data, error } = await adminClient
    .from('hotels')
    .select('*')
    .ilike('city', `%${city}%`)
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('star_rating', { ascending: false })

  if (error) throw new Error(`getHotelsByCity: ${error.message}`)
  return data
}

export async function getHotelsWithStats(): Promise<HotelWithStats[]> {
  const { data: hotels, error } = await adminClient
    .from('hotels')
    .select(`
      *,
      bookings!hotel_id (
        id,
        status,
        payment_status,
        final_amount,
        created_at
      ),
      reviews!hotel_id (
        rating
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getHotelsWithStats: ${error.message}`)

  const today = new Date().toISOString().split('T')[0]

  return hotels.map((hotel) => {
    const bookings = hotel.bookings ?? []
    const reviews = hotel.reviews ?? []

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const revenueToday = bookings
      .filter(b => b.payment_status === 'paid' && b.created_at?.startsWith(today))
      .reduce((sum, b) => sum + (b.final_amount ?? 0), 0)

    const avgRating = reviews.length
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0

    return {
      ...hotel,
      total_bookings: bookings.length,
      confirmed_bookings: confirmedBookings,
      revenue_today: revenueToday,
      occupancy_rate: hotel.total_rooms > 0
        ? Math.round((confirmedBookings / hotel.total_rooms) * 100)
        : 0,
      average_rating: Math.round(avgRating * 10) / 10,
    }
  })
}

export async function createHotel(
  data: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>
): Promise<Hotel> {
  const { data: hotel, error } = await adminClient
    .from('hotels')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createHotel: ${error.message}`)
  return hotel
}

export async function updateHotel(
  id: string,
  data: Partial<Omit<Hotel, 'id' | 'created_at'>>
): Promise<Hotel> {
  const { data: hotel, error } = await adminClient
    .from('hotels')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateHotel: ${error.message}`)
  return hotel
}

export async function softDeleteHotel(id: string): Promise<void> {
  const { error } = await adminClient
    .from('hotels')
    .update({
      is_deleted: true,
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`softDeleteHotel: ${error.message}`)
}

export async function getHotelSlugs(): Promise<{ slug: string }[]> {
  const { data, error } = await adminClient
    .from('hotels')
    .select('slug')
    .eq('is_deleted', false)
    .eq('is_active', true)

  if (error) throw new Error(`getHotelSlugs: ${error.message}`)
  return data
}
