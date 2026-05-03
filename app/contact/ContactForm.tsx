'use client'

import { useState } from 'react'

type Hotel = { id: string; name: string; city: string }

export default function ContactForm({ hotels }: { hotels: Hotel[] }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    hotel: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', phone: '', email: '', hotel: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-[#1B2A4A]/15 text-[#1B2A4A] text-sm bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] transition-all placeholder:text-[#1B2A4A]/30'

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-['Playfair_Display'] text-xl text-[#1B2A4A] font-bold mb-2">
          Message Sent!
        </h3>
        <p className="text-sm text-[#1B2A4A]/60">
          We'll get back to you within 2 hours during business hours.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm text-[#C9A84C] underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="+91 98765 43210"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">
          Which Hotel?
        </label>
        <select name="hotel" value={form.hotel} onChange={handleChange} className={inputClass}>
          <option value="">All Hotels / General Enquiry</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.city})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#1B2A4A]/60 mb-1.5">Message *</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          placeholder="How can we help you?"
          className={inputClass}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-500">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#C9A84C] text-[#1B2A4A] font-semibold py-3.5 rounded-lg hover:bg-[#b8963f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
