// lib/audit.ts
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { NextRequest } from 'next/server'

interface AuditPayload {
  req: NextRequest
  staffId: string
  staffName: string
  staffRole: string
  hotelId?: string
  action: string
  entityType: string
  entityId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}

/**
 * Write a row to audit_log. Fire-and-forget — never throws so it never
 * blocks the primary response path.
 */
export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient()

    // Extract IP (respects Vercel / Cloudflare forwarding headers)
    const ip =
      payload.req.headers.get('x-real-ip') ??
      payload.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '0.0.0.0'

    const userAgent = payload.req.headers.get('user-agent') ?? ''

    await supabase.from('audit_log').insert({
      staff_id: payload.staffId,
      staff_name: payload.staffName,
      staff_role: payload.staffRole,
      hotel_id: payload.hotelId ?? null,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId ?? null,
      old_value: payload.oldValue ?? null,
      new_value: payload.newValue ?? null,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Log to console but never rethrow — audit failure must not break API responses
    console.error('[lib/audit] Failed to write audit log:', err)
  }
}
