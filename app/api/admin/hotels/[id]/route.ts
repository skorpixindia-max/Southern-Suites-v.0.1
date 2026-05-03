import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getHotelById, updateHotel } from '@/lib/db/hotels'
import { logAuditAction } from '@/lib/db/audit'

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

  return NextResponse.json({ hotel })
}

export async function PATCH(
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
    return NextResponse.json({ error: 'Forbidden: you can only edit your own hotel' }, { status: 403 })
  }

  const body = await req.json()

  const forbidden = ['id', 'created_at', 'is_deleted', 'deleted_at']
  for (const key of forbidden) {
    delete body[key]
  }

  const oldHotel = await getHotelById(params.id)
  if (!oldHotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

  const updated = await updateHotel(params.id, body)

  await logAuditAction({
    staff_id: session.id,
    staff_name: session.name,
    staff_role: session.role,
    hotel_id: params.id,
    action: 'update_hotel',
    entity_type: 'hotel',
    entity_id: params.id,
    old_value: oldHotel as unknown as Record<string, unknown>,
    new_value: updated as unknown as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ hotel: updated })
}
