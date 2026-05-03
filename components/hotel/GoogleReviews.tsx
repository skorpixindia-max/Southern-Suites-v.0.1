import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'

interface GoogleReviewsProps {
  hotelId: string
  limit?: number
}

async function getReviews(hotelId: string, limit: number) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, reviewer_name, reviewer_photo, rating, review_text, review_date, source')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)
    .order('rating', { ascending: false })
    .order('review_date', { ascending: false })
    .limit(limit)

  return data ?? []
}

async function getAverageRating(hotelId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('hotel_id', hotelId)
    .eq('is_deleted', false)

  if (!data || data.length === 0) return { avg: 0, total: 0, breakdown: {} }

  const total = data.length
  const sum = data.reduce((acc, r) => acc + r.rating, 0)
  const avg = sum / total

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  data.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1 })

  return { avg, total, breakdown }
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`${cls} ${i < rating ? 'text-accent' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default async function GoogleReviews({ hotelId, limit = 6 }: GoogleReviewsProps) {
  const [reviews, { avg, total, breakdown }] = await Promise.all([
    getReviews(hotelId, limit),
    getAverageRating(hotelId),
  ])

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-inter text-neutral-400 text-sm">No reviews yet. Be the first to review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overall rating summary */}
      <div className="flex flex-col sm:flex-row gap-8 p-6 bg-section rounded-sm border border-neutral-200">
        {/* Big number */}
        <div className="text-center sm:text-left flex-shrink-0">
          <p className="font-playfair font-bold text-6xl text-primary leading-none">
            {avg.toFixed(1)}
          </p>
          <StarRating rating={Math.round(avg)} size="md" />
          <p className="font-inter text-xs text-neutral-400 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Star breakdown bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] ?? 0
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="font-inter text-xs text-neutral-500 w-4 text-right">{star}</span>
                <svg className="w-3 h-3 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                    aria-valuenow={pct}
                    role="progressbar"
                    aria-label={`${star} star: ${count} reviews`}
                  />
                </div>
                <span className="font-inter text-xs text-neutral-400 w-6">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-5 rounded-sm border border-neutral-100 shadow-card hover:shadow-card-hover transition-all duration-300 relative group">
            {/* Quote decoration */}
            <div className="absolute top-4 right-4 text-5xl font-playfair text-accent/8 leading-none select-none">&ldquo;</div>

            {/* Stars + date */}
            <div className="flex items-center justify-between mb-3">
              <StarRating rating={review.rating} />
              {review.review_date && (
                <span className="font-inter text-2xs text-neutral-400">
                  {new Date(review.review_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {/* Review text */}
            {review.review_text && (
              <p className="font-inter text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-4">
                {review.review_text}
              </p>
            )}

            {/* Reviewer info */}
            <div className="flex items-center gap-3 mt-auto">
              {review.reviewer_photo ? (
                <Image
                  src={review.reviewer_photo}
                  alt={review.reviewer_name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-playfair font-bold text-primary text-sm">
                    {review.reviewer_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-inter font-semibold text-primary text-sm truncate">{review.reviewer_name}</p>
                <p className="font-inter text-2xs text-neutral-400 capitalize">{review.source} review</p>
              </div>
              {/* Source icon */}
              {review.source === 'google' && (
                <div className="ml-auto flex-shrink-0">
                  <svg className="w-4 h-4 text-neutral-300 group-hover:text-[#4285F4] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
