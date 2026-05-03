import { adminClient } from '@/lib/supabase/admin'
import type { Staff, StaffRole } from '@/types/database'

export async function getStaffById(id: string): Promise<Staff | null> {
  const { data, error } = await adminClient
    .from('staff')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getStaffById: ${error.message}`)
  }
  return data
}

export async function getStaffByEmail(email: string): Promise<Staff | null> {
  const { data, error } = await adminClient
    .from('staff')
    .select('*')
    .eq('email', email)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getStaffByEmail: ${error.message}`)
  }
  return data
}

export async function getAllStaff(options: {
  hotelId?: string
  role?: StaffRole
  page?: number
  limit?: number
}): Promise<{ staff: Staff[]; total: number }> {
  const { hotelId, role, page = 1, limit = 20 } = options

  let query = adminClient
    .from('staff')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)

  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (role) query = query.eq('role', role)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAllStaff: ${error.message}`)
  return { staff: data ?? [], total: count ?? 0 }
}

export async function createStaff(
  data: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
): Promise<Staff> {
  const { data: staff, error } = await adminClient
    .from('staff')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createStaff: ${error.message}`)
  return staff
}

export async function updateStaff(
  id: string,
  data: Partial<Omit<Staff, 'id' | 'created_at'>>
): Promise<Staff> {
  const { data: staff, error } = await adminClient
    .from('staff')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateStaff: ${error.message}`)
  return staff
}

export async function updateStaffLastLogin(id: string): Promise<void> {
  const { error } = await adminClient
    .from('staff')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`updateStaffLastLogin: ${error.message}`)
}

export async function softDeleteStaff(id: string): Promise<void> {
  const { error } = await adminClient
    .from('staff')
    .update({
      is_deleted: true,
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`softDeleteStaff: ${error.message}`)
}

export async function getStaffByHotel(hotelId: string): Promise<Staff[]> {
  const { data, error } = await adminClient
    .from('staff')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(`getStaffByHotel: ${error.message}`)
  return data
}

export async function getHousekeepingStaff(hotelId: string): Promise<Staff[]> {
  const { data, error } = await adminClient
    .from('staff')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('role', 'housekeeping')
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(`getHousekeepingStaff: ${error.message}`)
  return data
}
