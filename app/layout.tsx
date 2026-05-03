import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://southernsuites.in'),
  title: {
    default: 'Southern Suites — Your Home Across Andhra Pradesh',
    template: '%s | Southern Suites',
  },
  description:
    'Discover 9 premium hotels across Andhra Pradesh. Book direct for the best rates at Southern Suites — from Visakhapatnam Beach to Tirupati, Vijayawada to Rajahmundry.',
  keywords: [
    'hotels in Andhra Pradesh',
    'Southern Suites',
    'hotel booking AP',
    'luxury hotels Vijayawada',
    'hotels Visakhapatnam',
    'Tirupati hotels',
    'Guntur hotels',
    'book hotel direct AP',
  ],
  authors: [{ name: 'Southern Suites', url: 'https://southernsuites.in' }],
  creator: 'Southern Suites',
  publisher: 'Southern Suites Hotel Group',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://southernsuites.in',
    siteName: 'Southern Suites',
    title: 'Southern Suites — Your Home Across Andhra Pradesh',
    description:
      '9 premium hotels across Andhra Pradesh. Book direct for the best rates, instant confirmation, and 24/7 support.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Southern Suites — Luxury Hotels Across Andhra Pradesh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Southern Suites — Your Home Across Andhra Pradesh',
    description: '9 premium hotels across Andhra Pradesh. Best rates guaranteed when you book direct.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://southernsuites.in',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1B2A4A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-inter bg-background text-neutral-800 antialiased selection:bg-accent/20 selection:text-primary">
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-primary focus:font-semibold focus:rounded-md focus:shadow-gold"
        >
          Skip to main content
        </a>

        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
