import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/components/hotel/SearchBar'
import HotelCard from '@/components/hotel/HotelCard'
import GoogleReviews from '@/components/hotel/GoogleReviews'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getHotels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hotels')
    .select(`
      id, name, slug, short_description,
      city, area, star_rating,
      amenities, is_active,
      hotel_images (
        image_url, alt_text, is_primary, sort_order
      ),
      rooms (
        base_price
      )
    `)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('star_rating', { ascending: false })
    .limit(9)

  if (error) {
    console.error('Hotels fetch error:', error)
    return []
  }
  return data ?? []
}

async function getCities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hotels')
    .select('city')
    .eq('is_active', true)
    .eq('is_deleted', false)

  if (!data) return []
  const unique = [...new Set(data.map((h) => h.city))].sort()
  return unique
}

async function getFeaturedReviews() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, hotel_id, reviewer_name, reviewer_photo, rating, review_text, review_date')
    .eq('is_featured', true)
    .eq('is_deleted', false)
    .order('rating', { ascending: false })
    .limit(3)

  return data ?? []
}

// ─── Star Component ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-accent' : 'text-neutral-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Homepage Component ───────────────────────────────────────────────────────

export default async function HomePage() {
  const [hotels, cities, featuredReviews] = await Promise.all([
    getHotels(),
    getCities(),
    getFeaturedReviews(),
  ])

  return (
    <>
      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Southern Suites luxury hotel"
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-hero-overlay" />

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-8 w-px h-32 bg-accent/30 hidden lg:block z-[2]" />
        <div className="absolute top-1/4 right-8 w-px h-32 bg-accent/30 hidden lg:block z-[2]" />

        {/* Content */}
        <div className="relative z-[3] flex flex-col items-center justify-center min-h-[100svh] px-4 py-24 text-center">

          {/* Pre-heading label */}
          <div className="animate-on-load animate-fade-in-down mb-6">
            <span className="inline-flex items-center gap-2 text-accent/90 text-xs font-semibold tracking-[0.25em] uppercase">
              <span className="w-8 h-px bg-accent/60" />
              9 Properties · Andhra Pradesh
              <span className="w-8 h-px bg-accent/60" />
            </span>
          </div>

          {/* Main heading */}
          <h1 className="animate-on-load animate-fade-in-up delay-100 font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl leading-tight">
            Your Home Across
            <br />
            <span className="italic text-gradient-gold">Andhra Pradesh</span>
          </h1>

          {/* Gold accent line */}
          <div className="animate-on-load animate-scale-in delay-200 w-20 h-0.5 bg-accent mx-auto mt-6 mb-6" />

          {/* Subheading */}
          <p className="animate-on-load animate-fade-in-up delay-300 text-white/80 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-10 font-inter font-light leading-relaxed">
            From pilgrimage town to port city, from riverside heritage to beachfront luxury —
            a premium stay awaits at every destination.
          </p>

          {/* Search Bar */}
          <div className="animate-on-load animate-fade-in-up delay-400 w-full max-w-4xl">
            <Suspense fallback={
              <div className="h-20 bg-white/10 rounded-sm animate-pulse" />
            }>
              <SearchBar cities={cities} />
            </Suspense>
          </div>

          {/* Trust indicators */}
          <div className="animate-on-load animate-fade-in-up delay-500 flex items-center gap-6 mt-10 text-white/60 text-xs font-inter">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Best Price Guaranteed
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Instant Confirmation
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              24/7 Support
            </span>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40">
            <span className="text-2xs tracking-widest uppercase font-inter">Explore</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── OUR PROPERTIES ────────────────────────────────────────── */}
      <section className="section-padding bg-section" aria-label="Our Properties">
        <div className="container-luxury">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="section-label">Discover</p>
            <h2 className="heading-xl mb-4">Our Properties</h2>
            <div className="gold-line-center" />
            <p className="body-lg max-w-2xl mx-auto">
              Nine handpicked hotels across Andhra Pradesh, each offering the perfect blend
              of local character and modern luxury.
            </p>
          </div>

          {/* Hotels Grid */}
          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {hotels.map((hotel, index) => {
                const primaryImage = hotel.hotel_images?.find((img: any) => img.is_primary)
                  ?? hotel.hotel_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
                const minPrice = hotel.rooms?.length
                  ? Math.min(...hotel.rooms.map((r: any) => Number(r.base_price)))
                  : null

                return (
                  <HotelCard
                    key={hotel.id}
                    hotel={{
                      id: hotel.id,
                      name: hotel.name,
                      slug: hotel.slug,
                      city: hotel.city,
                      area: hotel.area,
                      starRating: hotel.star_rating,
                      shortDescription: hotel.short_description,
                      primaryImage: primaryImage?.image_url ?? null,
                      imageAlt: primaryImage?.alt_text ?? hotel.name,
                      minPrice,
                    }}
                    index={index}
                  />
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} variant="hotel-card" />
              ))}
            </div>
          )}

          {/* View all link */}
          <div className="text-center mt-12">
            <Link href="/hotels" className="btn-gold-outline">
              View All 9 Properties
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY BOOK DIRECT ───────────────────────────────────────── */}
      <section className="section-padding bg-primary relative overflow-hidden" aria-label="Why book direct">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 gold-dots-pattern opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="container-luxury relative z-10">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="font-inter text-xs font-bold tracking-[0.2em] uppercase text-accent/80 mb-3">
              The Direct Advantage
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
              Why Book With Us Directly?
            </h2>
            <div className="w-16 h-0.5 bg-accent mx-auto" />
          </div>

          {/* 3 benefit cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Best Price Guaranteed',
                description: 'Book direct and we guarantee the lowest rate — no booking fees, no OTA commissions, no markups. What you see is what you pay.',
                badge: 'Save vs MakeMyTrip',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Instant Confirmation',
                description: 'Your booking is confirmed the moment payment goes through. Receive your confirmation via WhatsApp, SMS, and email instantly.',
                badge: 'Real-time Updates',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: '24/7 WhatsApp Support',
                description: 'Our team is available around the clock. Message us on WhatsApp for any request, special arrangement, or assistance during your stay.',
                badge: 'Always Available',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="group relative bg-white/5 border border-white/10 rounded-sm p-8
                           hover:bg-white/10 hover:border-accent/30
                           transition-all duration-400 ease-luxury"
              >
                {/* Gold badge top */}
                <div className="inline-flex items-center px-2.5 py-1 bg-accent/15 border border-accent/25 rounded-xs mb-6">
                  <span className="text-accent text-2xs font-semibold tracking-wide">{benefit.badge}</span>
                </div>

                {/* Icon */}
                <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>

                {/* Text */}
                <h3 className="font-playfair text-xl font-semibold text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="font-inter text-sm text-white/60 leading-relaxed">
                  {benefit.description}
                </p>

                {/* Decorative corner */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-accent/20 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITIES SECTION ────────────────────────────────────────── */}
      <section className="section-padding bg-background" aria-label="Explore cities">
        <div className="container-luxury">
          <div className="text-center mb-10">
            <p className="section-label">Explore by Destination</p>
            <h2 className="heading-xl mb-4">Where Would You Like to Stay?</h2>
            <div className="gold-line-center" />
            <p className="body-md max-w-xl mx-auto">
              From the spiritual shores of Tirupati to the coastal charm of Visakhapatnam —
              we are wherever you need us.
            </p>
          </div>

          {/* City pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/cities/${city.toLowerCase().replace(/\s+/g, '-')}`}
                className="group inline-flex items-center gap-2 px-5 py-2.5
                           border border-neutral-200 bg-white text-neutral-700
                           rounded-full text-sm font-inter font-medium
                           transition-all duration-300
                           hover:border-accent hover:bg-accent/5 hover:text-primary hover:shadow-gold/20 hover:shadow-md
                           focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {city}
              </Link>
            ))}
          </div>

          {/* Andhra Pradesh map teaser */}
          <div className="mt-12 text-center">
            <p className="text-neutral-400 text-sm font-inter">
              Covering <span className="text-primary font-semibold">{cities.length} cities</span> across Andhra Pradesh
            </p>
          </div>
        </div>
      </section>

      {/* ── REVIEWS SECTION ───────────────────────────────────────── */}
      {featuredReviews.length > 0 && (
        <section className="section-padding bg-section" aria-label="Guest reviews">
          <div className="container-luxury">
            <div className="text-center mb-12">
              <p className="section-label">Guest Stories</p>
              <h2 className="heading-xl mb-4">What Our Guests Say</h2>
              <div className="gold-line-center" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-8 rounded-sm shadow-card hover:shadow-card-hover transition-all duration-300 relative group"
                >
                  {/* Quote mark */}
                  <div className="absolute top-6 right-6 text-6xl font-playfair text-accent/10 leading-none select-none">
                    &ldquo;
                  </div>

                  {/* Stars */}
                  <StarRating rating={review.rating} />

                  {/* Review text */}
                  <p className="font-inter text-sm text-neutral-600 leading-relaxed mt-4 mb-6 line-clamp-4">
                    {review.review_text}
                  </p>

                  {/* Divider */}
                  <div className="w-8 h-px bg-accent mb-4" />

                  {/* Reviewer */}
                  <div className="flex items-center gap-3">
                    {review.reviewer_photo ? (
                      <Image
                        src={review.reviewer_photo}
                        alt={review.reviewer_name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-playfair font-bold text-primary text-sm">
                          {review.reviewer_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-inter font-semibold text-primary text-sm">
                        {review.reviewer_name}
                      </p>
                      {review.review_date && (
                        <p className="font-inter text-xs text-neutral-400">
                          {new Date(review.review_date).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {/* Google logo */}
                    <div className="ml-auto">
                      <svg className="w-5 h-5 text-neutral-300 group-hover:text-[#4285F4] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER TEASER ─────────────────────────────────────────── */}
      <section className="py-16 bg-primary relative overflow-hidden" aria-label="Newsletter teaser">
        <div className="absolute inset-0 gold-dots-pattern opacity-20" />
        <div className="container-luxury relative z-10 text-center">
          <p className="section-label text-accent/70">Exclusive Offers</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Know
          </h2>
          <div className="w-16 h-0.5 bg-accent mx-auto mb-6" />
          <p className="font-inter text-white/60 text-sm md:text-base max-w-lg mx-auto mb-8">
            Get early access to special rates, festival offers, and exclusive packages
            across all nine Southern Suites properties.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full sm:flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-sm
                         text-white placeholder-white/40 text-sm font-inter
                         focus:outline-none focus:border-accent focus:bg-white/15
                         transition-all duration-200"
            />
            <button className="w-full sm:w-auto btn-gold whitespace-nowrap">
              Get Offers
            </button>
          </div>
          <p className="text-white/30 text-xs font-inter mt-3">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </>
  )
}
