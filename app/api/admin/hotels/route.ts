// app/api/admin/hotels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────────────────────

const CreateHotelSchema = z.object({
  name: z.string().min(3).max(120),
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  short_description: z.string().max(300).optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  area: z.string().min(2),
  state: z.string().min(2).default('Andhra Pradesh'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
  phone: z.string().regex(/^\+91\d{10}$/, 'Must be +91 followed by 10 digits'),
  whatsapp_number: z
    .string()
    .regex(/^\+91\d{10}$/, 'Must be +91 followed by 10 digits'),
  email: z.string().email(),
  google_place_id: z.string().optional(),
  google_maps_url: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  star_rating: z.number().int().min(1).max(5).default(3),
  check_in_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .default('12:00:00'),
  check_out_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .default('11:00:00'),
  total_rooms: z.number().int().min(1).max(2000),
  pms_type: z.enum(['standalone', 'ezee', 'hotelogix']).default('standalone'),
  ezee_property_id: z.string().optional(),
  ezee_api_key: z.string().optional(),
  gst_number: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .optional(),
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/)
    .optional(),
  amenities: z.array(z.string()).default([]),
  policies: z.record(z.string()).default({}),
  nearby_attractions: z.array(z.string()).default([]),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
  is_active: z.boolean().default(true),
})

// ─── GET /api/admin/hotels ────────────────────────────────────────────────────
// Returns paginated, filterable list of all hotels (including soft-deleted ones
// for superadmin). Managers only see their own hotel.

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit

    const search = searchParams.get('search')?.trim() ?? ''
    const city = searchParams.get('city')?.trim() ?? ''
    const is_active = searchParams.get('is_active')
    const include_deleted = searchParams.get('include_deleted') === 'true'

    let query = supabase
      .from('hotels')
      .select(
        `
        id, name, slug, short_description, city, area, state, pincode,
        phone, whatsapp_number, email, star_rating, total_rooms, pms_type,
        check_in_time, check_out_time, is_active, is_deleted, google_place_id,
        google_maps_url, latitude, longitude, gst_number, amenities,
        created_at, updated_at,
        hotel_images(image_url, is_primary, alt_text)
        `,
        { count: 'exact' }
      )

    // Non-superadmins can only see their own hotel
    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      query = query.eq('id', session.hotel_id)
    }

    // Soft delete filter
    if (!include_deleted || (session.role !== 'superadmin' && session.role !== 'admin')) {
      query = query.eq('is_deleted', false)
    }

    // Active status filter
    if (is_active !== null && is_active !== '') {
      query = query.eq('is_active', is_active === 'true')
    }

    // City filter
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    // Search across name, area, address
    if (search) {
      query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%,city.ilike.%${search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/admin/hotels]', error)
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    return NextResponse.json({
      hotels: data ?? [],
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
    console.error('[GET /api/admin/hotels] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/hotels ───────────────────────────────────────────────────
// Create a new hotel. Superadmin only.

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only superadmin or admin can create hotels' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateHotelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from('hotels')
      .select('id')
      .eq('slug', parsed.data.slug)
      .eq('is_deleted', false)
      .maybeSingle()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A hotel with this slug already exists' },
        { status: 409 }
      )
    }

    const { data: hotel, error } = await supabase
      .from('hotels')
      .insert({
        ...parsed.data,
        amenities: JSON.stringify(parsed.data.amenities),
        policies: JSON.stringify(parsed.data.policies),
        nearby_attractions: JSON.stringify(parsed.data.nearby_attractions),
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/hotels]', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Hotel with this slug or contact already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 })
    }

    await logAudit({
      req,
      staffId: session.id,
      staffName: session.name,
      staffRole: session.role,
      hotelId: hotel.id,
      action: 'CREATE',
      entityType: 'hotel',
      entityId: hotel.id,
      newValue: hotel,
    })

    return NextResponse.json({ hotel }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/hotels] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
