// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const UpdateSettingsSchema = z.object({
  hotel_id: z.string().uuid().nullable().optional(),
  settings: z.array(
    z.object({
      key: z.string().min(1).max(100),
      value: z.string().max(2000),
    })
  ).min(1).max(50),
})

// ─── GET /api/admin/settings ──────────────────────────────────────────────────
// Returns all settings. Secrets are masked unless superadmin.

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)
    const hotel_id = searchParams.get('hotel_id')

    let query = supabase
      .from('settings')
      .select('id, hotel_id, key, value, is_secret, description, updated_at')
      .order('key', { ascending: true })

    // Global settings: hotel_id IS NULL
    // Hotel-specific: hotel_id = <id>
    if (hotel_id) {
      query = query.or(`hotel_id.eq.${hotel_id},hotel_id.is.null`)
    } else {
      query = query.is('hotel_id', null)
    }

    // Scope for managers
    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.or(`hotel_id.eq.${session.hotel_id},hotel_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/admin/settings]', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Mask secret values for non-superadmin
    const masked = (data ?? []).map((s) => ({
      ...s,
      value:
        s.is_secret && session.role !== 'superadmin'
          ? s.value
            ? '••••••••'
            : ''
          : s.value,
    }))

    return NextResponse.json({ settings: masked })
  } catch (err) {
    console.error('[GET /api/admin/settings] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/settings ─────────────────────────────────────────────────
// Upsert one or more settings. Superadmin only for secret keys.

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = UpdateSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // Check for secret keys — only superadmin can update them
    const SECRET_KEYS = [
      'razorpay_key_id',
      'razorpay_key_secret',
      'whatsapp_api_token',
      'whatsapp_phone_id',
      'resend_api_key',
      'google_places_api_key',
    ]

    const hasSecretKey = parsed.data.settings.some((s) => SECRET_KEYS.includes(s.key))
    if (hasSecretKey && session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmin can update secret settings' },
        { status: 403 }
      )
    }

    const effectiveHotelId =
      session.role !== 'superadmin' && session.role !== 'admin'
        ? session.hotel_id
        : (parsed.data.hotel_id ?? null)

    const upsertRows = parsed.data.settings.map((s) => ({
      hotel_id: effectiveHotelId,
      key: s.key,
      value: s.value,
      updated_by: session.id,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('settings')
      .upsert(upsertRows, { onConflict: 'hotel_id,key', ignoreDuplicates: false })

    if (error) {
      console.error('[POST /api/admin/settings]', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: effectiveHotelId ?? undefined,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      newValue: {
        keys: parsed.data.settings
          .filter((s) => !SECRET_KEYS.includes(s.key))
          .map((s) => s.key),
      },
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (err) {
    console.error('[POST /api/admin/settings] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
