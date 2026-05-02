import { adminClient } from '@/lib/supabase/admin'
import type { Booking, BookingWithDetails, BookingStatus, PaymentStatus } from '@/types/database'

export interface BookingFilters {
  hotelId?: string
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  source?: string
  checkInFrom?: string
  checkInTo?: string
  search?: string
  page?: number
  limit?: number
}

export async function createBooking(
  data: Omit<Booking, 'id' | 'number_of_nights' | 'created_at' | 'updated_at' | 'booking_reference'>
): Promise<Booking> {
  const { data: booking, error } = await adminClient
    .from('bookings')
    .insert({ ...data, booking_reference: '' })
    .select()
    .single()

  if (error) throw new Error(`createBooking: ${error.message}`)
  return booking
}

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  const { data, error } = await adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getBookingById: ${error.message}`)
  }
  return data
}

export async function getBookingByReference(reference: string): Promise<BookingWithDetails | null> {
  const { data, error } = await adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `)
    .eq('booking_reference', reference)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getBookingByReference: ${error.message}`)
  }
  return data
}

export async function getBookings(filters: BookingFilters = {}): Promise<{
  bookings: BookingWithDetails[]
  total: number
}> {
  const {
    hotelId,
    status,
    paymentStatus,
    source,
    checkInFrom,
    checkInTo,
    search,
    page = 1,
    limit = 20,
  } = filters

  let query = adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `, { count: 'exact' })
    .eq('is_deleted', false)

  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (status) query = query.eq('status', status)
  if (paymentStatus) query = query.eq('payment_status', paymentStatus)
  if (source) query = query.eq('source', source)
  if (checkInFrom) query = query.gte('check_in_date', checkInFrom)
  if (checkInTo) query = query.lte('check_in_date', checkInTo)
  if (search) query = query.ilike('booking_reference', `%${search}%`)

  const from = (page - 1) * limit
  query = query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`getBookings: ${error.message}`)
  return { bookings: data ?? [], total: count ?? 0 }
}

export async function getBookingsByGuest(guestId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `)
    .eq('guest_id', guestId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getBookingsByGuest: ${error.message}`)
  return data
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  extra?: {
    cancellation_reason?: string
    cancelled_by?: 'guest' | 'staff' | 'system'
    internal_notes?: string
  }
): Promise<Booking> {
  const updateData: Partial<Booking> = { status }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    if (extra?.cancellation_reason) updateData.cancellation_reason = extra.cancellation_reason
    if (extra?.cancelled_by) updateData.cancelled_by = extra.cancelled_by
  }

  if (status === 'checked_in') {
    updateData.checked_in_at = new Date().toISOString()
  }

  if (status === 'checked_out') {
    updateData.checked_out_at = new Date().toISOString()
  }

  if (extra?.internal_notes) updateData.internal_notes = extra.internal_notes

  const { data, error } = await adminClient
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateBookingStatus: ${error.message}`)
  return data
}

export async function updateBookingPaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  const { error } = await adminClient
    .from('bookings')
    .update({ payment_status: paymentStatus })
    .eq('id', id)

  if (error) throw new Error(`updateBookingPaymentStatus: ${error.message}`)
}

export async function updateBooking(
  id: string,
  data: Partial<Omit<Booking, 'id' | 'created_at' | 'number_of_nights'>>
): Promise<Booking> {
  const { data: booking, error } = await adminClient
    .from('bookings')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateBooking: ${error.message}`)
  return booking
}

export async function softDeleteBooking(id: string): Promise<void> {
  const { error } = await adminClient
    .from('bookings')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeleteBooking: ${error.message}`)
}

export async function getTodayCheckIns(hotelId?: string): Promise<BookingWithDetails[]> {
  const today = new Date().toISOString().split('T')[0]

  let query = adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `)
    .eq('check_in_date', today)
    .eq('is_deleted', false)
    .in('status', ['confirmed', 'checked_in'])

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getTodayCheckIns: ${error.message}`)
  return data
}

export async function getTodayCheckOuts(hotelId?: string): Promise<BookingWithDetails[]> {
  const today = new Date().toISOString().split('T')[0]

  let query = adminClient
    .from('bookings')
    .select(`
      *,
      hotel:hotels(id, name, slug, address, phone, whatsapp_number, city, area),
      room:rooms(id, name, room_type, bed_type, max_occupancy),
      guest:guests(id, name, email, phone, loyalty_tier),
      payment:payments(*)
    `)
    .eq('check_out_date', today)
    .eq('is_deleted', false)
    .in('status', ['confirmed', 'checked_in'])

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getTodayCheckOuts: ${error.message}`)
  return data
}

export async function checkOverlappingBookings(
  roomId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<boolean> {
  let query = adminClient
    .from('bookings')
    .select('id')
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .not('status', 'in', '("cancelled","no_show")')
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { data, error } = await query
  if (error) throw new Error(`checkOverlappingBookings: ${error.message}`)
  return (data?.length ?? 0) > 0
}
