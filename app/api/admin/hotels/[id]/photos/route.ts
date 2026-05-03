import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { adminClient } from '@/lib/supabase/admin'
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

  const { data, error } = await adminClient
    .from('hotel_images')
    .select('*')
    .eq('hotel_id', params.id)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ images: data })
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || 'general'
  const altText = (formData.get('alt_text') as string) || ''

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' },
      { status: 400 }
    )
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5MB.' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `hotels/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('hotel-images')
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    )
  }

  const { data: urlData } = adminClient.storage
    .from('hotel-images')
    .getPublicUrl(fileName)

  const imageUrl = urlData.publicUrl

  const { count: existingCount } = await adminClient
    .from('hotel_images')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', params.id)

  const isPrimary = (existingCount ?? 0) === 0

  if (isPrimary) {
    await adminClient
      .from('hotel_images')
      .update({ is_primary: false })
      .eq('hotel_id', params.id)
  }

  const { data: image, error: dbError } = await adminClient
    .from('hotel_images')
    .insert({
      hotel_id: params.id,
      image_url: imageUrl,
      alt_text: altText || null,
      category: category as 'general' | 'lobby' | 'restaurant' | 'pool' | 'exterior' | 'amenity',
      is_primary: isPrimary,
      sort_order: existingCount ?? 0,
    })
    .select()
    .single()

  if (dbError) {
    await adminClient.storage.from('hotel-images').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  await logAuditAction({
    staff_id: session.id,
    staff_name: session.name,
    staff_role: session.role,
    hotel_id: params.id,
    action: 'upload_hotel_image',
    entity_type: 'hotel_image',
    entity_id: image.id,
    new_value: { image_url: imageUrl, category },
    ip_address: req.headers.get('x-forwarded-for') ?? undefined,
    user_agent: req.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ image }, { status: 201 })
}
