import { adminClient } from '@/lib/supabase/admin'
import type { Guest, LoyaltyTier } from '@/types/database'

export async function getGuestById(id: string): Promise<Guest | null> {
  const { data, error } = await adminClient
    .from('guests')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getGuestById: ${error.message}`)
  }
  return data
}

export async function getGuestByPhone(phone: string): Promise<Guest | null> {
  const { data, error } = await adminClient
    .from('guests')
    .select('*')
    .eq('phone', phone)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getGuestByPhone: ${error.message}`)
  }
  return data
}

export async function getGuestByEmail(email: string): Promise<Guest | null> {
  const { data, error } = await adminClient
    .from('guests')
    .select('*')
    .eq('email', email)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getGuestByEmail: ${error.message}`)
  }
  return data
}

export async function createGuest(
  data: Omit<Guest, 'id' | 'created_at' | 'updated_at'>
): Promise<Guest> {
  const { data: guest, error } = await adminClient
    .from('guests')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createGuest: ${error.message}`)
  return guest
}

export async function upsertGuest(data: {
  phone: string
  name: string
  email?: string
  whatsapp_number?: string
}): Promise<Guest> {
  const existing = await getGuestByPhone(data.phone)

  if (existing) {
    const { data: updated, error } = await adminClient
      .from('guests')
      .update({ name: data.name, email: data.email ?? existing.email })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw new Error(`upsertGuest update: ${error.message}`)
    return updated
  }

  const { data: created, error } = await adminClient
    .from('guests')
    .insert({
      phone: data.phone,
      name: data.name,
      email: data.email ?? null,
      whatsapp_number: data.whatsapp_number ?? data.phone,
    })
    .select()
    .single()

  if (error) throw new Error(`upsertGuest insert: ${error.message}`)
  return created
}

export async function updateGuest(
  id: string,
  data: Partial<Omit<Guest, 'id' | 'created_at'>>
): Promise<Guest> {
  const { data: guest, error } = await adminClient
    .from('guests')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateGuest: ${error.message}`)
  return guest
}

export async function softDeleteGuest(id: string): Promise<void> {
  const { error } = await adminClient
    .from('guests')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeleteGuest: ${error.message}`)
}

export async function getAllGuests(options: {
  page?: number
  limit?: number
  search?: string
  tier?: LoyaltyTier
}): Promise<{ guests: Guest[]; total: number }> {
  const { page = 1, limit = 20, search, tier } = options

  let query = adminClient
    .from('guests')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (tier) query = query.eq('loyalty_tier', tier)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAllGuests: ${error.message}`)
  return { guests: data ?? [], total: count ?? 0 }
}

export async function updateGuestAfterBooking(
  guestId: string,
  amountSpent: number,
  pointsEarned: number
): Promise<void> {
  const guest = await getGuestById(guestId)
  if (!guest) throw new Error('Guest not found')

  const newTotalStays = guest.total_stays + 1
  const newTotalSpent = guest.total_spent + amountSpent
  const newPoints = guest.loyalty_points + pointsEarned

  let newTier: LoyaltyTier = 'silver'
  if (newTotalStays >= 9) newTier = 'platinum'
  else if (newTotalStays >= 4) newTier = 'gold'

  const { error } = await adminClient
    .from('guests')
    .update({
      total_stays: newTotalStays,
      total_spent: newTotalSpent,
      loyalty_points: newPoints,
      loyalty_tier: newTier,
    })
    .eq('id', guestId)

  if (error) throw new Error(`updateGuestAfterBooking: ${error.message}`)
}

export async function saveOTP(
  phone: string,
  otp: string,
  expiresAt: Date
): Promise<void> {
  const { error } = await adminClient
    .from('guests')
    .update({ otp_code: otp, otp_expires_at: expiresAt.toISOString() })
    .eq('phone', phone)

  if (error) throw new Error(`saveOTP: ${error.message}`)
}

export async function verifyOTP(phone: string, otp: string): Promise<Guest | null> {
  const guest = await getGuestByPhone(phone)
  if (!guest) return null
  if (!guest.otp_code || guest.otp_code !== otp) return null
  if (!guest.otp_expires_at || new Date(guest.otp_expires_at) < new Date()) return null

  const { data, error } = await adminClient
    .from('guests')
    .update({
      otp_code: null,
      otp_expires_at: null,
      is_verified: true,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', guest.id)
    .select()
    .single()

  if (error) throw new Error(`verifyOTP: ${error.message}`)
  return data
}

export async function blacklistGuest(id: string, reason: string): Promise<void> {
  const { error } = await adminClient
    .from('guests')
    .update({ is_blacklisted: true, blacklist_reason: reason })
    .eq('id', id)

  if (error) throw new Error(`blacklistGuest: ${error.message}`)
}
