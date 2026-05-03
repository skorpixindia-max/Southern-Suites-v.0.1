import Image from 'next/image'
import Link from 'next/link'

interface HotelCardProps {
  hotel: {
    id: string
    name: string
    slug: string
    city: string
    area: string
    starRating: number
    shortDescription?: string | null
    primaryImage: string | null
    imageAlt: string
    minPrice: number | null
  }
  index?: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} star hotel`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-accent' : 'text-neutral-300'}`}
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

export default function HotelCard({ hotel, index = 0 }: HotelCardProps) {
  const FALLBACK_IMAGE = '/images/hotel-placeholder.jpg'

  const staggerDelay = Math.min(index * 80, 500) // cap stagger at 500ms

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group block card-luxury rounded-sm overflow-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      style={{ animationDelay: `${staggerDelay}ms` }}
      aria-label={`View ${hotel.name} in ${hotel.city}`}
    >
      {/* Image container */}
      <div className="relative aspect-hotel-card img-zoom-parent overflow-hidden bg-neutral-100">
        {/* City badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 bg-primary/90 backdrop-blur-sm text-white text-2xs font-semibold tracking-wide uppercase rounded-xs">
            {hotel.city}
          </span>
        </div>

        {/* Star rating badge top-right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary text-2xs font-bold rounded-xs">
            {hotel.starRating}
            <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Star
          </span>
        </div>

        {/* Hotel image */}
        <Image
          src={hotel.primaryImage ?? FALLBACK_IMAGE}
          alt={hotel.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover img-zoom"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-400 ease-luxury" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Location */}
        <div className="flex items-center gap-1 mb-2">
          <svg className="w-3 h-3 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-2xs text-neutral-400 font-inter font-medium">
            {hotel.area}, {hotel.city}
          </span>
        </div>

        {/* Hotel name */}
        <h3 className="font-playfair text-lg font-semibold text-primary leading-snug mb-2
                       group-hover:text-accent transition-colors duration-200 line-clamp-2">
          {hotel.name}
        </h3>

        {/* Stars */}
        <div className="mb-3">
          <StarRating rating={hotel.starRating} />
        </div>

        {/* Short description */}
        {hotel.shortDescription && (
          <p className="font-inter text-xs text-neutral-500 leading-relaxed mb-4 line-clamp-2">
            {hotel.shortDescription}
          </p>
        )}

        {/* Price + CTA row */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div>
            {hotel.minPrice ? (
              <>
                <span className="text-2xs text-neutral-400 font-inter">From</span>
                <p className="font-inter font-bold text-primary text-lg leading-tight">
                  ₹{hotel.minPrice.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-neutral-400">/night</span>
                </p>
              </>
            ) : (
              <p className="font-inter text-xs text-neutral-400">Check availability</p>
            )}
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-4 py-2
                       bg-accent text-primary
                       text-xs font-inter font-bold tracking-wide rounded-xs
                       group-hover:bg-accent-600 group-hover:shadow-gold
                       transition-all duration-300"
            aria-hidden="true"
          >
            Book Now
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
