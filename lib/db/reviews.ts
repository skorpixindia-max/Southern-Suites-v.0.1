import { adminClient } from '@/lib/supabase/admin'
import type { Review, ReviewSource } from '@/types/database'

export async function getReviewsByHotel(
  hotelId: string,
  options: { limit?: number; featured?: boolean } = {}
): Promise<Review[]> {
  const { limit = 10, featured } = options

  let query = adminClient
    .from('reviews')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .order('review_date', { ascending: false })

  if (featured) query = query.eq('is_featured', true)

  const { data, error } = await query.limit(limit)
  if (error) throw new Error(`getReviewsByHotel: ${error.message}`)
  return data
}

export async function getReviewStats(hotelId: string): Promise<{
  average_rating: number
  total_reviews: number
  rating_breakdown: Record<number, number>
}> {
  const { data, error } = await adminClient
    .from('reviews')
    .select('rating')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)

  if (error) throw new Error(`getReviewStats: ${error.message}`)

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0

  data.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1
    total += r.rating
  })

  return {
    average_rating: data.length > 0 ? Math.round((total / data.length) * 10) / 10 : 0,
    total_reviews: data.length,
    rating_breakdown: breakdown,
  }
}

export async function upsertReview(data: {
  hotel_id: string
  google_review_id?: string
  reviewer_name: string
  reviewer_photo?: string
  rating: number
  review_text?: string
  review_date?: string
  source?: ReviewSource
}): Promise<Review> {
  if (data.google_review_id) {
    const { data: existing } = await adminClient
      .from('reviews')
      .select('id')
      .eq('google_review_id', data.google_review_id)
      .single()

    if (existing) {
      const { data: updated, error } = await adminClient
        .from('reviews')
        .update({ ...data, fetched_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(`upsertReview update: ${error.message}`)
      return updated
    }
  }

  const { data: created, error } = await adminClient
    .from('reviews')
    .insert({ ...data, fetched_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(`upsertReview insert: ${error.message}`)
  return created
}

export async function replyToReview(
  id: string,
  reply: string
): Promise<void> {
  const { error } = await adminClient
    .from('reviews')
    .update({
      owner_reply: reply,
      owner_reply_date: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(`replyToReview: ${error.message}`)
}

export async function toggleFeaturedReview(
  id: string,
  featured: boolean
): Promise<void> {
  const { error } = await adminClient
    .from('reviews')
    .update({ is_featured: featured })
    .eq('id', id)

  if (error) throw new Error(`toggleFeaturedReview: ${error.message}`)
}

export async function softDeleteReview(id: string): Promise<void> {
  const { error } = await adminClient
    .from('reviews')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeleteReview: ${error.message}`)
}

export async function getAllReviewsAdmin(options: {
  hotelId?: string
  minRating?: number
  page?: number
  limit?: number
}): Promise<{ reviews: Review[]; total: number }> {
  const { hotelId, minRating, page = 1, limit = 20 } = options

  let query = adminClient
    .from('reviews')
    .select('*, hotels(name)', { count: 'exact' })
    .eq('is_deleted', false)

  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (minRating) query = query.gte('rating', minRating)

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('review_date', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAllReviewsAdmin: ${error.message}`)
  return { reviews: data ?? [], total: count ?? 0 }
}
