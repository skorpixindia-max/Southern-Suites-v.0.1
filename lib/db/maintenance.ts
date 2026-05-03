import { adminClient } from '@/lib/supabase/admin'
import type { Maintenance, MaintenanceStatus, MaintenancePriority } from '@/types/database'

export async function getMaintenanceByHotel(
  hotelId: string,
  options: { status?: MaintenanceStatus; page?: number; limit?: number } = {}
): Promise<{ issues: Maintenance[]; total: number }> {
  const { status, page = 1, limit = 20 } = options

  let query = adminClient
    .from('maintenance')
    .select('*, rooms(name), reporter:reported_by(name), assignee:assigned_to(name)', {
      count: 'exact',
    })
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)

  if (status) query = query.eq('status', status)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getMaintenanceByHotel: ${error.message}`)
  return { issues: data ?? [], total: count ?? 0 }
}

export async function createMaintenanceIssue(
  data: Omit<Maintenance, 'id' | 'created_at' | 'updated_at'>
): Promise<Maintenance> {
  const { data: issue, error } = await adminClient
    .from('maintenance')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createMaintenanceIssue: ${error.message}`)
  return issue
}

export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceStatus,
  data?: {
    resolution_notes?: string
    actual_cost?: number
    assigned_to?: string
  }
): Promise<Maintenance> {
  const updateData: Partial<Maintenance> = { status, ...data }
  if (status === 'resolved') updateData.resolved_at = new Date().toISOString()

  const { data: issue, error } = await adminClient
    .from('maintenance')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateMaintenanceStatus: ${error.message}`)
  return issue
}

export async function updateMaintenancePriority(
  id: string,
  priority: MaintenancePriority
): Promise<void> {
  const { error } = await adminClient
    .from('maintenance')
    .update({ priority })
    .eq('id', id)

  if (error) throw new Error(`updateMaintenancePriority: ${error.message}`)
}

export async function softDeleteMaintenanceIssue(id: string): Promise<void> {
  const { error } = await adminClient
    .from('maintenance')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeleteMaintenanceIssue: ${error.message}`)
}

export async function getOpenMaintenanceCount(hotelId: string): Promise<number> {
  const { count, error } = await adminClient
    .from('maintenance')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .in('status', ['open', 'in_progress'])

  if (error) throw new Error(`getOpenMaintenanceCount: ${error.message}`)
  return count ?? 0
}
