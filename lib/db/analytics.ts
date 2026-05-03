import { adminClient } from '@/lib/supabase/admin'

export interface RevenueStats {
  total_revenue: number
  total_bookings: number
  confirmed_bookings: number
  cancelled_bookings: number
  avg_booking_value: number
  avg_length_of_stay: number
}

export interface OccupancyStats {
  hotel_id: string
  hotel_name: string
  total_rooms: number
  occupied_rooms: number
  occupancy_rate: number
  date: string
}

export interface DailyRevenue {
  date: string
  revenue: number
  bookings: number
}

export interface ADRStats {
  adr: number
  revpar: number
  total_rooms: number
  occupied_rooms: number
  occupancy_rate: number
}

export async function getRevenueStats(
  hotelId?: string,
  fromDate?: string,
  toDate?: string
): Promise<RevenueStats> {
  const from = fromDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const to = toDate ?? new Date().toISOString().split('T')[0]

  let query = adminClient
    .from('bookings')
    .select('final_amount, status, number_of_nights')
    .eq('is_deleted', false)
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getRevenueStats: ${error.message}`)

  const confirmed = data.filter((b) => b.status !== 'cancelled')
  const cancelled = data.filter((b) => b.status === 'cancelled')
  const totalRevenue = confirmed
    .filter((b) => b.status !== 'pending')
    .reduce((sum, b) => sum + b.final_amount, 0)

  const avgNights =
    confirmed.length > 0
      ? confirmed.reduce((sum, b) => sum + (b.number_of_nights ?? 1), 0) / confirmed.length
      : 0

  return {
    total_revenue: totalRevenue,
    total_bookings: data.length,
    confirmed_bookings: confirmed.length,
    cancelled_bookings: cancelled.length,
    avg_booking_value: confirmed.length > 0 ? totalRevenue / confirmed.length : 0,
    avg_length_of_stay: Math.round(avgNights * 10) / 10,
  }
}

export async function getDailyRevenue(
  hotelId?: string,
  fromDate?: string,
  toDate?: string
): Promise<DailyRevenue[]> {
  const from = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = toDate ?? new Date().toISOString().split('T')[0]

  let query = adminClient
    .from('bookings')
    .select('final_amount, created_at, status')
    .eq('is_deleted', false)
    .eq('payment_status', 'paid')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getDailyRevenue: ${error.message}`)

  const grouped: Record<string, DailyRevenue> = {}

  data.forEach((booking) => {
    const date = booking.created_at.split('T')[0]
    if (!grouped[date]) {
      grouped[date] = { date, revenue: 0, bookings: 0 }
    }
    grouped[date].revenue += booking.final_amount
    grouped[date].bookings += 1
  })

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getMonthlyRevenue(
  hotelId?: string,
  year?: number
): Promise<DailyRevenue[]> {
  const targetYear = year ?? new Date().getFullYear()
  const from = `${targetYear}-01-01`
  const to = `${targetYear}-12-31`

  let query = adminClient
    .from('bookings')
    .select('final_amount, created_at')
    .eq('is_deleted', false)
    .eq('payment_status', 'paid')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getMonthlyRevenue: ${error.message}`)

  const grouped: Record<string, DailyRevenue> = {}

  data.forEach((booking) => {
    const month = booking.created_at.slice(0, 7)
    if (!grouped[month]) {
      grouped[month] = { date: month, revenue: 0, bookings: 0 }
    }
    grouped[month].revenue += booking.final_amount
    grouped[month].bookings += 1
  })

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getOccupancyStats(
  date?: string,
  hotelId?: string
): Promise<OccupancyStats[]> {
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  let hotelsQuery = adminClient
    .from('hotels')
    .select('id, name, total_rooms')
    .eq('is_deleted', false)
    .eq('is_active', true)

  if (hotelId) hotelsQuery = hotelsQuery.eq('id', hotelId)

  const { data: hotels, error: hotelsError } = await hotelsQuery
  if (hotelsError) throw new Error(`getOccupancyStats hotels: ${hotelsError.message}`)

  const stats = await Promise.all(
    hotels.map(async (hotel) => {
      const { count } = await adminClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', hotel.id)
        .eq('is_deleted', false)
        .in('status', ['confirmed', 'checked_in'])
        .lte('check_in_date', targetDate)
        .gt('check_out_date', targetDate)

      const occupied = count ?? 0
      const rate = hotel.total_rooms > 0
        ? Math.round((occupied / hotel.total_rooms) * 100)
        : 0

      return {
        hotel_id: hotel.id,
        hotel_name: hotel.name,
        total_rooms: hotel.total_rooms,
        occupied_rooms: occupied,
        occupancy_rate: rate,
        date: targetDate,
      }
    })
  )

  return stats
}

export async function getADRAndRevPAR(
  hotelId: string,
  fromDate: string,
  toDate: string
): Promise<ADRStats> {
  const { data: hotel, error: hotelError } = await adminClient
    .from('hotels')
    .select('total_rooms')
    .eq('id', hotelId)
    .single()

  if (hotelError) throw new Error(`getADRAndRevPAR hotel: ${hotelError.message}`)

  const { data: bookings, error } = await adminClient
    .from('bookings')
    .select('room_price_per_night, number_of_nights')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .eq('payment_status', 'paid')
    .not('status', 'in', '("cancelled","no_show")')
    .gte('check_in_date', fromDate)
    .lte('check_out_date', toDate)

  if (error) throw new Error(`getADRAndRevPAR bookings: ${error.message}`)

  const totalNightsSold = bookings.reduce((sum, b) => sum + (b.number_of_nights ?? 1), 0)
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + b.room_price_per_night * (b.number_of_nights ?? 1),
    0
  )

  const daysInRange = Math.ceil(
    (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const totalAvailableRoomNights = hotel.total_rooms * daysInRange
  const adr = totalNightsSold > 0 ? totalRevenue / totalNightsSold : 0
  const occupancyRate = totalAvailableRoomNights > 0
    ? totalNightsSold / totalAvailableRoomNights
    : 0
  const revpar = adr * occupancyRate

  return {
    adr: Math.round(adr),
    revpar: Math.round(revpar),
    total_rooms: hotel.total_rooms,
    occupied_rooms: totalNightsSold,
    occupancy_rate: Math.round(occupancyRate * 100),
  }
}

export async function getTopBookingSources(
  hotelId?: string,
  fromDate?: string,
  toDate?: string
): Promise<{ source: string; count: number; revenue: number }[]> {
  const from = fromDate ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const to = toDate ?? new Date().toISOString().split('T')[0]

  let query = adminClient
    .from('bookings')
    .select('source, final_amount')
    .eq('is_deleted', false)
    .eq('payment_status', 'paid')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getTopBookingSources: ${error.message}`)

  const grouped: Record<string, { count: number; revenue: number }> = {}

  data.forEach((b) => {
    if (!grouped[b.source]) grouped[b.source] = { count: 0, revenue: 0 }
    grouped[b.source].count += 1
    grouped[b.source].revenue += b.final_amount
  })

  return Object.entries(grouped)
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getDashboardSummary(hotelId?: string): Promise<{
  today_revenue: number
  today_checkins: number
  today_checkouts: number
  current_occupancy: number
  pending_bookings: number
  month_revenue: number
  total_guests: number
}> {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const buildQuery = (table: 'bookings' | 'guests') => {
    const q = adminClient.from(table).select('*', { count: 'exact', head: true })
    return q
  }

  let todayRevQuery = adminClient
    .from('bookings')
    .select('final_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .eq('is_deleted', false)

  let monthRevQuery = adminClient
    .from('bookings')
    .select('final_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', `${monthStart}T00:00:00`)
    .eq('is_deleted', false)

  let checkInsQuery = buildQuery('bookings')
    .eq('check_in_date', today)
    .in('status', ['confirmed', 'checked_in'])
    .eq('is_deleted', false)

  let checkOutsQuery = buildQuery('bookings')
    .eq('check_out_date', today)
    .in('status', ['confirmed', 'checked_in'])
    .eq('is_deleted', false)

  let pendingQuery = buildQuery('bookings')
    .eq('status', 'pending')
    .eq('is_deleted', false)

  let occupancyQuery = buildQuery('bookings')
    .in('status', ['confirmed', 'checked_in'])
    .lte('check_in_date', today)
    .gt('check_out_date', today)
    .eq('is_deleted', false)

  let guestsQuery = buildQuery('guests').eq('is_deleted', false)

  if (hotelId) {
    todayRevQuery = todayRevQuery.eq('hotel_id', hotelId)
    monthRevQuery = monthRevQuery.eq('hotel_id', hotelId)
    checkInsQuery = checkInsQuery.eq('hotel_id', hotelId)
    checkOutsQuery = checkOutsQuery.eq('hotel_id', hotelId)
    pendingQuery = pendingQuery.eq('hotel_id', hotelId)
    occupancyQuery = occupancyQuery.eq('hotel_id', hotelId)
  }

  const [todayRev, monthRev, checkIns, checkOuts, pending, occupancy, guests] =
    await Promise.all([
      todayRevQuery,
      monthRevQuery,
      checkInsQuery,
      checkOutsQuery,
      pendingQuery,
      occupancyQuery,
      guestsQuery,
    ])

  const todayRevenue = (todayRev.data ?? []).reduce((s, b) => s + b.final_amount, 0)
  const monthRevenue = (monthRev.data ?? []).reduce((s, b) => s + b.final_amount, 0)

  return {
    today_revenue: todayRevenue,
    today_checkins: checkIns.count ?? 0,
    today_checkouts: checkOuts.count ?? 0,
    current_occupancy: occupancy.count ?? 0,
    pending_bookings: pending.count ?? 0,
    month_revenue: monthRevenue,
    total_guests: guests.count ?? 0,
  }
}
