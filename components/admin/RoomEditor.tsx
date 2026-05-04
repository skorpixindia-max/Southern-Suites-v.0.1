'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, X, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoomFormData {
  name: string;
  room_type: string;
  description: string;
  base_price: number | string;
  weekend_price: number | string;
  peak_price: number | string;
  max_occupancy: number | string;
  total_count: number | string;
  size_sqft: number | string;
  bed_type: string;
  floor_number: number | string;
  amenities: string[];
  is_active: boolean;
}

interface RoomEditorProps {
  initialData?: Partial<RoomFormData>;
  onSave: (data: RoomFormData) => Promise<void>;
  saving?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'super_deluxe', label: 'Super Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'presidential', label: 'Presidential' },
];

const BED_TYPES = [
  { value: 'king', label: 'King' },
  { value: 'queen', label: 'Queen' },
  { value: 'twin', label: 'Twin' },
  { value: 'double', label: 'Double' },
  { value: 'single', label: 'Single' },
];

const DEFAULT_AMENITIES = [
  'AC', 'WiFi', 'TV', 'Geyser', 'Balcony',
  'Mini Bar', 'Safe', 'Bathtub', 'Pool Access',
  'Room Service', 'Laundry', 'Power Backup',
];

const DEFAULT_FORM: RoomFormData = {
  name: '', room_type: 'standard', description: '',
  base_price: '', weekend_price: '', peak_price: '',
  max_occupancy: 2, total_count: 1, size_sqft: '', bed_type: 'king',
  floor_number: '', amenities: [], is_active: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 mb-4 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all bg-white";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoomEditor({ initialData, onSave, saving = false }: RoomEditorProps) {
  const [form, setForm] = useState<RoomFormData>({ ...DEFAULT_FORM, ...initialData });
  const [customAmenity, setCustomAmenity] = useState('');

  useEffect(() => {
    if (initialData) setForm({ ...DEFAULT_FORM, ...initialData });
  }, [initialData]);

  const update = <K extends keyof RoomFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCustomAmenity = () => {
    const a = customAmenity.trim();
    if (!a || form.amenities.includes(a)) return;
    setForm(prev => ({ ...prev, amenities: [...prev.amenities, a] }));
    setCustomAmenity('');
  };

  const removeCustomAmenity = (amenity: string) => {
    if (DEFAULT_AMENITIES.includes(amenity)) return;
    setForm(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
  };

  // Amenities not in the default list (custom ones)
  const customAmenities = form.amenities.filter(a => !DEFAULT_AMENITIES.includes(a));

  return (
    <div className="space-y-8">

      {/* ── Basic Info ── */}
      <section>
        <SectionHeader>Room Information</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Room Name" required>
            <input className={inputCls} placeholder="Deluxe King Room" value={form.name} onChange={update('name')} />
          </Field>
          <Field label="Room Type" required>
            <select className={inputCls} value={form.room_type} onChange={update('room_type')}>
              {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea className={inputCls + " resize-none"} rows={3} placeholder="Describe the room, its views, and key features…" value={form.description} onChange={update('description')} />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section>
        <SectionHeader>Pricing</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Base Price (₹/night)" required hint="Normal weekday rate">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input className={inputCls + " pl-7"} type="number" min="0" placeholder="2500" value={form.base_price} onChange={update('base_price')} />
            </div>
          </Field>
          <Field label="Weekend Price (₹/night)" hint="Friday & Saturday rate">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input className={inputCls + " pl-7"} type="number" min="0" placeholder="3200" value={form.weekend_price} onChange={update('weekend_price')} />
            </div>
          </Field>
          <Field label="Peak Price (₹/night)" hint="Festival & holiday rate">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input className={inputCls + " pl-7"} type="number" min="0" placeholder="4500" value={form.peak_price} onChange={update('peak_price')} />
            </div>
          </Field>
        </div>
      </section>

      {/* ── Room Specs ── */}
      <section>
        <SectionHeader>Room Specifications</SectionHeader>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Field label="Max Occupancy" required>
            <input className={inputCls} type="number" min="1" max="10" placeholder="2" value={form.max_occupancy} onChange={update('max_occupancy')} />
          </Field>
          <Field label="Total Rooms" required hint="How many of this type exist">
            <input className={inputCls} type="number" min="1" placeholder="5" value={form.total_count} onChange={update('total_count')} />
          </Field>
          <Field label="Size (sq ft)">
            <input className={inputCls} type="number" min="0" placeholder="320" value={form.size_sqft} onChange={update('size_sqft')} />
          </Field>
          <Field label="Bed Type">
            <select className={inputCls} value={form.bed_type} onChange={update('bed_type')}>
              {BED_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Floor Number">
            <input className={inputCls} type="number" min="0" placeholder="3" value={form.floor_number} onChange={update('floor_number')} />
          </Field>
        </div>
      </section>

      {/* ── Amenities ── */}
      <section>
        <SectionHeader>Amenities</SectionHeader>
        {/* Checkboxes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-4">
          {DEFAULT_AMENITIES.map(amenity => {
            const checked = form.amenities.includes(amenity);
            return (
              <label key={amenity} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                checked ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className={`text-sm font-medium ${checked ? 'text-amber-800' : 'text-gray-600'}`}>{amenity}</span>
              </label>
            );
          })}
        </div>

        {/* Custom amenities */}
        {customAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customAmenities.map(a => (
              <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                {a}
                <button onClick={() => removeCustomAmenity(a)} className="hover:text-red-600 transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom */}
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Add custom amenity…"
            value={customAmenity}
            onChange={e => setCustomAmenity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
          />
          <button
            type="button"
            onClick={addCustomAmenity}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </section>

      {/* ── Visibility ── */}
      <section>
        <SectionHeader>Visibility</SectionHeader>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Show this room type</p>
            <p className="text-xs text-gray-400">{form.is_active ? 'Visible to guests for booking' : 'Hidden from booking pages'}</p>
          </div>
        </label>
      </section>

      {/* ── Save ── */}
      <div>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-gray-900 font-semibold text-sm shadow-sm transition-all disabled:opacity-60 hover:shadow-md"
          style={{ backgroundColor: '#C9A84C' }}
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? 'Saving Room…' : 'Save Room'}
        </button>
      </div>
    </div>
  );
}
