import { adminClient } from '@/lib/supabase/admin'
import type { Room, RoomWithImages } from '@/types/database'

export async function getRoomsByHotel(hotelId: string): Promise<RoomWithImages[]> {
  const { data, error } = await adminClient
    .from('rooms')
    .select('*, room_images(*)')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('base_price', { ascending: true })

  if (error) throw new Error(`getRoomsByHotel: ${error.message}`)
  return data
}

export async function getRoomsByHotelAdmin(hotelId: string): Promise<RoomWithImages[]> {
  const { data, error } = await adminClient
    .from('rooms')
    .select('*, room_images(*)')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .order('base_price', { ascending: true })

  if (error) throw new Error(`getRoomsByHotelAdmin: ${error.message}`)
  return data
}

export async function getRoomById(id: string): Promise<RoomWithImages | null> {
  const { data, error } = await adminClient
    .from('rooms')
    .select('*, room_images(*)')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getRoomById: ${error.message}`)
  }
  return data
}

export async function getRoomBySlug(
  hotelId: string,
  slug: string
): Promise<RoomWithImages | null> {
  const { data, error } = await adminClient
    .from('rooms')
    .select('*, room_images(*)')
    .eq('hotel_id', hotelId)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getRoomBySlug: ${error.message}`)
  }
  return data
}

export async function createRoom(
  data: Omit<Room, 'id' | 'created_at' | 'updated_at'>
): Promise<Room> {
  const { data: room, error } = await adminClient
    .from('rooms')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createRoom: ${error.message}`)
  return room
}

export async function updateRoom(
  id: string,
  data: Partial<Omit<Room, 'id' | 'created_at'>>
): Promise<Room> {
  const { data: room, error } = await adminClient
    .from('rooms')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateRoom: ${error.message}`)
  return room
}

export async function softDeleteRoom(id: string): Promise<void> {
  const { error } = await adminClient
    .from('rooms')
    .update({
      is_deleted: true,
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`softDeleteRoom: ${error.message}`)
}

export async function addRoomImage(data: {
  room_id: string
  hotel_id: string
  image_url: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
}): Promise<void> {
  if (data.is_primary) {
    await adminClient
      .from('room_images')
      .update({ is_primary: false })
      .eq('room_id', data.room_id)
  }

  const { error } = await adminClient.from('room_images').insert(data)
  if (error) throw new Error(`addRoomImage: ${error.message}`)
}

export async function deleteRoomImage(id: string): Promise<void> {
  const { error } = await adminClient
    .from('room_images')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteRoomImage: ${error.message}`)
}

export async function getAllRoomsAdmin(): Promise<(Room & { hotel_name: string })[]> {
  const { data, error } = await adminClient
    .from('rooms')
    .select('*, hotels(name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getAllRoomsAdmin: ${error.message}`)

  return data.map((r: Room & { hotels: { name: string } }) => ({
    ...r,
    hotel_name: r.hotels?.name ?? '',
  }))
}
