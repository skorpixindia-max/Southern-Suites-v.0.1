import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Southern Suites',
  description:
    'Get in touch with any of our 9 Southern Suites hotels across Andhra Pradesh. Direct phone, WhatsApp, and email for every property.',
}

async function getHotels() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, city, area, address, phone, whatsapp_number, email, slug')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('city', { ascending: true })

  if (error) return []
  return data ?? []
}

export default async function ContactPage() {
  const hotels = await getHotels()

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
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <p className="text-[#C9A84C] font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            We're Here to Help
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Contact Us
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Reach us via the central form below or contact any of our 9 properties directly.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Central Contact Form */}
        <div className="bg-white rounded-2xl border border-[#1B2A4A]/8 p-6 lg:p-10 mb-12 max-w-2xl mx-auto shadow-sm">
          <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-2">
            Send Us a Message
          </h2>
          <p className="text-sm text-[#1B2A4A]/50 mb-6">
            Our team typically responds within 2 hours during business hours.
          </p>
          <ContactForm hotels={hotels} />
        </div>

        {/* Hotel Cards */}
        <div>
          <h2 className="font-['Playfair_Display'] text-2xl text-[#1B2A4A] font-bold mb-6 text-center">
            Our Properties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel: any) => (
              <div
                key={hotel.id}
                className="bg-white rounded-xl border border-[#1B2A4A]/8 p-5 hover:border-[#C9A84C]/40 transition-colors"
              >
                <h3 className="font-['Playfair_Display'] text-lg text-[#1B2A4A] font-bold mb-1">
                  {hotel.name}
                </h3>
                <p className="text-xs text-[#C9A84C] font-semibold uppercase tracking-wider mb-3">
                  {hotel.city}
                </p>
                <div className="space-y-2 text-sm text-[#1B2A4A]/60">
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5">📍</span>
                    <span className="leading-snug">{hotel.address}</span>
                  </p>
                  <a
                    href={`tel:${hotel.phone}`}
                    className="flex items-center gap-2 hover:text-[#1B2A4A] transition-colors"
                  >
                    <span>📞</span>
                    <span>{hotel.phone}</span>
                  </a>
                </div>

                <div className="flex gap-2 mt-4">
                  <a
                    href={`https://wa.me/${hotel.whatsapp_number.replace(/\D/g, '')}?text=Hello, I'd like to enquire about ${hotel.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#22c35e] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${hotel.email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1B2A4A] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#243656] transition-colors"
                  >
                    ✉️ Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
