// app/api/bookings/create/route.ts
// Core booking creation. Server calculates all pricing. Never trusts client amounts.

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getGSTRate, applyGST, calculateNights } from '@/lib/utils'
import { dispatchBookingNotifications } from '@/lib/notifications/dispatcher'
import { z } from 'zod'

// ─── Validation ───────────────────────────────────────────────────────────────

const CreateBookingSchema = z.object({
  hotel_id: z.string().uuid(),
  room_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(6).default(0),
  // Guest details — used to find or create guest
  guest: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+91\d{10}$/, 'Must be +91 followed by 10 digits'),
    email: z.string().email().optional(),
    whatsapp_number: z.string().regex(/^\+91\d{10}$/).optional(),
  }),
  special_requests: z.string().max(500).optional(),
  coupon_code: z.string().max(30).optional(),
  source: z
    .enum(['website', 'walkin', 'phone', 'whatsapp', 'mmt', 'booking_com', 'goibibo', 'agoda', 'other'])
    .default('website'),
  // Loyalty: client declares intent; server validates balance
  loyalty_points_to_use: z.number().int().min(0).default(0),
})

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const {
      hotel_id,
      room_id,
      check_in_date,
      check_out_date,
      adults,
      children,
      guest: guestInput,
      special_requests,
      coupon_code,
      source,
      loyalty_points_to_use,
    } = parsed.data

    // ── Date validation ────────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    if (check_in_date < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 422 })
    }

    const nights = calculateNights(check_in_date, check_out_date)
    if (nights < 1 || nights > 90) {
      return NextResponse.json(
        { error: 'Stay must be between 1 and 90 nights' },
        { status: 422 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // ── Verify hotel exists ────────────────────────────────────────────────
    const { data: hotel, error: hotelErr } = await supabase
      .from('hotels')
      .select('id, name, whatsapp_number, email, check_in_time, check_out_time')
      .eq('id', hotel_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    if (hotelErr || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // ── Verify room and occupancy ──────────────────────────────────────────
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, name, room_type, base_price, weekend_price, gst_rate, max_occupancy')
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
        { error: `Room supports max ${room.max_occupancy} guests` },
        { status: 422 }
      )
    }

    // ── Availability check — atomic using all required nights ──────────────
    const requiredDates: string[] = []
    const cur = new Date(check_in_date)
    const end = new Date(check_out_date)
    while (cur < end) {
      requiredDates.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }

    const { data: avail, error: availErr } = await supabase
      .from('availability')
      .select('date, available_rooms, is_blocked, override_price')
      .eq('hotel_id', hotel_id)
      .eq('room_id', room_id)
      .in('date', requiredDates)

    if (availErr) {
      console.error('[POST /api/bookings/create] avail error:', availErr)
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    const availMap = new Map<string, { available: number; is_blocked: boolean; override_price: number | null }>()
    for (const row of avail ?? []) {
      availMap.set(row.date, {
        available: row.available_rooms ?? 0,
        is_blocked: row.is_blocked,
        override_price: row.override_price ? Number(row.override_price) : null,
      })
    }

    const unavailableDates = requiredDates.filter((d) => {
      const slot = availMap.get(d)
      return !slot || slot.is_blocked || slot.available < 1
    })

    if (unavailableDates.length > 0) {
      return NextResponse.json(
        {
          error: 'Room is not available for selected dates',
          unavailable_dates: unavailableDates,
        },
        { status: 409 }
      )
    }

    // ── Server-side pricing ────────────────────────────────────────────────
    // Fetch active pricing rules
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('hotel_id', hotel_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .or(`room_id.eq.${room_id},room_id.is.null`)
      .order('priority', { ascending: false })

    let totalRoomAmount = 0

    for (const date of requiredDates) {
      const slot = availMap.get(date)
      let price = slot?.override_price ?? Number(room.base_price)
      const dayOfWeek = new Date(date).getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      let ruleApplied = false
      if (pricingRules) {
        for (const rule of pricingRules) {
          const inDateRange =
            (!rule.start_date || date >= rule.start_date) &&
            (!rule.end_date || date <= rule.end_date)
          const inDayOfWeek =
            !rule.days_of_week?.length || rule.days_of_week.includes(dayOfWeek)
          if (!inDateRange || !inDayOfWeek || rule.min_nights > nights) continue

          if (rule.price_type === 'fixed') price = Number(rule.price_value)
          else if (rule.price_type === 'percentage_increase')
            price = price * (1 + Number(rule.price_value) / 100)
          else if (rule.price_type === 'percentage_decrease')
            price = price * (1 - Number(rule.price_value) / 100)

          ruleApplied = true
          break
        }
      }

      if (!ruleApplied && isWeekend && room.weekend_price) {
        price = Number(room.weekend_price)
      }

      totalRoomAmount += Math.round(price * 100) / 100
    }

    totalRoomAmount = Math.round(totalRoomAmount * 100) / 100
    const roomPricePerNight = Math.round((totalRoomAmount / nights) * 100) / 100

    // ── Coupon validation ──────────────────────────────────────────────────
    let couponDiscount = 0
    let validatedCouponCode: string | null = null

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
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 422 })
      }
      if (totalRoomAmount < Number(coupon.minimum_booking ?? 0)) {
        return NextResponse.json(
          { error: `Minimum booking amount for this coupon is ₹${coupon.minimum_booking}` },
          { status: 422 }
        )
      }

      if (coupon.discount_type === 'percentage') {
        couponDiscount = (totalRoomAmount * Number(coupon.discount_value)) / 100
        if (coupon.maximum_discount)
          couponDiscount = Math.min(couponDiscount, Number(coupon.maximum_discount))
      } else {
        couponDiscount = Number(coupon.discount_value)
      }
      couponDiscount = Math.round(couponDiscount * 100) / 100
      validatedCouponCode = coupon.code
    }

    // ── Find or create guest ───────────────────────────────────────────────
    let guest = await supabase
      .from('guests')
      .select('id, name, email, phone, loyalty_points, loyalty_tier')
      .eq('phone', guestInput.phone)
      .eq('is_deleted', false)
      .maybeSingle()
      .then(({ data }) => data)

    if (!guest) {
      const { data: newGuest, error: guestErr } = await supabase
        .from('guests')
        .insert({
          name: guestInput.name,
          phone: guestInput.phone,
          email: guestInput.email ?? null,
          whatsapp_number: guestInput.whatsapp_number ?? guestInput.phone,
          is_verified: false,
        })
        .select('id, name, email, phone, loyalty_points, loyalty_tier')
        .single()

      if (guestErr || !newGuest) {
        console.error('[POST /api/bookings/create] guest create error:', guestErr)
        return NextResponse.json({ error: 'Failed to register guest' }, { status: 500 })
      }
      guest = newGuest
    }

    // ── Loyalty points redemption ──────────────────────────────────────────
    // 1 point = ₹0.50 (from settings seed: loyalty_redemption_rate = 0.5)
    const LOYALTY_REDEMPTION_RATE = 0.5
    let loyaltyDiscount = 0
    let loyaltyPointsUsed = 0

    if (loyalty_points_to_use > 0) {
      const availablePoints = guest.loyalty_points ?? 0
      if (loyalty_points_to_use > availablePoints) {
        return NextResponse.json(
          {
            error: `Only ${availablePoints} loyalty points available`,
          },
          { status: 422 }
        )
      }
      loyaltyPointsUsed = loyalty_points_to_use
      loyaltyDiscount = Math.round(loyaltyPointsUsed * LOYALTY_REDEMPTION_RATE * 100) / 100
    }

    // ── Final amount ───────────────────────────────────────────────────────
    const discountedBase = Math.max(0, totalRoomAmount - couponDiscount - loyaltyDiscount)
    const avgNightlyRate = discountedBase / nights
    const gstRate = getGSTRate(avgNightlyRate)
    const { gst: gstAmount, total: finalAmount } = applyGST(discountedBase, gstRate)

    // Loyalty points to earn: 1 point per ₹1 spent (base, before GST)
    const loyaltyPointsEarned = Math.floor(discountedBase)

    // ── Create booking ─────────────────────────────────────────────────────
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        hotel_id,
        room_id,
        guest_id: guest.id,
        check_in_date,
        check_out_date,
        adults,
        children,
        room_price_per_night: roomPricePerNight,
        total_room_amount: totalRoomAmount,
        discount_amount: couponDiscount + loyaltyDiscount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        final_amount: finalAmount,
        source,
        status: 'pending',
        payment_status: 'pending',
        special_requests: special_requests ?? null,
        coupon_code: validatedCouponCode,
        coupon_discount: couponDiscount,
        loyalty_points_used: loyaltyPointsUsed,
        loyalty_points_earned: loyaltyPointsEarned,
        loyalty_discount: loyaltyDiscount,
      })
      .select('id, booking_reference, final_amount, status, payment_status')
      .single()

    if (bookingErr || !booking) {
      console.error('[POST /api/bookings/create] booking insert error:', bookingErr)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // ── Decrement availability ─────────────────────────────────────────────
    // Use individual updates — Supabase doesn't support bulk-increment natively
    const availUpdateErrors: string[] = []
    for (const date of requiredDates) {
      const { error: incrErr } = await supabase.rpc('increment_booked_rooms', {
        p_hotel_id: hotel_id,
        p_room_id: room_id,
        p_date: date,
        p_count: 1,
      })
      if (incrErr) {
        availUpdateErrors.push(date)
        console.error('[POST /api/bookings/create] avail update failed for', date, incrErr)
      }
    }

    // If availability update fails, don't fail the booking — log for manual reconciliation
    if (availUpdateErrors.length > 0) {
      console.error(
        `[POST /api/bookings/create] AVAILABILITY SYNC ISSUE for booking ${booking.booking_reference}:`,
        availUpdateErrors
      )
    }

    // ── Increment coupon usage count ───────────────────────────────────────
    if (validatedCouponCode) {
      await supabase.rpc('increment_coupon_usage', { p_code: validatedCouponCode })
    }

    // ── Deduct loyalty points ──────────────────────────────────────────────
    if (loyaltyPointsUsed > 0) {
      await supabase
        .from('guests')
        .update({ loyalty_points: (guest.loyalty_points ?? 0) - loyaltyPointsUsed })
        .eq('id', guest.id)

      await supabase.from('loyalty_transactions').insert({
        guest_id: guest.id,
        booking_id: booking.id,
        transaction_type: 'redeemed',
        points: -loyaltyPointsUsed,
        balance_after: (guest.loyalty_points ?? 0) - loyaltyPointsUsed,
        description: `Redeemed for booking ${booking.booking_reference}`,
      })
    }

    // ── Dispatch notifications (fire-and-forget) ───────────────────────────
    dispatchBookingNotifications({
      event: 'booking_created',
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        check_in_date,
        check_out_date,
        nights,
        final_amount: finalAmount,
        hotel_name: hotel.name,
        room_name: room.name,
      },
      guest: {
        name: guest.name,
        phone: guest.phone,
        email: guest.email ?? undefined,
      },
      hotel: {
        whatsapp_number: hotel.whatsapp_number,
        email: hotel.email,
      },
    }).catch((err) => console.error('[POST /api/bookings/create] notification error:', err))

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status,
          payment_status: booking.payment_status,
          final_amount: finalAmount,
          currency: 'INR',
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/bookings/create] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
