import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cancellation Policy | Southern Suites',
  description:
    'Understand Southern Suites cancellation, refund, and modification policies before you book.',
}

const LAST_UPDATED = 'January 1, 2025'

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      <section className="bg-[#1B2A4A] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">
            Legal
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-3xl lg:text-4xl font-bold">
            Cancellation Policy
          </h1>
          <p className="text-white/40 text-sm mt-2">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              timeframe: '48+ Hours Before',
              refund: '100% Refund',
              color: 'bg-green-50 border-green-200',
              badge: 'bg-green-100 text-green-800',
            },
            {
              timeframe: '24–48 Hours Before',
              refund: '50% Refund',
              color: 'bg-yellow-50 border-yellow-200',
              badge: 'bg-yellow-100 text-yellow-800',
            },
            {
              timeframe: 'Less Than 24 Hours',
              refund: 'No Refund',
              color: 'bg-red-50 border-red-200',
              badge: 'bg-red-100 text-red-800',
            },
          ].map((item) => (
            <div
              key={item.timeframe}
              className={`rounded-xl border p-5 text-center ${item.color}`}
            >
              <p className="text-sm font-medium text-[#1B2A4A]/70 mb-2">{item.timeframe}</p>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${item.badge}`}>
                {item.refund}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#1B2A4A]/8 p-6 lg:p-10 prose prose-sm max-w-none text-[#1B2A4A]/75 leading-relaxed">
          <LegalSection title="1. Standard Cancellation Policy">
            <p>
              The following cancellation terms apply to all bookings made directly through
              Southern Suites (website, WhatsApp, or phone). Bookings made through OTA platforms
              (MakeMyTrip, Booking.com, etc.) are subject to those platforms&apos; own policies.
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1B2A4A] text-white">
                  <th className="text-left px-3 py-2 rounded-tl-lg">Cancellation Time</th>
                  <th className="text-left px-3 py-2">Refund Amount</th>
                  <th className="text-left px-3 py-2 rounded-tr-lg">Processing Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#1B2A4A]/8">
                  <td className="px-3 py-2.5 font-medium text-[#1B2A4A]">48+ hours before check-in</td>
                  <td className="px-3 py-2.5 text-green-700 font-semibold">Full refund (100%)</td>
                  <td className="px-3 py-2.5">5–7 business days</td>
                </tr>
                <tr className="border-b border-[#1B2A4A]/8">
                  <td className="px-3 py-2.5 font-medium text-[#1B2A4A]">24–48 hours before check-in</td>
                  <td className="px-3 py-2.5 text-yellow-700 font-semibold">50% refund</td>
                  <td className="px-3 py-2.5">5–7 business days</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium text-[#1B2A4A]">Less than 24 hours / No-show</td>
                  <td className="px-3 py-2.5 text-red-700 font-semibold">No refund</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </LegalSection>

          <LegalSection title="2. How to Cancel">
            <p>You can cancel your booking through any of the following:</p>
            <ul>
              <li>Log into your Southern Suites account and cancel under &quot;My Bookings&quot;.</li>
              <li>
                Email us at{' '}
                <a href="mailto:support@southernsuites.in" className="text-[#C9A84C] underline">
                  support@southernsuites.in
                </a>{' '}
                with your booking reference (SS-YYYY-XXXXX).
              </li>
              <li>
                WhatsApp or call the hotel directly using the contact details in your confirmation.
              </li>
            </ul>
            <p>
              Cancellations are processed based on the <strong>time received</strong>, not the
              time sent. Please ensure you receive a cancellation confirmation from us.
            </p>
          </LegalSection>

          <LegalSection title="3. Refund Process">
            <ul>
              <li>
                Refunds are processed to the original payment method (credit card, UPI, net
                banking).
              </li>
              <li>
                Razorpay processes refunds within 5–7 business days. Bank processing may take an
                additional 2–3 days.
              </li>
              <li>
                Cash payments (walk-in bookings) will be refunded in cash or via bank transfer.
              </li>
              <li>GST amounts are refunded along with the room amount.</li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Modifications">
            <p>
              Booking modifications (change of dates, room type, guest count) are subject to
              availability and any price difference at the time of modification. Modifications
              requested less than 24 hours before check-in may be treated as cancellations and
              new bookings.
            </p>
          </LegalSection>

          <LegalSection title="5. Special Circumstances">
            <p>
              We consider refund requests outside the standard policy on a case-by-case basis for:
            </p>
            <ul>
              <li>Medical emergencies (with supporting documentation).</li>
              <li>Natural disasters or government travel restrictions.</li>
              <li>Death in the immediate family.</li>
            </ul>
            <p>
              Such requests should be emailed to{' '}
              <a href="mailto:support@southernsuites.in" className="text-[#C9A84C] underline">
                support@southernsuites.in
              </a>{' '}
              with documentation.
            </p>
          </LegalSection>

          <LegalSection title="6. Peak Season & Special Events">
            <p>
              During peak seasons (festive holidays, Ugadi, Diwali, New Year) and special events,
              stricter cancellation terms may apply. These will be clearly communicated at the time
              of booking.
            </p>
          </LegalSection>

          <LegalSection title="7. Contact">
            <p>
              For cancellation assistance, contact us at{' '}
              <a href="mailto:support@southernsuites.in" className="text-[#C9A84C] underline">
                support@southernsuites.in
              </a>{' '}
              or call{' '}
              <a href="tel:+919000000001" className="text-[#C9A84C] underline">
                +91 90000 00001
              </a>
              .
            </p>
          </LegalSection>
        </div>
      </section>
    </main>
  )
}

function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <h2 className="font-['Playfair_Display'] text-xl text-[#1B2A4A] font-bold mb-3 border-b border-[#C9A84C]/30 pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
