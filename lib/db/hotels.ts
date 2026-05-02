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
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getHotelsWithStats: ${error.message}`)

  const today = new Date().toISOString().split('T')[0]

  const hotelsWithStats = await Promise.all(
    hotels.map(async (hotel) => {
      const { count: totalBookings } = await adminClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id)
        .eq('is_deleted', false)

      const { count: confirmedBookings } = await adminClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id)
        .eq('status', 'confirmed')
        .eq('is_deleted', false)

      const { data: todayRevenue } = await adminClient
        .from('bookings')
        .select('final_amount')
        .eq('hotel_id', hotel.id)
        .eq('payment_status', 'paid')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)

      const revenueToday = todayRevenue?.reduce((sum, b) => sum + b.final_amount, 0) ?? 0

      const { data: reviewData } = await adminClient
        .from('reviews')
        .select('rating')
        .eq('hotel_id', hotel.id)
        .eq('is_deleted', false)

      const avgRating = reviewData?.length
        ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
        : 0

      return {
        ...hotel,
        total_bookings: totalBookings ?? 0,
        confirmed_bookings: confirmedBookings ?? 0,
        revenue_today: revenueToday,
        occupancy_rate: hotel.total_rooms > 0
          ? Math.round(((confirmedBookings ?? 0) / hotel.total_rooms) * 100)
          : 0,
        average_rating: Math.round(avgRating * 10) / 10,
      }
    })
  )

  return hotelsWithStats
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
