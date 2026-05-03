import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Southern Suites',
  description: 'How Southern Suites collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'January 1, 2025'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      <section className="bg-[#1B2A4A] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">
            Legal
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-3xl lg:text-4xl font-bold">
            Privacy Policy
          </h1>
          <p className="text-white/40 text-sm mt-2">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="bg-white rounded-2xl border border-[#1B2A4A]/8 p-6 lg:p-10 prose prose-sm max-w-none text-[#1B2A4A]/75 leading-relaxed">
          <LegalSection title="1. Information We Collect">
            <p>
              Southern Suites (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects the
              following personal information when you use our services:
            </p>
            <ul>
              <li>
                <strong>Identity information:</strong> Full name, date of birth, gender,
                nationality.
              </li>
              <li>
                <strong>Contact information:</strong> Email address, phone number, WhatsApp number,
                postal address.
              </li>
              <li>
                <strong>Booking information:</strong> Hotel preferences, check-in/out dates,
                special requests, number of guests.
              </li>
              <li>
                <strong>Payment information:</strong> Transaction IDs, payment method type. We do
                not store full card details — these are handled by Razorpay.
              </li>
              <li>
                <strong>Identity proof:</strong> Aadhaar, Passport, PAN, or other government-issued
                IDs as required by Indian law for hotel check-in.
              </li>
              <li>
                <strong>Usage data:</strong> IP address, browser type, pages visited, time spent on
                our website.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. How We Use Your Information">
            <p>We use your personal information to:</p>
            <ul>
              <li>Process and confirm your hotel reservations.</li>
              <li>Send booking confirmations, invoices, and reminders via email and WhatsApp.</li>
              <li>Comply with Indian legal requirements for guest registration.</li>
              <li>Improve our services and personalise your experience.</li>
              <li>Send offers and updates (you may opt out at any time).</li>
              <li>Process loyalty points and rewards.</li>
              <li>Handle customer support enquiries.</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Data Sharing">
            <p>
              We do not sell your personal data. We may share it with trusted third parties solely
              to deliver our services:
            </p>
            <ul>
              <li>
                <strong>Razorpay:</strong> Payment processing.
              </li>
              <li>
                <strong>Resend / WhatsApp Business API:</strong> Transactional communication.
              </li>
              <li>
                <strong>Supabase:</strong> Secure cloud database hosting.
              </li>
              <li>
                <strong>Government authorities:</strong> When required by Indian law (e.g., police
                verification registers).
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Data Security">
            <p>
              We implement industry-standard security measures including encryption in transit (TLS
              1.3), encrypted database storage, and strict access controls. Our infrastructure is
              hosted on Supabase with row-level security policies. Passwords are stored using bcrypt
              hashing.
            </p>
          </LegalSection>

          <LegalSection title="5. Data Retention">
            <p>
              We retain personal data for as long as necessary to fulfil the purposes outlined in
              this policy and to comply with legal obligations under Indian law. Booking records are
              retained for a minimum of 7 years for accounting and tax purposes.
            </p>
          </LegalSection>

          <LegalSection title="6. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to legal retention requirements).</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
            <p>
              To exercise these rights, email us at{' '}
              <a
                href="mailto:support@southernsuites.in"
                className="text-[#C9A84C] underline"
              >
                support@southernsuites.in
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="7. Cookies">
            <p>
              Our website uses essential cookies for session management and analytics cookies to
              understand how our site is used. You may disable cookies in your browser settings,
              though this may affect certain website features.
            </p>
          </LegalSection>

          <LegalSection title="8. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or a prominent notice on our website. Your continued use of our
              services after changes constitutes acceptance of the updated policy.
            </p>
          </LegalSection>

          <LegalSection title="9. Contact Us">
            <p>
              For privacy-related queries, contact our Data Officer at{' '}
              <a
                href="mailto:support@southernsuites.in"
                className="text-[#C9A84C] underline"
              >
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
