import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getRoomsByHotelAdmin, createRoom } from '@/lib/db/rooms'
import { getHotelById } from '@/lib/db/hotels'
import { logAuditAction } from '@/lib/db/audit'
import type { RoomType, BedType } from '@/types/database'

const VALID_ROOM_TYPES: RoomType[] = ['standard', 'deluxe', 'super_deluxe', 'suite', 'presidential']
const VALID_BED_TYPES: BedType[] = ['king', 'queen', 'twin', 'double', 'single']

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (session.role === 'manager' && session.hotel_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hotel = await getHotelById(params.id)
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  const rooms = await getRoomsByHotelAdmin(params.id)

  return NextResponse.json({ rooms })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const allowedRoles = ['superadmin', 'admin', 'manager']
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.role === 'manager' && session.hotel_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden: you can only add rooms to your own hotel' }, { status: 403 })
  }

  const hotel = await getHotelById(params.id)
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  const body = await req.json()

  const {
    name,
    slug,
    room_type,
    bed_type,
    base_price,
    weekend_price,
    peak_price,
    max_occupancy,
    total_count,
    size_sqft,
    floor_number,
    short_description,
    description,
    gst_rate,
    amenities,
    inclusions,
    cancellation_policy,
  } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
  }

  if (!base_price || isNaN(Number(base_price)) || Number(base_price) <= 0) {
    return NextResponse.json({ error: 'Valid base price is required' }, { status: 400 })
  }

  if (room_type && !VALID_ROOM_TYPES.includes(room_type)) {
    return NextResponse.json({ error: `Invalid room type. Must be one of: ${VALID_ROOM_TYPES.join(', ')}` }, { status: 400 })
  }

  if (bed_type && !VALID_BED_TYPES.includes(bed_type)) {
    return NextResponse.json({ error: `Invalid bed type. Must be one of: ${VALID_BED_TYPES.join(', ')}` }, { status: 400 })
  }

  const generatedSlug = slug?.trim()
    ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const room = await createRoom({
    hotel_id: params.id,
    name: name.trim(),
    slug: generatedSlug,
    room_type: (room_type as RoomType) ?? 'deluxe',
    bed_type: (bed_type as BedType) ?? null,
    base_price: Number(base_price),
    weekend_price: weekend_price ? Number(weekend_price) : null,
    peak_price: peak_price ? Number(peak_price) : null,
    max_occupancy: Number(max_occupancy) || 2,
    total_count: Number(total_count) || 1,
    size_sqft: size_sqft ? Number(size_sqft) : null,
    floor_number: floor_number ? Number(floor_number) : null,
    short_description: short_description?.trim() ?? null,
    description: description?.trim() ?? null,
    gst_rate: Number(gst_rate) || 12,
    amenities: Array.isArray(amenities) ? amenities : [],
    inclusions: Array.isArray(inclusions) ? inclusions : [],
    cancellation_policy: cancellation_policy?.trim() ?? null,
    is_active: true,
    is_deleted: false,
    deleted_at: null,
  })

  await logAuditAction({
    staff_id: session.id,
    staff_name: session.name,
    staff_role: session.role,
    hotel_id: params.id,
    action: 'create_room',
    entity_type: 'room',
    entity_id: room.id,
    new_value: room as unknown as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ room }, { status: 201 })
}
