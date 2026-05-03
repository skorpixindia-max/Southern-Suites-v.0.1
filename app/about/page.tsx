import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | Southern Suites – Your Home Across Andhra Pradesh',
  description:
    'Learn the story of Southern Suites – a curated collection of 9 hotels across Andhra Pradesh built on warm hospitality, honest service, and a deep love for the region.',
}

const VALUES = [
  {
    icon: '🏨',
    title: 'Genuine Hospitality',
    desc: 'Every guest is family. We train our teams to anticipate needs, not just meet them.',
  },
  {
    icon: '🌿',
    title: 'Local Roots',
    desc: 'We celebrate Andhra culture — in our cuisine, our décor, and the stories we tell.',
  },
  {
    icon: '💎',
    title: 'Honest Value',
    desc: 'No hidden fees. No OTA markups when you book direct. Just fair, transparent pricing.',
  },
  {
    icon: '⚡',
    title: 'Modern Standards',
    desc: 'High-speed Wi-Fi, digital check-in, 24/7 service — comfort that keeps pace with you.',
  },
]

const CITIES = [
  { name: 'Vijayawada', desc: 'The Business Capital', slug: 'vijayawada' },
  { name: 'Visakhapatnam', desc: 'The Jewel of the East Coast', slug: 'visakhapatnam' },
  { name: 'Tirupati', desc: 'The Spiritual Gateway', slug: 'tirupati' },
  { name: 'Guntur', desc: 'The Spice & Trade Hub', slug: 'guntur' },
  { name: 'Nellore', desc: 'The Prawn Capital', slug: 'nellore' },
  { name: 'Kurnool', desc: 'The Gateway to Belum', slug: 'kurnool' },
  { name: 'Kakinada', desc: 'The Port City', slug: 'kakinada' },
  { name: 'Rajahmundry', desc: 'The Cultural Capital', slug: 'rajahmundry' },
  { name: 'Kadapa', desc: 'The Heart of Rayalaseema', slug: 'kadapa' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0]">
      {/* Hero */}
      <section className="relative bg-[#1B2A4A] overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-4">
            Our Story
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Your Home Across
            <br />
            <em className="text-[#C9A84C]">Andhra Pradesh</em>
          </h1>
          <p className="text-white/70 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
            Southern Suites was born from a simple belief: travellers in Andhra Pradesh deserve
            hotels that feel like home — warm, honest, and genuinely comfortable.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-['Playfair_Display'] text-3xl lg:text-4xl text-[#1B2A4A] font-bold mb-6">
              Built on the Road, Refined by Experience
            </h2>
            <div className="space-y-4 text-[#1B2A4A]/70 leading-relaxed">
              <p>
                Southern Suites started as a single property in Vijayawada — a bet on Andhra
                Pradesh's underserved mid-premium hospitality market. Travellers had two options:
                overpriced five-stars or unreliable budget lodges. We wanted to build something in
                between.
              </p>
              <p>
                That first property filled up faster than we imagined. Guests weren't just booking
                rooms — they were booking trust. Word spread. More cities called. Today, we operate
                9 properties across the state, each one calibrated to its city's personality while
                sharing the same Southern Suites soul.
              </p>
              <p>
                We believe in direct booking: no OTA middlemen, no opaque fees. When you book with
                us directly, every rupee goes toward a better experience — not commissions.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '9', label: 'Properties' },
              { num: '9', label: 'Cities in AP' },
              { num: '396+', label: 'Total Rooms' },
              { num: '2020', label: 'Founded' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-6 border border-[#1B2A4A]/8 text-center"
              >
                <p className="font-['Playfair_Display'] text-4xl font-bold text-[#1B2A4A]">
                  {stat.num}
                </p>
                <p className="text-sm text-[#1B2A4A]/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Properties */}
      <section className="bg-[#1B2A4A] py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-3">
              Our Footprint
            </p>
            <h2 className="font-['Playfair_Display'] text-white text-3xl lg:text-4xl font-bold">
              9 Properties, 9 Cities
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A84C]/40 rounded-xl p-4 transition-all duration-200"
              >
                <p className="font-['Playfair_Display'] text-white font-semibold text-lg group-hover:text-[#C9A84C] transition-colors">
                  {city.name}
                </p>
                <p className="text-white/40 text-xs mt-1">{city.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            What Drives Us
          </p>
          <h2 className="font-['Playfair_Display'] text-[#1B2A4A] text-3xl lg:text-4xl font-bold">
            Our Values
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl p-6 border border-[#1B2A4A]/8 text-center"
            >
              <div className="text-4xl mb-4">{v.icon}</div>
              <h3 className="font-['Playfair_Display'] text-lg text-[#1B2A4A] font-bold mb-2">
                {v.title}
              </h3>
              <p className="text-sm text-[#1B2A4A]/60 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Photo Placeholder */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="bg-[#1B2A4A]/5 rounded-3xl border-2 border-dashed border-[#1B2A4A]/20 aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-[#1B2A4A]/40 text-sm font-medium">Team Photo — Coming Soon</p>
            <p className="text-[#1B2A4A]/30 text-xs mt-1">Upload via Admin Dashboard</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#C9A84C] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-['Playfair_Display'] text-[#1B2A4A] text-3xl font-bold mb-4">
            Ready to Experience Southern Suites?
          </h2>
          <p className="text-[#1B2A4A]/70 mb-6">
            Book directly with us and save — no OTA fees, no hidden charges.
          </p>
          <Link
            href="/hotels"
            className="inline-block bg-[#1B2A4A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#243656] transition-colors"
          >
            Explore Our Hotels
          </Link>
        </div>
      </section>
    </main>
  )
}
