import { adminClient } from '@/lib/supabase/admin'
import type { Housekeeping, HousekeepingStatus, HousekeepingPriority } from '@/types/database'

export async function getHousekeepingByHotel(hotelId: string): Promise<Housekeeping[]> {
  const { data, error } = await adminClient
    .from('housekeeping')
    .select('*, rooms(name, room_type, floor_number), staff:assigned_to(name, phone)')
    .eq('hotel_id', hotelId)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`getHousekeepingByHotel: ${error.message}`)
  return data
}

export async function getHousekeepingByStatus(
  hotelId: string,
  status: HousekeepingStatus
): Promise<Housekeeping[]> {
  const { data, error } = await adminClient
    .from('housekeeping')
    .select('*, rooms(name, room_type), staff:assigned_to(name)')
    .eq('hotel_id', hotelId)
    .eq('status', status)
    .order('priority', { ascending: false })

  if (error) throw new Error(`getHousekeepingByStatus: ${error.message}`)
  return data
}

export async function updateHousekeepingStatus(
  id: string,
  status: HousekeepingStatus,
  updatedBy: string,
  notes?: string
): Promise<Housekeeping> {
  const updateData: Partial<Housekeeping> = {
    status,
    updated_by: updatedBy,
    notes: notes ?? undefined,
  }

  if (status === 'cleaning') updateData.started_at = new Date().toISOString()
  if (status === 'ready') updateData.completed_at = new Date().toISOString()

  const { data, error } = await adminClient
    .from('housekeeping')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateHousekeepingStatus: ${error.message}`)
  return data
}

export async function assignHousekeeping(
  id: string,
  staffId: string,
  priority?: HousekeepingPriority
): Promise<Housekeeping> {
  const { data, error } = await adminClient
    .from('housekeeping')
    .update({ assigned_to: staffId, priority: priority ?? 'normal' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`assignHousekeeping: ${error.message}`)
  return data
}

export async function markRoomDirtyOnCheckout(
  hotelId: string,
  roomId: string,
  roomNumber: string,
  bookingId: string
): Promise<void> {
  const { data: existing } = await adminClient
    .from('housekeeping')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_id', roomId)
    .single()

  if (existing) {
    await adminClient
      .from('housekeeping')
      .update({
        status: 'dirty',
        last_booking_id: bookingId,
        assigned_to: null,
        started_at: null,
        completed_at: null,
        notes: null,
      })
      .eq('id', existing.id)
  } else {
    await adminClient.from('housekeeping').insert({
      hotel_id: hotelId,
      room_id: roomId,
      room_number: roomNumber,
      status: 'dirty',
      last_booking_id: bookingId,
      priority: 'normal',
    })
  }
}

export async function upsertHousekeepingRecord(data: {
  hotel_id: string
  room_id: string
  room_number: string
  status?: HousekeepingStatus
}): Promise<void> {
  const { data: existing } = await adminClient
    .from('housekeeping')
    .select('id')
    .eq('hotel_id', data.hotel_id)
    .eq('room_id', data.room_id)
    .single()

  if (!existing) {
    await adminClient.from('housekeeping').insert({
      hotel_id: data.hotel_id,
      room_id: data.room_id,
      room_number: data.room_number,
      status: data.status ?? 'ready',
      priority: 'normal',
    })
  }
}
