import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Southern Suites',
  description: 'Terms and conditions governing bookings and use of Southern Suites services.',
}

const LAST_UPDATED = 'January 1, 2025'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      <section className="bg-[#1B2A4A] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">
            Legal
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-3xl lg:text-4xl font-bold">
            Terms &amp; Conditions
          </h1>
          <p className="text-white/40 text-sm mt-2">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="bg-white rounded-2xl border border-[#1B2A4A]/8 p-6 lg:p-10 prose prose-sm max-w-none text-[#1B2A4A]/75 leading-relaxed">
          <LegalSection title="1. Agreement">
            <p>
              By accessing our website or making a booking with Southern Suites, you agree to be
              bound by these Terms &amp; Conditions. If you do not agree, please do not use our
              services.
            </p>
          </LegalSection>

          <LegalSection title="2. Booking & Reservations">
            <ul>
              <li>
                All bookings are subject to availability and confirmation by Southern Suites.
              </li>
              <li>
                A booking is confirmed only upon receipt of payment and issuance of a booking
                reference number (SS-YYYY-XXXXX).
              </li>
              <li>
                You must provide accurate personal details. False information may result in
                cancellation of your reservation without refund.
              </li>
              <li>
                Valid government-issued photo ID is mandatory at check-in, as required by Indian
                law.
              </li>
              <li>
                The primary guest must be 18 years or older and present at check-in.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Check-in & Check-out">
            <ul>
              <li>
                Standard check-in time is 12:00 PM (noon) unless otherwise stated on your booking
                confirmation.
              </li>
              <li>Standard check-out time is 11:00 AM.</li>
              <li>
                Early check-in and late check-out are subject to availability and may incur
                additional charges.
              </li>
              <li>Failure to check in on the arrival date without notice constitutes a no-show and the full booking amount is forfeited.</li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Pricing & Payments">
            <ul>
              <li>
                All prices are displayed in Indian Rupees (INR) and are inclusive of applicable
                taxes unless stated otherwise.
              </li>
              <li>GST is applied as per Indian tax regulations (12% for rooms below ₹2,500/night; 18% for rooms above ₹2,500/night).</li>
              <li>Payments are processed securely through Razorpay. We do not store card details.</li>
              <li>
                Prices shown are valid at the time of booking. Southern Suites reserves the right
                to correct pricing errors.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Guest Conduct">
            <p>
              Guests are expected to behave responsibly and respect fellow guests, staff, and
              property. Southern Suites reserves the right to:
            </p>
            <ul>
              <li>Refuse accommodation or remove guests for disruptive, abusive, or illegal behaviour.</li>
              <li>Charge for damages caused to hotel property during your stay.</li>
              <li>Report illegal activity to authorities.</li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Liability">
            <p>
              Southern Suites shall not be liable for any indirect, incidental, or consequential
              damages arising from your use of our services. Our total liability shall not exceed
              the amount paid for the specific booking in question.
            </p>
            <p>
              We are not responsible for loss or damage to personal belongings unless caused by
              proven negligence of our staff.
            </p>
          </LegalSection>

          <LegalSection title="7. Force Majeure">
            <p>
              Southern Suites shall not be liable for failure to perform obligations where such
              failure is due to circumstances beyond our reasonable control, including natural
              disasters, government actions, pandemics, or civil unrest.
            </p>
          </LegalSection>

          <LegalSection title="8. Governing Law">
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of courts in Vijayawada, Andhra Pradesh.
            </p>
          </LegalSection>

          <LegalSection title="9. Contact">
            <p>
              For queries regarding these terms, contact us at{' '}
              <a href="mailto:support@southernsuites.in" className="text-[#C9A84C] underline">
                support@southernsuites.in
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
