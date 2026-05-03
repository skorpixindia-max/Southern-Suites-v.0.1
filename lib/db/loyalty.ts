import { adminClient } from '@/lib/supabase/admin'
import type { LoyaltyTransaction, LoyaltyTransactionType } from '@/types/database'

const POINTS_PER_RUPEE = 1
const RUPEE_PER_POINT = 0.5

export function calculatePointsEarned(amountPaid: number): number {
  return Math.floor(amountPaid * POINTS_PER_RUPEE)
}

export function calculatePointsValue(points: number): number {
  return points * RUPEE_PER_POINT
}

export function calculateMaxRedeemablePoints(
  availablePoints: number,
  bookingAmount: number
): number {
  const maxByAmount = Math.floor(bookingAmount * 0.2 / RUPEE_PER_POINT)
  return Math.min(availablePoints, maxByAmount)
}

export async function addLoyaltyTransaction(data: {
  guest_id: string
  booking_id?: string
  transaction_type: LoyaltyTransactionType
  points: number
  description: string
  expires_at?: string
}): Promise<LoyaltyTransaction> {
  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select('loyalty_points')
    .eq('id', data.guest_id)
    .single()

  if (guestError) throw new Error(`addLoyaltyTransaction guest: ${guestError.message}`)

  const balanceAfter =
    data.transaction_type === 'redeemed' || data.transaction_type === 'expired'
      ? guest.loyalty_points - Math.abs(data.points)
      : guest.loyalty_points + data.points

  if (balanceAfter < 0) throw new Error('Insufficient loyalty points')

  const { data: transaction, error } = await adminClient
    .from('loyalty_transactions')
    .insert({ ...data, balance_after: balanceAfter })
    .select()
    .single()

  if (error) throw new Error(`addLoyaltyTransaction insert: ${error.message}`)

  const { error: updateError } = await adminClient
    .from('guests')
    .update({ loyalty_points: balanceAfter })
    .eq('id', data.guest_id)

  if (updateError) throw new Error(`addLoyaltyTransaction update: ${updateError.message}`)

  return transaction
}

export async function getLoyaltyHistory(
  guestId: string,
  limit = 20
): Promise<LoyaltyTransaction[]> {
  const { data, error } = await adminClient
    .from('loyalty_transactions')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getLoyaltyHistory: ${error.message}`)
  return data
}

export async function redeemPoints(
  guestId: string,
  points: number,
  bookingId: string
): Promise<{ discount: number; transaction: LoyaltyTransaction }> {
  const discount = calculatePointsValue(points)

  const transaction = await addLoyaltyTransaction({
    guest_id: guestId,
    booking_id: bookingId,
    transaction_type: 'redeemed',
    points,
    description: `Redeemed ${points} points for ₹${discount} discount on booking`,
  })

  return { discount, transaction }
}

export async function earnPoints(
  guestId: string,
  amountPaid: number,
  bookingId: string
): Promise<LoyaltyTransaction> {
  const points = calculatePointsEarned(amountPaid)

  return addLoyaltyTransaction({
    guest_id: guestId,
    booking_id: bookingId,
    transaction_type: 'earned',
    points,
    description: `Earned ${points} points for stay worth ₹${amountPaid}`,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  })
}
