import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { adminClient } from '@/lib/supabase/admin'
import { logAuditAction } from '@/lib/db/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const allowedRoles = ['superadmin', 'admin', 'manager']
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.role === 'manager' && session.hotel_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { is_primary, sort_order, alt_text, category } = body

  const { data: image, error: fetchError } = await adminClient
    .from('hotel_images')
    .select('*')
    .eq('id', params.imageId)
    .eq('hotel_id', params.id)
    .single()

  if (fetchError || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  if (is_primary === true) {
    await adminClient
      .from('hotel_images')
      .update({ is_primary: false })
      .eq('hotel_id', params.id)
      .neq('id', params.imageId)
  }

  const updatePayload: Record<string, unknown> = {}
  if (is_primary !== undefined) updatePayload.is_primary = is_primary
  if (sort_order !== undefined) updatePayload.sort_order = sort_order
  if (alt_text !== undefined) updatePayload.alt_text = alt_text
  if (category !== undefined) updatePayload.category = category

  const { data: updated, error: updateError } = await adminClient
    .from('hotel_images')
    .update(updatePayload)
    .eq('id', params.imageId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await logAuditAction({
    staff_id: session.id,
    staff_name: session.name,
    staff_role: session.role,
    hotel_id: params.id,
    action: 'update_hotel_image',
    entity_type: 'hotel_image',
    entity_id: params.imageId,
    old_value: image as unknown as Record<string, unknown>,
    new_value: updatePayload,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ image: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const allowedRoles = ['superadmin', 'admin', 'manager']
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (session.role === 'manager' && session.hotel_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: image, error: fetchError } = await adminClient
    .from('hotel_images')
    .select('*')
    .eq('id', params.imageId)
    .eq('hotel_id', params.id)
    .single()

  if (fetchError || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const urlParts = image.image_url.split('/hotel-images/')
  if (urlParts.length === 2) {
    const storagePath = urlParts[1]
    await adminClient.storage.from('hotel-images').remove([storagePath])
  }

  const { error: deleteError } = await adminClient
    .from('hotel_images')
    .delete()
    .eq('id', params.imageId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (image.is_primary) {
    const { data: remaining } = await adminClient
      .from('hotel_images')
      .select('id')
      .eq('hotel_id', params.id)
      .order('sort_order', { ascending: true })
      .limit(1)

    if (remaining && remaining.length > 0) {
      await adminClient
        .from('hotel_images')
        .update({ is_primary: true })
        .eq('id', remaining[0].id)
    }
  }

  await logAuditAction({
    staff_id: session.id,
    staff_name: session.name,
    staff_role: session.role,
    hotel_id: params.id,
    action: 'delete_hotel_image',
    entity_type: 'hotel_image',
    entity_id: params.imageId,
    old_value: image as unknown as Record<string, unknown>,
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true })
}
