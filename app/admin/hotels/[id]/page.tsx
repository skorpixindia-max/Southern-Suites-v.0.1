'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Hotel } from '@/types/database'

const TABS = ['Overview', 'Photos', 'Rooms', 'Pricing', 'SEO & Policies'] as const
type Tab = typeof TABS[number]

function SectionCard({
  title,
  children,
  onSave,
  saving,
}: {
  title: string
  children: React.ReactNode
  onSave: () => void
  saving: boolean
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px',
      border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1.5rem',
    }}>
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#1B2A4A', margin: 0 }}>
          {title}
        </h3>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '0.4375rem 1rem',
            background: saving ? '#e5e7eb' : '#1B2A4A',
            color: saving ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '0.8125rem', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div style={{ padding: '1.5rem' }}>
        {children}
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, half,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  half?: boolean
}) {
  return (
    <div style={{ marginBottom: '1.25rem', width: half ? 'calc(50% - 0.5rem)' : '100%', display: 'inline-block', verticalAlign: 'top', marginRight: half ? '0.75rem' : 0 }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            border: '1.5px solid #e5e7eb', borderRadius: '8px',
            fontSize: '0.9rem', color: '#111827',
            fontFamily: "'Inter', sans-serif",
            resize: 'vertical', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            border: '1.5px solid #e5e7eb', borderRadius: '8px',
            fontSize: '0.9rem', color: '#111827',
            fontFamily: "'Inter', sans-serif",
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
        />
      )}
    </div>
  )
}

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Local edit state — sections
  const [basicInfo, setBasicInfo] = useState({ name: '', slug: '', short_description: '', description: '' })
  const [contactInfo, setContactInfo] = useState({ phone: '', whatsapp_number: '', email: '', address: '', area: '', city: '', state: '', pincode: '' })
  const [businessInfo, setBusinessInfo] = useState({ gst_number: '', pan_number: '', star_rating: '3', check_in_time: '12:00', check_out_time: '11:00', total_rooms: '0' })
  const [mapsInfo, setMapsInfo] = useState({ google_place_id: '', google_maps_url: '', latitude: '', longitude: '' })
  const [seoInfo, setSeoInfo] = useState({ seo_title: '', seo_description: '' })

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    fetch(`/api/admin/hotels/${id}`)
      .then((r) => r.json())
      .then(({ hotel: h }) => {
        if (!h) { router.push('/admin/dashboard'); return }
        setHotel(h)
        setBasicInfo({ name: h.name ?? '', slug: h.slug ?? '', short_description: h.short_description ?? '', description: h.description ?? '' })
        setContactInfo({ phone: h.phone ?? '', whatsapp_number: h.whatsapp_number ?? '', email: h.email ?? '', address: h.address ?? '', area: h.area ?? '', city: h.city ?? '', state: h.state ?? '', pincode: h.pincode ?? '' })
        setBusinessInfo({ gst_number: h.gst_number ?? '', pan_number: h.pan_number ?? '', star_rating: String(h.star_rating ?? 3), check_in_time: h.check_in_time?.slice(0,5) ?? '12:00', check_out_time: h.check_out_time?.slice(0,5) ?? '11:00', total_rooms: String(h.total_rooms ?? 0) })
        setMapsInfo({ google_place_id: h.google_place_id ?? '', google_maps_url: h.google_maps_url ?? '', latitude: String(h.latitude ?? ''), longitude: String(h.longitude ?? '') })
        setSeoInfo({ seo_title: h.seo_title ?? '', seo_description: h.seo_description ?? '' })
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function saveSection(section: string, data: Record<string, string | number>) {
    setSaving(section)
    try {
      const res = await fetch(`/api/admin/hotels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error ?? 'Failed to save', 'error')
      } else {
        const { hotel: updated } = await res.json()
        setHotel(updated)
        showToast('Saved successfully', 'success')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#1B2A4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>Loading hotel details…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!hotel) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8f7f4; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform: translateY(-12px); } to { opacity:1; transform: translateY(0); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          fontSize: '0.875rem', color: toast.type === 'success' ? '#15803d' : '#dc2626',
          fontFamily: "'Inter', sans-serif", fontWeight: 500,
          animation: 'slideIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/dashboard" style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b7280', textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#1B2A4A' }}>{hotel.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{hotel.area}, {hotel.city}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600,
            padding: '0.25rem 0.625rem', borderRadius: '999px',
            background: hotel.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: hotel.is_active ? '#15803d' : '#dc2626',
            border: `1px solid ${hotel.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {hotel.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem', display: 'flex', gap: '0', overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 1.25rem',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#1B2A4A' : 'transparent'}`,
              fontSize: '0.875rem', fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#1B2A4A' : '#6b7280',
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'Overview' && (
          <>
            <SectionCard
              title="Basic Information"
              onSave={() => saveSection('basic', {
                name: basicInfo.name,
                slug: basicInfo.slug,
                short_description: basicInfo.short_description,
                description: basicInfo.description,
              })}
              saving={saving === 'basic'}
            >
              <Field label="Hotel Name" value={basicInfo.name} onChange={(v) => setBasicInfo((p) => ({ ...p, name: v }))} />
              <Field label="URL Slug" value={basicInfo.slug} onChange={(v) => setBasicInfo((p) => ({ ...p, slug: v }))} placeholder="southern-suites-vijayawada" />
              <Field label="Short Description" value={basicInfo.short_description} onChange={(v) => setBasicInfo((p) => ({ ...p, short_description: v }))} type="textarea" placeholder="One line shown on listing pages" />
              <Field label="Full Description" value={basicInfo.description} onChange={(v) => setBasicInfo((p) => ({ ...p, description: v }))} type="textarea" placeholder="Detailed hotel description for the property page" />
            </SectionCard>

            <SectionCard
              title="Contact & Location"
              onSave={() => saveSection('contact', contactInfo)}
              saving={saving === 'contact'}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.75rem' }}>
                <Field label="Phone" value={contactInfo.phone} onChange={(v) => setContactInfo((p) => ({ ...p, phone: v }))} placeholder="+91-866-2345678" half />
                <Field label="WhatsApp" value={contactInfo.whatsapp_number} onChange={(v) => setContactInfo((p) => ({ ...p, whatsapp_number: v }))} placeholder="+919866234567" half />
                <Field label="Email" value={contactInfo.email} onChange={(v) => setContactInfo((p) => ({ ...p, email: v }))} type="email" half />
                <Field label="Area / Locality" value={contactInfo.area} onChange={(v) => setContactInfo((p) => ({ ...p, area: v }))} half />
                <Field label="City" value={contactInfo.city} onChange={(v) => setContactInfo((p) => ({ ...p, city: v }))} half />
                <Field label="State" value={contactInfo.state} onChange={(v) => setContactInfo((p) => ({ ...p, state: v }))} half />
                <Field label="Pincode" value={contactInfo.pincode} onChange={(v) => setContactInfo((p) => ({ ...p, pincode: v }))} half />
              </div>
              <Field label="Full Address" value={contactInfo.address} onChange={(v) => setContactInfo((p) => ({ ...p, address: v }))} type="textarea" />
            </SectionCard>

            <SectionCard
              title="Business Details"
              onSave={() => saveSection('business', {
                gst_number: businessInfo.gst_number,
                pan_number: businessInfo.pan_number,
                star_rating: Number(businessInfo.star_rating),
                check_in_time: businessInfo.check_in_time,
                check_out_time: businessInfo.check_out_time,
                total_rooms: Number(businessInfo.total_rooms),
              })}
              saving={saving === 'business'}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.75rem' }}>
                <Field label="GST Number" value={businessInfo.gst_number} onChange={(v) => setBusinessInfo((p) => ({ ...p, gst_number: v }))} placeholder="37AABCS1234A1Z5" half />
                <Field label="PAN Number" value={businessInfo.pan_number} onChange={(v) => setBusinessInfo((p) => ({ ...p, pan_number: v }))} placeholder="AABCS1234A" half />
                <Field label="Star Rating (1–5)" value={businessInfo.star_rating} onChange={(v) => setBusinessInfo((p) => ({ ...p, star_rating: v }))} type="number" half />
                <Field label="Total Rooms" value={businessInfo.total_rooms} onChange={(v) => setBusinessInfo((p) => ({ ...p, total_rooms: v }))} type="number" half />
                <Field label="Check-in Time" value={businessInfo.check_in_time} onChange={(v) => setBusinessInfo((p) => ({ ...p, check_in_time: v }))} type="time" half />
                <Field label="Check-out Time" value={businessInfo.check_out_time} onChange={(v) => setBusinessInfo((p) => ({ ...p, check_out_time: v }))} type="time" half />
              </div>
            </SectionCard>

            <SectionCard
              title="Google Maps & Location"
              onSave={() => saveSection('maps', {
                google_place_id: mapsInfo.google_place_id,
                google_maps_url: mapsInfo.google_maps_url,
                latitude: mapsInfo.latitude ? Number(mapsInfo.latitude) : null,
                longitude: mapsInfo.longitude ? Number(mapsInfo.longitude) : null,
              })}
              saving={saving === 'maps'}
            >
              <Field label="Google Place ID" value={mapsInfo.google_place_id} onChange={(v) => setMapsInfo((p) => ({ ...p, google_place_id: v }))} placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" />
              <Field label="Google Maps URL" value={mapsInfo.google_maps_url} onChange={(v) => setMapsInfo((p) => ({ ...p, google_maps_url: v }))} placeholder="https://maps.google.com/..." />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Field label="Latitude" value={mapsInfo.latitude} onChange={(v) => setMapsInfo((p) => ({ ...p, latitude: v }))} placeholder="16.5062" half />
                <Field label="Longitude" value={mapsInfo.longitude} onChange={(v) => setMapsInfo((p) => ({ ...p, longitude: v }))} placeholder="80.6480" half />
              </div>
            </SectionCard>
          </>
        )}

        {/* ── PHOTOS TAB ── */}
        {activeTab === 'Photos' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1B2A4A', marginBottom: '0.5rem' }}>Photo Management</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Upload, reorder and set primary photos for this property.</p>
            <Link href={`/admin/hotels/${id}/photos`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: '#1B2A4A', color: '#fff',
              borderRadius: '10px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
            }}>
              Manage Photos →
            </Link>
          </div>
        )}

        {/* ── ROOMS TAB ── */}
        {activeTab === 'Rooms' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1B2A4A', marginBottom: '0.5rem' }}>Room Management</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add, edit and manage all room types for this property.</p>
            <Link href={`/admin/hotels/${id}/rooms`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: '#1B2A4A', color: '#fff',
              borderRadius: '10px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
            }}>
              Manage Rooms →
            </Link>
          </div>
        )}

        {/* ── PRICING TAB ── */}
        {activeTab === 'Pricing' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1B2A4A', marginBottom: '0.5rem' }}>Pricing Rules</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Set weekend, festival and event-based pricing for this property.</p>
            <Link href={`/admin/pricing?hotel=${id}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: '#1B2A4A', color: '#fff',
              borderRadius: '10px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
            }}>
              Manage Pricing →
            </Link>
          </div>
        )}

        {/* ── SEO TAB ── */}
        {activeTab === 'SEO & Policies' && (
          <SectionCard
            title="SEO & Search"
            onSave={() => saveSection('seo', seoInfo)}
            saving={saving === 'seo'}
          >
            <Field
              label="SEO Title"
              value={seoInfo.seo_title}
              onChange={(v) => setSeoInfo((p) => ({ ...p, seo_title: v }))}
              placeholder="Southern Suites Vijayawada | Best Hotel Near Krishna River"
            />
            <div style={{ fontSize: '0.72rem', color: seoInfo.seo_title.length > 60 ? '#ef4444' : '#9ca3af', marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
              {seoInfo.seo_title.length}/60 characters recommended
            </div>
            <Field
              label="SEO Description"
              value={seoInfo.seo_description}
              onChange={(v) => setSeoInfo((p) => ({ ...p, seo_description: v }))}
              type="textarea"
              placeholder="Book directly and save up to 20% vs OTAs. Premium rooms, free WiFi, 24hr service..."
            />
            <div style={{ fontSize: '0.72rem', color: seoInfo.seo_description.length > 160 ? '#ef4444' : '#9ca3af', marginTop: '-0.75rem' }}>
              {seoInfo.seo_description.length}/160 characters recommended
            </div>
          </SectionCard>
        )}
      </main>
    </>
  )
}
