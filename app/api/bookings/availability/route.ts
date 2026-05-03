// app/api/bookings/availability/route.ts
// Returns blocked/unavailable dates for a room — used by the date picker calendar.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    const room_id = searchParams.get('room_id')
    const hotel_id = searchParams.get('hotel_id')
    const month = searchParams.get('month') // YYYY-MM, optional window hint
    const months_ahead = Math.min(12, Math.max(1, parseInt(searchParams.get('months_ahead') ?? '3')))

    if (!room_id || !hotel_id) {
      return NextResponse.json(
        { error: 'room_id and hotel_id are required' },
        { status: 400 }
      )
    }

    // UUID format guard
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(room_id) || !UUID_RE.test(hotel_id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Date window
    const from = month ? new Date(`${month}-01`) : new Date()
    from.setDate(1)
    const to = new Date(from)
    to.setMonth(to.getMonth() + months_ahead)
    to.setDate(0) // last day of the final month

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('availability')
      .select('date, total_rooms, booked_rooms, blocked_rooms, available_rooms, is_blocked, block_reason, override_price')
      .eq('hotel_id', hotel_id)
      .eq('room_id', room_id)
      .gte('date', fromStr)
      .lte('date', toStr)
      .order('date', { ascending: true })

    if (error) {
      console.error('[GET /api/bookings/availability]', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    // Separate fully unavailable vs partially available
    const unavailable: string[] = []
    const partial: string[] = []
    const priceOverrides: Record<string, number> = {}

    for (const row of data ?? []) {
      const available = row.available_rooms ?? 0
      if (row.is_blocked || available <= 0) {
        unavailable.push(row.date)
      } else if (available <= Math.ceil((row.total_rooms ?? 1) * 0.2)) {
        // Less than 20% rooms left → warn as partial
        partial.push(row.date)
      }
      if (row.override_price) {
        priceOverrides[row.date] = Number(row.override_price)
      }
    }

    return NextResponse.json({
      room_id,
      hotel_id,
      window: { from: fromStr, to: toStr },
      unavailable_dates: unavailable,
      partial_dates: partial,
      price_overrides: priceOverrides,
    })
  } catch (err) {
    console.error('[GET /api/bookings/availability] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
