import { adminClient } from '@/lib/supabase/admin'
import type { Availability } from '@/types/database'

export async function getAvailability(
  hotelId: string,
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<Availability[]> {
  const { data, error } = await adminClient
    .from('availability')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('room_id', roomId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .order('date', { ascending: true })

  if (error) throw new Error(`getAvailability: ${error.message}`)
  return data
}

export async function isRoomAvailable(
  hotelId: string,
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; minAvailable: number }> {
  const rows = await getAvailability(hotelId, roomId, checkIn, checkOut)

  if (rows.length === 0) {
    const room = await adminClient
      .from('rooms')
      .select('total_count')
      .eq('id', roomId)
      .single()

    if (room.error || !room.data) return { available: false, minAvailable: 0 }
    return { available: true, minAvailable: room.data.total_count }
  }

  const minAvailable = Math.min(...rows.map((r) => r.available_rooms))
  return { available: minAvailable > 0, minAvailable }
}

export async function getBlockedDatesForRoom(
  roomId: string,
  fromDate: string,
  toDate: string
): Promise<string[]> {
  const { data, error } = await adminClient
    .from('availability')
    .select('date, available_rooms, is_blocked')
    .eq('room_id', roomId)
    .gte('date', fromDate)
    .lte('date', toDate)

  if (error) throw new Error(`getBlockedDatesForRoom: ${error.message}`)

  return data
    .filter((row) => row.available_rooms <= 0 || row.is_blocked)
    .map((row) => row.date)
}

export async function incrementBookedRooms(
  hotelId: string,
  roomId: string,
  checkIn: string,
  checkOut: string,
  roomTotalCount: number
): Promise<void> {
  const dates = getDatesInRange(checkIn, checkOut)

  for (const date of dates) {
    const { data: existing } = await adminClient
      .from('availability')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('room_id', roomId)
      .eq('date', date)
      .single()

    if (existing) {
      const { error } = await adminClient
        .from('availability')
        .update({ booked_rooms: existing.booked_rooms + 1 })
        .eq('id', existing.id)

      if (error) throw new Error(`incrementBookedRooms update: ${error.message}`)
    } else {
      const { error } = await adminClient
        .from('availability')
        .insert({
          hotel_id: hotelId,
          room_id: roomId,
          date,
          total_rooms: roomTotalCount,
          booked_rooms: 1,
          blocked_rooms: 0,
        })

      if (error) throw new Error(`incrementBookedRooms insert: ${error.message}`)
    }
  }
}

export async function decrementBookedRooms(
  hotelId: string,
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<void> {
  const dates = getDatesInRange(checkIn, checkOut)

  for (const date of dates) {
    const { data: existing } = await adminClient
      .from('availability')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('room_id', roomId)
      .eq('date', date)
      .single()

    if (existing && existing.booked_rooms > 0) {
      const { error } = await adminClient
        .from('availability')
        .update({ booked_rooms: existing.booked_rooms - 1 })
        .eq('id', existing.id)

      if (error) throw new Error(`decrementBookedRooms: ${error.message}`)
    }
  }
}

export async function blockRoomDates(
  hotelId: string,
  roomId: string,
  dates: string[],
  reason: string,
  roomTotalCount: number
): Promise<void> {
  for (const date of dates) {
    const { data: existing } = await adminClient
      .from('availability')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('room_id', roomId)
      .eq('date', date)
      .single()

    if (existing) {
      await adminClient
        .from('availability')
        .update({ is_blocked: true, block_reason: reason })
        .eq('id', existing.id)
    } else {
      await adminClient.from('availability').insert({
        hotel_id: hotelId,
        room_id: roomId,
        date,
        total_rooms: roomTotalCount,
        booked_rooms: 0,
        blocked_rooms: roomTotalCount,
        is_blocked: true,
        block_reason: reason,
      })
    }
  }
}

export async function unblockRoomDates(
  hotelId: string,
  roomId: string,
  dates: string[]
): Promise<void> {
  const { error } = await adminClient
    .from('availability')
    .update({ is_blocked: false, block_reason: null, blocked_rooms: 0 })
    .eq('hotel_id', hotelId)
    .eq('room_id', roomId)
    .in('date', dates)

  if (error) throw new Error(`unblockRoomDates: ${error.message}`)
}

export async function getAvailabilityCalendar(
  hotelId: string,
  fromDate: string,
  toDate: string
): Promise<Availability[]> {
  const { data, error } = await adminClient
    .from('availability')
    .select('*, rooms(name, room_type)')
    .eq('hotel_id', hotelId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })

  if (error) throw new Error(`getAvailabilityCalendar: ${error.message}`)
  return data
}

function getDatesInRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = []
  const start = new Date(checkIn)
  const end = new Date(checkOut)

  while (start < end) {
    dates.push(start.toISOString().split('T')[0])
    start.setDate(start.getDate() + 1)
  }

  return dates
}
