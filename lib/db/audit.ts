import { adminClient } from '@/lib/supabase/admin'
import type { AuditLog } from '@/types/database'

export async function logAuditAction(data: {
  staff_id?: string
  staff_name?: string
  staff_role?: string
  hotel_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}): Promise<void> {
  const { error } = await adminClient.from('audit_log').insert(data)
  if (error) console.error(`logAuditAction failed: ${error.message}`)
}

export async function getAuditLogs(options: {
  hotelId?: string
  staffId?: string
  entityType?: string
  action?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}): Promise<{ logs: AuditLog[]; total: number }> {
  const { hotelId, staffId, entityType, action, fromDate, toDate, page = 1, limit = 50 } = options

  let query = adminClient
    .from('audit_log')
    .select('*', { count: 'exact' })

  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (staffId) query = query.eq('staff_id', staffId)
  if (entityType) query = query.eq('entity_type', entityType)
  if (action) query = query.eq('action', action)
  if (fromDate) query = query.gte('created_at', `${fromDate}T00:00:00`)
  if (toDate) query = query.lte('created_at', `${toDate}T23:59:59`)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAuditLogs: ${error.message}`)
  return { logs: data ?? [], total: count ?? 0 }
}

export async function getRecentAuditLogs(
  hotelId?: string,
  limit = 20
): Promise<AuditLog[]> {
  let query = adminClient
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (hotelId) query = query.eq('hotel_id', hotelId)

  const { data, error } = await query
  if (error) throw new Error(`getRecentAuditLogs: ${error.message}`)
  return data
}
