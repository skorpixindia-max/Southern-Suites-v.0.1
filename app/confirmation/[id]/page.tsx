import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmationClient from '@/components/booking/ConfirmationClient'

type Props = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Booking Confirmed | Southern Suites',
  description: 'Your Southern Suites booking has been confirmed.',
  robots: { index: false },
}

async function getBooking(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      hotels (name, address, city, phone, email, gst_number),
      rooms (name, bed_type, size_sqft),
      guests (name, phone, email)
    `
    )
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !data) return null
  return data
}

export default async function ConfirmationPage({ params }: Props) {
  const booking = await getBooking(params.id)
  if (!booking) notFound()

  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      <ConfirmationClient booking={booking} />
    </main>
  )
}
