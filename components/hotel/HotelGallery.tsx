'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'

type HotelImage = {
  id?: string
  image_url: string
  alt_text?: string | null
  sort_order?: number
  is_primary?: boolean
}

type Props = {
  images: HotelImage[]
  hotelName: string
}

export default function HotelGallery({ images, hotelName }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const prev = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
  }, [lightboxIndex, images.length])

  const next = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % images.length)
  }, [lightboxIndex, images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, prev, next])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 lg:h-96 bg-[#1B2A4A]/10 flex items-center justify-center">
        <p className="text-[#1B2A4A]/30 text-sm">No images available</p>
      </div>
    )
  }

  const displayImages = images.slice(0, 5)
  const remaining = images.length - 5

  return (
    <>
      {/* Gallery Grid */}
      <div className="w-full bg-[#1B2A4A]">
        <div className="max-w-7xl mx-auto px-0 lg:px-4">
          <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[300px] sm:h-[400px] lg:h-[500px]">
            {/* Primary / large image */}
            <div
              className="col-span-4 lg:col-span-2 row-span-2 relative cursor-pointer overflow-hidden group"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={displayImages[0]?.image_url}
                alt={displayImages[0]?.alt_text || hotelName}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Secondary images — hidden on mobile */}
            {displayImages.slice(1, 5).map((img, idx) => (
              <div
                key={img.id || idx}
                className="hidden lg:block relative cursor-pointer overflow-hidden group"
                onClick={() => openLightbox(idx + 1)}
              >
                <Image
                  src={img.image_url}
                  alt={img.alt_text || `${hotelName} photo ${idx + 2}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {/* "View all" overlay on last visible */}
                {idx === 3 && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Grid3X3 size={24} className="mx-auto mb-1 opacity-80" />
                      <span className="text-sm font-semibold">+{remaining} photos</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* View all button */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex justify-end mt-2">
          <button
            onClick={() => openLightbox(0)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors border border-white/20"
          >
            <Grid3X3 size={14} />
            View all {images.length} photos
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].image_url}
              alt={images[lightboxIndex].alt_text || `${hotelName} photo`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Caption */}
          {images[lightboxIndex].alt_text && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center max-w-sm">
              {images[lightboxIndex].alt_text}
            </p>
          )}
        </div>
      )}
    </>
  )
}
