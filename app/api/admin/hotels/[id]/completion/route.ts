import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (
    session.role === 'manager' &&
    session.hotel_id !== params.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hotelId = params.id

  const [
    { data: hotel },
    { count: imageCount },
    { count: roomCount },
    { count: pricingCount },
  ] = await Promise.all([
    adminClient
      .from('hotels')
      .select('gst_number, seo_title, google_maps_url, is_active, ezee_api_key')
      .eq('id', hotelId)
      .single(),
    adminClient
      .from('hotel_images')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId),
    adminClient
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('is_deleted', false),
    adminClient
      .from('pricing_rules')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .eq('is_deleted', false)
      .eq('is_active', true),
  ])

  const checks: { label: string; passed: boolean }[] = [
    { label: 'Hotel photos', passed: (imageCount ?? 0) > 0 },
    { label: 'Rooms added', passed: (roomCount ?? 0) > 0 },
    { label: 'Pricing rules', passed: (pricingCount ?? 0) > 0 },
    { label: 'GST number', passed: !!hotel?.gst_number },
    { label: 'SEO title', passed: !!hotel?.seo_title },
    { label: 'Google Maps', passed: !!hotel?.google_maps_url },
    { label: 'Property active', passed: !!hotel?.is_active },
  ]

  const passed = checks.filter((c) => c.passed).length
  const score = Math.round((passed / checks.length) * 100)
  const missing = checks.filter((c) => !c.passed).map((c) => c.label)

  return NextResponse.json({ score, missing, total: checks.length, passed })
}
