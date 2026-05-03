import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found — Southern Suites',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-section flex items-center justify-center px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-primary/5 gold-dots-pattern" aria-hidden="true" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* 404 display */}
        <div className="relative mb-8">
          <span
            className="font-playfair font-bold text-[8rem] sm:text-[10rem] leading-none
                       text-primary/5 select-none block"
            aria-hidden="true"
          >
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Gold ornament */}
            <div className="text-center">
              <div className="w-16 h-px bg-accent mx-auto mb-2" />
              <p className="font-inter text-xs font-bold tracking-[0.2em] uppercase text-accent">
                Page Not Found
              </p>
              <div className="w-16 h-px bg-accent mx-auto mt-2" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-primary mb-4">
          Room Not Available
        </h1>

        <p className="font-inter text-neutral-500 text-base leading-relaxed mb-8">
          The page you&apos;re looking for seems to have checked out early.
          Let us guide you back to the lobby.
        </p>

        {/* Gold divider */}
        <div className="w-12 h-0.5 bg-accent mx-auto mb-8" />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-gold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          <Link href="/hotels" className="btn-navy">
            Browse Hotels
          </Link>
        </div>

        {/* Help link */}
        <p className="mt-8 font-inter text-sm text-neutral-400">
          Need help?{' '}
          <Link href="/contact" className="text-accent hover:text-accent-600 underline underline-offset-2 transition-colors">
            Contact our team
          </Link>
        </p>
      </div>
    </div>
  )
}
