import { adminClient } from '@/lib/supabase/admin'
import type { Coupon } from '@/types/database'

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await adminClient
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_deleted', false)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getCouponByCode: ${error.message}`)
  }
  return data
}

export async function validateCoupon(
  code: string,
  bookingAmount: number,
  guestId: string,
  hotelId: string
): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon }> {
  const coupon = await getCouponByCode(code)

  if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon code' }

  const now = new Date()
  if (new Date(coupon.valid_until) < now)
    return { valid: false, discount: 0, message: 'Coupon has expired' }

  if (new Date(coupon.valid_from) > now)
    return { valid: false, discount: 0, message: 'Coupon is not yet active' }

  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
    return { valid: false, discount: 0, message: 'Coupon usage limit reached' }

  if (bookingAmount < coupon.minimum_booking)
    return {
      valid: false,
      discount: 0,
      message: `Minimum booking amount of ₹${coupon.minimum_booking} required`,
    }

  if (coupon.hotel_id && coupon.hotel_id !== hotelId)
    return { valid: false, discount: 0, message: 'Coupon not valid for this property' }

  const { count } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('guest_id', guestId)
    .eq('coupon_code', code)
    .eq('is_deleted', false)

  if ((count ?? 0) >= (coupon.per_guest_limit ?? 1))
    return { valid: false, discount: 0, message: 'You have already used this coupon' }

  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = (bookingAmount * coupon.discount_value) / 100
    if (coupon.maximum_discount) discount = Math.min(discount, coupon.maximum_discount)
  } else {
    discount = coupon.discount_value
  }

  discount = Math.min(discount, bookingAmount)

  return { valid: true, discount: Math.round(discount), message: 'Coupon applied', coupon }
}

export async function incrementCouponUsage(code: string): Promise<void> {
  const { error } = await adminClient.rpc('increment_coupon_usage', { coupon_code: code })
  if (error) {
    await adminClient
      .from('coupons')
      .update({ used_count: adminClient.from('coupons').select('used_count') })
      .eq('code', code)
  }
}

export async function getAllCoupons(options: {
  hotelId?: string
  active?: boolean
  page?: number
  limit?: number
}): Promise<{ coupons: Coupon[]; total: number }> {
  const { hotelId, active, page = 1, limit = 20 } = options

  let query = adminClient
    .from('coupons')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)

  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (active !== undefined) query = query.eq('is_active', active)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAllCoupons: ${error.message}`)
  return { coupons: data ?? [], total: count ?? 0 }
}

export async function createCoupon(
  data: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>
): Promise<Coupon> {
  const { data: coupon, error } = await adminClient
    .from('coupons')
    .insert({ ...data, code: data.code.toUpperCase(), used_count: 0 })
    .select()
    .single()

  if (error) throw new Error(`createCoupon: ${error.message}`)
  return coupon
}

export async function updateCoupon(
  id: string,
  data: Partial<Omit<Coupon, 'id' | 'created_at'>>
): Promise<Coupon> {
  const { data: coupon, error } = await adminClient
    .from('coupons')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateCoupon: ${error.message}`)
  return coupon
}

export async function softDeleteCoupon(id: string): Promise<void> {
  const { error } = await adminClient
    .from('coupons')
    .update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeleteCoupon: ${error.message}`)
}
