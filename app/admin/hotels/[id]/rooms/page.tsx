'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { RoomWithImages } from '@/types/database'

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'super_deluxe', label: 'Super Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'presidential', label: 'Presidential' },
]

const BED_TYPES = [
  { value: 'king', label: 'King' },
  { value: 'queen', label: 'Queen' },
  { value: 'twin', label: 'Twin' },
  { value: 'double', label: 'Double' },
  { value: 'single', label: 'Single' },
]

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const ROOM_TYPE_COLORS: Record<string, string> = {
  standard: '#6b7280',
  deluxe: '#2563eb',
  super_deluxe: '#7c3aed',
  suite: '#C9A84C',
  presidential: '#1B2A4A',
}

interface RoomForm {
  name: string
  slug: string
  room_type: string
  bed_type: string
  base_price: string
  weekend_price: string
  peak_price: string
  max_occupancy: string
  total_count: string
  size_sqft: string
  floor_number: string
  short_description: string
  description: string
  gst_rate: string
}

const EMPTY_FORM: RoomForm = {
  name: '',
  slug: '',
  room_type: 'deluxe',
  bed_type: 'king',
  base_price: '',
  weekend_price: '',
  peak_price: '',
  max_occupancy: '2',
  total_count: '1',
  size_sqft: '',
  floor_number: '',
  short_description: '',
  description: '',
  gst_rate: '12',
}

function RoomCard({
  room,
  onEdit,
}: {
  room: RoomWithImages
  onEdit: (room: RoomWithImages) => void
}) {
  const primaryImage = room.room_images?.find((i) => i.is_primary) ?? room.room_images?.[0]
  const typeColor = ROOM_TYPE_COLORS[room.room_type] ?? '#6b7280'

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Image */}
      <div style={{
        height: '160px',
        background: primaryImage ? `url(${primaryImage.image_url}) center/cover no-repeat` : 'linear-gradient(135deg, #1B2A4A, #243755)',
        position: 'relative',
        flexShrink: 0,
      }}>
        {!primaryImage && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.3}>
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="white" strokeWidth="1.5"/>
              <circle cx="11" cy="14" r="3" stroke="white" strokeWidth="1.5"/>
              <path d="M2 22l8-6 6 5 4-4 10 7" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <div style={{
          position: 'absolute', top: '0.625rem', left: '0.625rem',
          background: typeColor,
          borderRadius: '6px',
          padding: '0.2rem 0.5rem',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {room.room_type.replace('_', ' ')}
        </div>
        <div style={{
          position: 'absolute', top: '0.625rem', right: '0.625rem',
          background: room.is_active ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
          borderRadius: '6px',
          padding: '0.2rem 0.5rem',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.06em',
        }}>
          {room.is_active ? 'Active' : 'Inactive'}
        </div>
        {room.room_images && room.room_images.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '0.5rem', right: '0.625rem',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '6px',
            padding: '0.15rem 0.4rem',
            fontSize: '0.65rem',
            color: '#fff',
          }}>
            {room.room_images.length} photo{room.room_images.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1rem', fontWeight: 600, color: '#1B2A4A',
          marginBottom: '0.25rem', lineHeight: 1.3,
        }}>
          {room.name}
        </div>
        {room.short_description && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            {room.short_description}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Base Price</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1B2A4A' }}>{formatINR(room.base_price)}</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>per night</div>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Inventory</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1B2A4A' }}>{room.total_count}</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>rooms total</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {room.bed_type && (
            <span style={{ fontSize: '0.675rem', color: '#374151', background: '#f3f4f6', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
              {room.bed_type} bed
            </span>
          )}
          <span style={{ fontSize: '0.675rem', color: '#374151', background: '#f3f4f6', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
            {room.max_occupancy} guests
          </span>
          {room.size_sqft && (
            <span style={{ fontSize: '0.675rem', color: '#374151', background: '#f3f4f6', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
              {room.size_sqft} sqft
            </span>
          )}
          <span style={{ fontSize: '0.675rem', color: '#374151', background: '#f3f4f6', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
            GST {room.gst_rate}%
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <button
            onClick={() => onEdit(room)}
            style={{
              flex: 1, padding: '0.5rem',
              background: '#1B2A4A', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Edit Room
          </button>
          <Link
            href={`/admin/hotels/${room.hotel_id}/rooms/${room.id}/photos`}
            style={{
              flex: 1, padding: '0.5rem', textAlign: 'center',
              background: '#f3f4f6', color: '#374151',
              borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Photos
          </Link>
        </div>
      </div>
    </div>
  )
}

function AddRoomModal({
  hotelId,
  editRoom,
  onClose,
  onSaved,
}: {
  hotelId: string
  editRoom: RoomWithImages | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<RoomForm>(
    editRoom
      ? {
          name: editRoom.name,
          slug: editRoom.slug,
          room_type: editRoom.room_type,
          bed_type: editRoom.bed_type ?? 'king',
          base_price: String(editRoom.base_price),
          weekend_price: String(editRoom.weekend_price ?? ''),
          peak_price: String(editRoom.peak_price ?? ''),
          max_occupancy: String(editRoom.max_occupancy),
          total_count: String(editRoom.total_count),
          size_sqft: String(editRoom.size_sqft ?? ''),
          floor_number: String(editRoom.floor_number ?? ''),
          short_description: editRoom.short_description ?? '',
          description: editRoom.description ?? '',
          gst_rate: String(editRoom.gst_rate),
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function slugify(str: string) {
    return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function setField(key: keyof RoomForm, value: string) {
    setForm((p) => {
      const updated = { ...p, [key]: value }
      if (key === 'name' && !editRoom) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) { setError('Room name is required'); return }
    if (!form.base_price || isNaN(Number(form.base_price))) { setError('Valid base price is required'); return }

    setSaving(true)

    const payload = {
      hotel_id: hotelId,
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      room_type: form.room_type,
      bed_type: form.bed_type || null,
      base_price: Number(form.base_price),
      weekend_price: form.weekend_price ? Number(form.weekend_price) : null,
      peak_price: form.peak_price ? Number(form.peak_price) : null,
      max_occupancy: Number(form.max_occupancy) || 2,
      total_count: Number(form.total_count) || 1,
      size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
      floor_number: form.floor_number ? Number(form.floor_number) : null,
      short_description: form.short_description || null,
      description: form.description || null,
      gst_rate: Number(form.gst_rate) || 12,
    }

    try {
      const url = editRoom
        ? `/api/admin/hotels/${hotelId}/rooms/${editRoom.id}`
        : `/api/admin/hotels/${hotelId}/rooms`
      const method = editRoom ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSaved()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '0.875rem', color: '#111827',
    fontFamily: "'Inter', sans-serif", outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600,
    color: '#374151', letterSpacing: '0.07em',
    textTransform: 'uppercase', marginBottom: '0.35rem',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2rem 1rem',
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        width: '100%', maxWidth: '640px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.3s ease',
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: translateY(0); } }`}</style>

        {/* Modal header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#1B2A4A' }}>
              {editRoom ? 'Edit Room' : 'Add New Room'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {editRoom ? `Editing: ${editRoom.name}` : 'Fill in the room details below'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '8px',
                fontSize: '0.875rem', color: '#dc2626',
              }}>
                {error}
              </div>
            )}

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Room Name *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Deluxe King Room"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>URL Slug</label>
                <input
                  style={inputStyle}
                  value={form.slug}
                  onChange={(e) => setField('slug', slugify(e.target.value))}
                  placeholder="deluxe-king-room"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Room Type</label>
                <select
                  style={{ ...inputStyle, background: '#fff' }}
                  value={form.room_type}
                  onChange={(e) => setField('room_type', e.target.value)}
                >
                  {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bed Type</label>
                <select
                  style={{ ...inputStyle, background: '#fff' }}
                  value={form.bed_type}
                  onChange={(e) => setField('bed_type', e.target.value)}
                >
                  {BED_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3 — Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Base Price (₹) *</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.base_price}
                  onChange={(e) => setField('base_price', e.target.value)}
                  placeholder="2500"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Weekend Price (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.weekend_price}
                  onChange={(e) => setField('weekend_price', e.target.value)}
                  placeholder="3000"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Peak Price (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.peak_price}
                  onChange={(e) => setField('peak_price', e.target.value)}
                  placeholder="4000"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
            </div>

            {/* Row 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Max Guests</label>
                <input
                  style={inputStyle}
                  type="number" min="1" max="10"
                  value={form.max_occupancy}
                  onChange={(e) => setField('max_occupancy', e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Total Rooms</label>
                <input
                  style={inputStyle}
                  type="number" min="1"
                  value={form.total_count}
                  onChange={(e) => setField('total_count', e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Size (sqft)</label>
                <input
                  style={inputStyle}
                  type="number" min="0"
                  value={form.size_sqft}
                  onChange={(e) => setField('size_sqft', e.target.value)}
                  placeholder="350"
                  onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div>
                <label style={labelStyle}>GST Rate %</label>
                <select
                  style={{ ...inputStyle, background: '#fff' }}
                  value={form.gst_rate}
                  onChange={(e) => setField('gst_rate', e.target.value)}
                >
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="0">0%</option>
                </select>
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <label style={labelStyle}>Short Description</label>
              <input
                style={inputStyle}
                value={form.short_description}
                onChange={(e) => setField('short_description', e.target.value)}
                placeholder="Spacious king room with city view and premium amenities"
                onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Full Description</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Detailed room description for the booking page…"
                onFocus={(e) => { e.target.style.borderColor = '#1B2A4A' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f3f4f6',
            display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#f3f4f6', color: '#374151',
                border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.625rem 1.5rem',
                background: saving ? '#e5e7eb' : '#1B2A4A',
                color: saving ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {saving ? (
                <>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Saving…
                </>
              ) : (
                editRoom ? 'Save Changes' : 'Add Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HotelRoomsPage() {
  const { id } = useParams<{ id: string }>()
  const [rooms, setRooms] = useState<RoomWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRoom, setEditRoom] = useState<RoomWithImages | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [hotelName, setHotelName] = useState('')

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  async function loadRooms() {
    setLoading(true)
    try {
      const [roomsRes, hotelRes] = await Promise.all([
        fetch(`/api/admin/hotels/${id}/rooms`),
        fetch(`/api/admin/hotels/${id}`),
      ])
      const roomsData = await roomsRes.json()
      const hotelData = await hotelRes.json()
      setRooms(roomsData.rooms ?? [])
      setHotelName(hotelData.hotel?.name ?? '')
    } catch {
      showToast('Failed to load rooms', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRooms() }, [id])

  function handleEdit(room: RoomWithImages) {
    setEditRoom(room)
    setShowModal(true)
  }

  function handleAdd() {
    setEditRoom(null)
    setShowModal(true)
  }

  function handleModalClose() {
    setShowModal(false)
    setEditRoom(null)
  }

  function handleSaved() {
    setShowModal(false)
    setEditRoom(null)
    loadRooms()
    showToast(editRoom ? 'Room updated successfully' : 'Room added successfully', 'success')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8f7f4; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform: translateY(-12px); } to { opacity:1; transform: translateY(0); } }
      `}</style>

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
          <Link href={`/admin/hotels/${id}`} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b7280', textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: '#1B2A4A' }}>Room Management</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{hotelName}</div>
          </div>
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: '#1B2A4A', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Room
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Summary bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem 1.25rem' }}>
            <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Room Types</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>{rooms.length}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem 1.25rem' }}>
            <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Rooms</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>
              {rooms.reduce((s, r) => s + r.total_count, 0)}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem 1.25rem' }}>
            <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Types</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
              {rooms.filter((r) => r.is_active).length}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem 1.25rem' }}>
            <div style={{ fontSize: '0.675rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Starting From</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1B2A4A' }}>
              {rooms.length > 0 ? formatINR(Math.min(...rooms.map((r) => r.base_price))) : '—'}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#1B2A4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading rooms…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(27,42,74,0.06)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="4" stroke="#1B2A4A" strokeWidth="1.5" opacity={0.4}/>
                <path d="M14 8v12M8 14h12" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#1B2A4A', marginBottom: '0.5rem' }}>No rooms yet</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add your first room type to start accepting bookings.</p>
            <button
              onClick={handleAdd}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#1B2A4A', color: '#fff',
                border: 'none', borderRadius: '10px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              Add First Room
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddRoomModal
          hotelId={id}
          editRoom={editRoom}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
