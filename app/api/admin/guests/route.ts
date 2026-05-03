// app/api/admin/guests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'

// ─── GET /api/admin/guests ────────────────────────────────────────────────────
// All guests with full-text search, loyalty tier filter, and pagination.

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
    const offset = (page - 1) * limit

    const search = searchParams.get('search')?.trim() ?? ''
    const loyalty_tier = searchParams.get('loyalty_tier')
    const is_blacklisted = searchParams.get('is_blacklisted')
    const is_verified = searchParams.get('is_verified')
    const sort_by = searchParams.get('sort_by') ?? 'created_at'
    const sort_order = searchParams.get('sort_order') === 'asc' ? true : false

    const ALLOWED_SORT_COLUMNS = [
      'created_at',
      'total_stays',
      'total_spent',
      'loyalty_points',
      'name',
    ]
    const safeSort = ALLOWED_SORT_COLUMNS.includes(sort_by) ? sort_by : 'created_at'

    let query = supabase
      .from('guests')
      .select(
        `
        id, name, email, phone, whatsapp_number, nationality,
        id_proof_type, city, state, company_name, gst_number,
        loyalty_points, loyalty_tier, total_stays, total_spent,
        is_verified, is_blacklisted, blacklist_reason,
        last_login_at, created_at, updated_at
        `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)

    // Search across name, email, phone
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`
      )
    }

    if (loyalty_tier) query = query.eq('loyalty_tier', loyalty_tier)
    if (is_blacklisted !== null && is_blacklisted !== '') {
      query = query.eq('is_blacklisted', is_blacklisted === 'true')
    }
    if (is_verified !== null && is_verified !== '') {
      query = query.eq('is_verified', is_verified === 'true')
    }

    query = query
      .order(safeSort, { ascending: sort_order })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/guests]', error)
      return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
    }

    return NextResponse.json({
      guests: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
        has_next: offset + limit < (count ?? 0),
        has_prev: page > 1,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/guests] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
