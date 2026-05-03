// app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { fetchGoogleReviews } from '@/lib/google/places'
import { logAudit } from '@/lib/audit'

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const hotel_id = searchParams.get('hotel_id')
    const rating = searchParams.get('rating')
    const is_featured = searchParams.get('is_featured')
    const source = searchParams.get('source')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
    const offset = (page - 1) * limit

    let query = supabase
      .from('reviews')
      .select(
        `
        id, hotel_id, google_review_id, reviewer_name, reviewer_photo,
        rating, review_text, review_date, owner_reply, owner_reply_date,
        is_featured, source, fetched_at, created_at, updated_at,
        hotel:hotels(id, name, city)
        `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)
      .order('review_date', { ascending: false })

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.eq('hotel_id', session.hotel_id)
    } else if (hotel_id) {
      query = query.eq('hotel_id', hotel_id)
    }

    if (rating) query = query.eq('rating', parseInt(rating))
    if (is_featured !== null && is_featured !== '') {
      query = query.eq('is_featured', is_featured === 'true')
    }
    if (source) query = query.eq('source', source)

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/reviews]', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({
      reviews: data ?? [],
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
    console.error('[GET /api/admin/reviews] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/reviews ──────────────────────────────────────────────────
// Trigger Google Places API fetch and upsert reviews into DB.
// Body: { hotel_id: string }

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { hotel_id?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const hotel_id =
      session.role !== 'superadmin' && session.role !== 'admin'
        ? session.hotel_id
        : body.hotel_id

    if (!hotel_id) {
      return NextResponse.json({ error: 'hotel_id is required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()

    // Get hotel's Google Place ID and API key
    const { data: hotel, error: hotelErr } = await supabase
      .from('hotels')
      .select('id, name, google_place_id')
      .eq('id', hotel_id)
      .eq('is_deleted', false)
      .single()

    if (hotelErr || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    if (!hotel.google_place_id) {
      return NextResponse.json(
        { error: 'Hotel does not have a Google Place ID configured' },
        { status: 422 }
      )
    }

    // Get API key from settings
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .is('hotel_id', null)
      .eq('key', 'google_places_api_key')
      .single()

    const apiKey = setting?.value
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured in settings' },
        { status: 503 }
      )
    }

    // Fetch from Google Places
    const reviews = await fetchGoogleReviews(hotel.google_place_id, apiKey)

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ message: 'No reviews found on Google Places', synced: 0 })
    }

    // Upsert reviews
    const upsertRows = reviews.map((r) => ({
      hotel_id,
      google_review_id: r.google_review_id,
      reviewer_name: r.reviewer_name,
      reviewer_photo: r.reviewer_photo ?? null,
      rating: r.rating,
      review_text: r.review_text ?? null,
      review_date: r.review_date,
      source: 'google' as const,
      fetched_at: new Date().toISOString(),
    }))

    const { error: upsertErr } = await supabase
      .from('reviews')
      .upsert(upsertRows, { onConflict: 'google_review_id', ignoreDuplicates: false })

    if (upsertErr) {
      console.error('[POST /api/admin/reviews] upsert error:', upsertErr)
      return NextResponse.json({ error: 'Failed to save reviews' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: hotel_id,
      action: 'SYNC_REVIEWS',
      entityType: 'review',
      newValue: { synced: reviews.length, hotel: hotel.name },
    })

    return NextResponse.json({ message: 'Reviews synced successfully', synced: reviews.length })
  } catch (err) {
    console.error('[POST /api/admin/reviews] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
