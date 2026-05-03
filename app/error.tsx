'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-section flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-primary/5 gold-dots-pattern" aria-hidden="true" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Label */}
        <p className="font-inter text-xs font-bold tracking-[0.2em] uppercase text-accent mb-4">
          Something Went Wrong
        </p>

        {/* Heading */}
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-primary mb-4">
          We Hit a Snag
        </h1>

        {/* Gold line */}
        <div className="w-12 h-0.5 bg-accent mx-auto mb-6" />

        <p className="font-inter text-neutral-500 text-base leading-relaxed mb-8">
          Something unexpected happened on our end. Our team has been notified and we&apos;re
          working to fix it. Please try again in a moment.
        </p>

        {/* Error digest for support reference */}
        {error.digest && (
          <p className="font-inter text-xs text-neutral-400 mb-8">
            Error reference: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-xs">{error.digest}</code>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={reset} className="btn-gold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <Link href="/" className="btn-navy">
            Go to Homepage
          </Link>
        </div>

        {/* Support link */}
        <p className="mt-8 font-inter text-sm text-neutral-400">
          If this persists,{' '}
          <Link href="/contact" className="text-accent hover:text-accent-600 underline underline-offset-2 transition-colors">
            contact our support team
          </Link>
        </p>
      </div>
    </div>
  )
}
