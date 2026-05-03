// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { requireAdminSession } from '@/lib/auth/session'

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
// Revenue, occupancy, RevPAR per hotel for a given date range.
// All monetary values in INR. All rates as decimals (0–1).

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseServiceClient()
    const { searchParams } = new URL(req.url)

    // Default to current calendar month
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const date_from = searchParams.get('date_from') ?? defaultFrom
    const date_to = searchParams.get('date_to') ?? defaultTo
    const hotel_id = searchParams.get('hotel_id')

    // Validate date range (max 366 days to prevent abuse)
    const fromMs = new Date(date_from).getTime()
    const toMs = new Date(date_to).getTime()
    if (isNaN(fromMs) || isNaN(toMs) || toMs < fromMs) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }
    if (toMs - fromMs > 366 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Date range cannot exceed 366 days' }, { status: 400 })
    }

    // Fetch hotels in scope
    let hotelsQuery = supabase
      .from('hotels')
      .select('id, name, city, area, total_rooms')
      .eq('is_deleted', false)
      .eq('is_active', true)

    if (session.role !== 'superadmin' && session.role !== 'admin') {
      if (!session.hotel_id) {
        return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 })
      }
      hotelsQuery = hotelsQuery.eq('id', session.hotel_id)
    } else if (hotel_id) {
      hotelsQuery = hotelsQuery.eq('id', hotel_id)
    }

    const { data: hotels, error: hotelsErr } = await hotelsQuery
    if (hotelsErr || !hotels) {
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    const hotelIds = hotels.map((h) => h.id)

    // Fetch all paid bookings in date range
    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select(
        `
        id, hotel_id, room_id, check_in_date, check_out_date,
        number_of_nights, final_amount, gst_amount, discount_amount,
        status, payment_status, source, created_at
        `
      )
      .in('hotel_id', hotelIds)
      .in('payment_status', ['paid', 'partial'])
      .not('status', 'in', '("cancelled","no_show")')
      .gte('check_in_date', date_from)
      .lte('check_in_date', date_to)
      .eq('is_deleted', false)

    if (bookingsErr) {
      console.error('[GET /api/admin/analytics] bookings error:', bookingsErr)
      return NextResponse.json({ error: 'Failed to fetch booking data' }, { status: 500 })
    }

    // Fetch availability totals for occupancy calculation
    const { data: availability, error: availErr } = await supabase
      .from('availability')
      .select('hotel_id, room_id, date, total_rooms, booked_rooms')
      .in('hotel_id', hotelIds)
      .gte('date', date_from)
      .lte('date', date_to)

    if (availErr) {
      console.error('[GET /api/admin/analytics] availability error:', availErr)
    }

    const days =
      Math.round((new Date(date_to).getTime() - new Date(date_from).getTime()) / 86400000) + 1

    // Compute per-hotel metrics
    const hotelMetrics = hotels.map((hotel) => {
      const hBookings = (bookings ?? []).filter((b) => b.hotel_id === hotel.id)
      const hAvail = (availability ?? []).filter((a) => a.hotel_id === hotel.id)

      const totalRevenue = hBookings.reduce((sum, b) => sum + Number(b.final_amount ?? 0), 0)
      const totalGST = hBookings.reduce((sum, b) => sum + Number(b.gst_amount ?? 0), 0)
      const totalDiscount = hBookings.reduce((sum, b) => sum + Number(b.discount_amount ?? 0), 0)
      const netRevenue = totalRevenue - totalGST
      const totalNights = hBookings.reduce((sum, b) => sum + Number(b.number_of_nights ?? 0), 0)

      // Occupancy: total booked room-nights / total available room-nights
      const totalAvailableRoomNights =
        hAvail.reduce((sum, a) => sum + Number(a.total_rooms ?? 0), 0) ||
        hotel.total_rooms * days

      const totalBookedRoomNights = hAvail.reduce(
        (sum, a) => sum + Number(a.booked_rooms ?? 0),
        0
      )

      const occupancyRate =
        totalAvailableRoomNights > 0 ? totalBookedRoomNights / totalAvailableRoomNights : 0

      // ADR: Average Daily Rate = Revenue / Booked room-nights
      const adr = totalNights > 0 ? totalRevenue / totalNights : 0

      // RevPAR: ADR × Occupancy
      const revpar = adr * occupancyRate

      // Source breakdown
      const sourceBreakdown = hBookings.reduce<Record<string, number>>((acc, b) => {
        acc[b.source] = (acc[b.source] ?? 0) + 1
        return acc
      }, {})

      // Revenue by day (last 30 days or range)
      const revenueByDay = hBookings.reduce<Record<string, number>>((acc, b) => {
        const day = b.check_in_date
        acc[day] = (acc[day] ?? 0) + Number(b.final_amount ?? 0)
        return acc
      }, {})

      return {
        hotel_id: hotel.id,
        hotel_name: hotel.name,
        city: hotel.city,
        total_rooms: hotel.total_rooms,
        metrics: {
          total_bookings: hBookings.length,
          total_revenue: Math.round(totalRevenue * 100) / 100,
          net_revenue: Math.round(netRevenue * 100) / 100,
          total_gst_collected: Math.round(totalGST * 100) / 100,
          total_discount_given: Math.round(totalDiscount * 100) / 100,
          total_room_nights: totalNights,
          occupancy_rate: Math.round(occupancyRate * 10000) / 100, // percentage
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
        },
        source_breakdown: sourceBreakdown,
        revenue_by_day: revenueByDay,
      }
    })

    // Portfolio totals
    const portfolio = hotelMetrics.reduce(
      (acc, h) => ({
        total_bookings: acc.total_bookings + h.metrics.total_bookings,
        total_revenue: acc.total_revenue + h.metrics.total_revenue,
        net_revenue: acc.net_revenue + h.metrics.net_revenue,
        total_gst_collected: acc.total_gst_collected + h.metrics.total_gst_collected,
        total_discount_given: acc.total_discount_given + h.metrics.total_discount_given,
        total_room_nights: acc.total_room_nights + h.metrics.total_room_nights,
      }),
      {
        total_bookings: 0,
        total_revenue: 0,
        net_revenue: 0,
        total_gst_collected: 0,
        total_discount_given: 0,
        total_room_nights: 0,
      }
    )

    return NextResponse.json({
      date_range: { from: date_from, to: date_to, days },
      portfolio,
      hotels: hotelMetrics,
    })
  } catch (err) {
    console.error('[GET /api/admin/analytics] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
