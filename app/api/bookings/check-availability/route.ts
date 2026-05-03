// app/api/bookings/check-availability/route.ts
// Checks specific date range + room. Returns price quote and availability status.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getGSTRate, applyGST, calculateNights } from '@/lib/utils'
import { z } from 'zod'

const CheckSchema = z.object({
  hotel_id: z.string().uuid(),
  room_id: z.string().uuid(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(1).max(10).default(1),
  children: z.coerce.number().int().min(0).max(6).default(0),
  coupon_code: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const parsed = CheckSchema.safeParse({
      hotel_id: searchParams.get('hotel_id'),
      room_id: searchParams.get('room_id'),
      check_in: searchParams.get('check_in'),
      check_out: searchParams.get('check_out'),
      adults: searchParams.get('adults'),
      children: searchParams.get('children'),
      coupon_code: searchParams.get('coupon_code') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { hotel_id, room_id, check_in, check_out, adults, children, coupon_code } = parsed.data

    // Business rule: check-in must be today or future
    const today = new Date().toISOString().split('T')[0]
    if (check_in < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 422 })
    }

    const nights = calculateNights(check_in, check_out)
    if (nights < 1) {
      return NextResponse.json(
        { error: 'Check-out must be at least one day after check-in' },
        { status: 422 }
      )
    }
    if (nights > 90) {
      return NextResponse.json({ error: 'Maximum stay is 90 nights' }, { status: 422 })
    }

    const supabase = createSupabaseServiceClient()

    // Fetch room details
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, name, room_type, base_price, weekend_price, peak_price, max_occupancy, gst_rate, amenities, inclusions, cancellation_policy')
      .eq('id', room_id)
      .eq('hotel_id', hotel_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found or unavailable' }, { status: 404 })
    }

    if (adults + children > room.max_occupancy) {
      return NextResponse.json(
        { error: `This room supports a maximum of ${room.max_occupancy} guests` },
        { status: 422 }
      )
    }

    // Check availability for each night
    const { data: availability, error: availErr } = await supabase
      .from('availability')
      .select('date, available_rooms, is_blocked, override_price')
      .eq('hotel_id', hotel_id)
      .eq('room_id', room_id)
      .gte('date', check_in)
      .lt('date', check_out) // check_out date itself is not a "stay" night
      .order('date', { ascending: true })

    if (availErr) {
      console.error('[GET /api/bookings/check-availability] avail error:', availErr)
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    // Build a set of all required dates
    const requiredDates = new Set<string>()
    const cur = new Date(check_in)
    const end = new Date(check_out)
    while (cur < end) {
      requiredDates.add(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }

    // Dates not in availability table → no record means no inventory configured
    const availMap = new Map<string, { available: number; is_blocked: boolean; override_price: number | null }>()
    for (const row of availability ?? []) {
      availMap.set(row.date, {
        available: row.available_rooms ?? 0,
        is_blocked: row.is_blocked,
        override_price: row.override_price ? Number(row.override_price) : null,
      })
    }

    const unavailableDates: string[] = []
    for (const date of requiredDates) {
      const slot = availMap.get(date)
      if (!slot || slot.is_blocked || slot.available < 1) {
        unavailableDates.push(date)
      }
    }

    if (unavailableDates.length > 0) {
      return NextResponse.json({
        available: false,
        unavailable_dates: unavailableDates,
        message: `Room is not available for the selected dates`,
      })
    }

    // ── Pricing calculation (server-authoritative) ──────────────────────────

    // Check for active pricing rules
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('hotel_id', hotel_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .or(`room_id.eq.${room_id},room_id.is.null`)
      .order('priority', { ascending: false })

    let totalRoomAmount = 0
    const nightBreakdown: Array<{ date: string; price: number; rule?: string }> = []

    const dateArr = Array.from(requiredDates).sort()
    for (const date of dateArr) {
      const slot = availMap.get(date)
      let price = slot?.override_price ?? Number(room.base_price)

      // Apply the highest-priority matching pricing rule
      if (pricingRules) {
        const dayOfWeek = new Date(date).getDay() // 0=Sun, 6=Sat
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        for (const rule of pricingRules) {
          const inDateRange =
            (!rule.start_date || date >= rule.start_date) &&
            (!rule.end_date || date <= rule.end_date)
          const inDayOfWeek =
            !rule.days_of_week?.length || rule.days_of_week.includes(dayOfWeek)

          if (!inDateRange || !inDayOfWeek) continue
          if (rule.min_nights > nights) continue

          if (rule.price_type === 'fixed') {
            price = Number(rule.price_value)
          } else if (rule.price_type === 'percentage_increase') {
            price = price * (1 + Number(rule.price_value) / 100)
          } else if (rule.price_type === 'percentage_decrease') {
            price = price * (1 - Number(rule.price_value) / 100)
          }

          nightBreakdown.push({ date, price: Math.round(price * 100) / 100, rule: rule.rule_name })
          break
        }

        if (!nightBreakdown.find((n) => n.date === date)) {
          // Weekend price fallback
          if (isWeekend && room.weekend_price) {
            price = Number(room.weekend_price)
          }
          nightBreakdown.push({ date, price: Math.round(price * 100) / 100 })
        }
      } else {
        nightBreakdown.push({ date, price: Math.round(price * 100) / 100 })
      }

      totalRoomAmount += nightBreakdown[nightBreakdown.length - 1].price
    }

    totalRoomAmount = Math.round(totalRoomAmount * 100) / 100

    // ── Coupon application ─────────────────────────────────────────────────
    let couponDiscount = 0
    let couponDetails: Record<string, unknown> | null = null

    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .eq('is_deleted', false)
        .gt('valid_until', new Date().toISOString())
        .or(`hotel_id.eq.${hotel_id},hotel_id.is.null`)
        .maybeSingle()

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 422 })
      }

      if (totalRoomAmount < Number(coupon.minimum_booking ?? 0)) {
        return NextResponse.json(
          {
            error: `Minimum booking amount for this coupon is ₹${coupon.minimum_booking}`,
          },
          { status: 422 }
        )
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 422 })
      }

      if (coupon.discount_type === 'percentage') {
        couponDiscount = (totalRoomAmount * Number(coupon.discount_value)) / 100
        if (coupon.maximum_discount) {
          couponDiscount = Math.min(couponDiscount, Number(coupon.maximum_discount))
        }
      } else {
        couponDiscount = Number(coupon.discount_value)
      }

      couponDiscount = Math.round(couponDiscount * 100) / 100
      couponDetails = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        coupon_discount: couponDiscount,
      }
    }

    // ── GST ────────────────────────────────────────────────────────────────
    const avgNightlyRate = totalRoomAmount / nights
    const gstRate = getGSTRate(avgNightlyRate)
    const discountedAmount = Math.max(0, totalRoomAmount - couponDiscount)
    const { gst, total } = applyGST(discountedAmount, gstRate)

    return NextResponse.json({
      available: true,
      hotel_id,
      room_id,
      check_in,
      check_out,
      nights,
      adults,
      children,
      room: {
        name: room.name,
        room_type: room.room_type,
        max_occupancy: room.max_occupancy,
        amenities: room.amenities,
        inclusions: room.inclusions,
        cancellation_policy: room.cancellation_policy,
      },
      pricing: {
        room_price_per_night: Math.round(avgNightlyRate * 100) / 100,
        total_room_amount: totalRoomAmount,
        coupon_discount: couponDiscount,
        discounted_amount: discountedAmount,
        gst_rate: gstRate,
        gst_amount: gst,
        final_amount: total,
        night_breakdown: nightBreakdown,
        currency: 'INR',
      },
      coupon: couponDetails,
    })
  } catch (err) {
    console.error('[GET /api/bookings/check-availability] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
