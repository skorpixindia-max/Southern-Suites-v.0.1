'use client';

import { useState, useEffect } from 'react';
import { Save, Star, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HotelFormData {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  address: string;
  city: string;
  area: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  star_rating: number;
  check_in_time: string;
  check_out_time: string;
  gst_number: string;
  pms_type: string;
  google_maps_embed: string;
  virtual_tour_embed: string;
  google_place_id: string;
  is_active: boolean;
}

interface HotelEditorProps {
  initialData?: Partial<HotelFormData>;
  onSave: (data: HotelFormData) => Promise<void>;
  saving?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AP_CITIES = [
  'Visakhapatnam', 'Vijayawada', 'Tirupati', 'Guntur',
  'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Kadapa',
];

const PMS_TYPES = [
  { value: 'standalone', label: 'Standalone' },
  { value: 'ezee', label: 'eZee' },
  { value: 'hotelogix', label: 'Hotelogix' },
];

const DEFAULT_FORM: HotelFormData = {
  name: '', slug: '', short_description: '', description: '',
  address: '', city: 'Visakhapatnam', area: '', state: 'Andhra Pradesh',
  pincode: '', phone: '', whatsapp_number: '', email: '',
  star_rating: 3, check_in_time: '12:00', check_out_time: '11:00',
  gst_number: '', pms_type: 'standalone',
  google_maps_embed: '', virtual_tour_embed: '', google_place_id: '',
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

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
      {hint && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all bg-white";
const textareaCls = inputCls + " resize-none";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HotelEditor({ initialData, onSave, saving = false }: HotelEditorProps) {
  const [form, setForm] = useState<HotelFormData>({ ...DEFAULT_FORM, ...initialData });
  const [slugEdited, setSlugEdited] = useState(false);

  // Sync initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) setForm({ ...DEFAULT_FORM, ...initialData });
  }, [initialData]);

  const update = <K extends keyof HotelFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm(prev => ({ ...prev, [key]: value }));
    };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, ...(!slugEdited ? { slug: slugify(name) } : {}) }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    setForm(prev => ({ ...prev, slug: slugify(e.target.value) }));
  };

  const handleStarClick = (rating: number) =>
    setForm(prev => ({ ...prev, star_rating: rating }));

  const handleSubmit = () => onSave(form);

  return (
    <div className="space-y-8">

      {/* ── Basic Info ── */}
      <section>
        <SectionHeader>Basic Information</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Hotel Name" required>
            <input className={inputCls} placeholder="Southern Suites Vijayawada" value={form.name} onChange={handleNameChange} />
          </Field>
          <Field label="Slug" hint="Auto-generated from name. Used in URL.">
            <input className={inputCls} placeholder="southern-suites-vijayawada" value={form.slug} onChange={handleSlugChange} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Short Description">
              <input className={inputCls} placeholder="One-line description shown in listings" value={form.short_description} onChange={update('short_description')} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Full Description">
              <textarea className={textareaCls} rows={4} placeholder="Detailed hotel description…" value={form.description} onChange={update('description')} />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section>
        <SectionHeader>Location</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Address" required>
              <input className={inputCls} placeholder="45-67 MG Road, Gandhi Nagar" value={form.address} onChange={update('address')} />
            </Field>
          </div>
          <Field label="City" required>
            <select className={inputCls} value={form.city} onChange={update('city')}>
              {AP_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Area">
            <input className={inputCls} placeholder="Gandhi Nagar" value={form.area} onChange={update('area')} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.state} onChange={update('state')} readOnly className={inputCls + " bg-gray-50"} />
          </Field>
          <Field label="Pincode">
            <input className={inputCls} placeholder="520002" maxLength={6} value={form.pincode} onChange={update('pincode')} />
          </Field>
        </div>
      </section>

      {/* ── Contact ── */}
      <section>
        <SectionHeader>Contact Details</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Phone" required>
            <input className={inputCls} type="tel" placeholder="+91-866-2345678" value={form.phone} onChange={update('phone')} />
          </Field>
          <Field label="WhatsApp Number" required>
            <input className={inputCls} type="tel" placeholder="+919866234567" value={form.whatsapp_number} onChange={update('whatsapp_number')} />
          </Field>
          <Field label="Email" required>
            <input className={inputCls} type="email" placeholder="vijayawada@southernsuites.in" value={form.email} onChange={update('email')} />
          </Field>
        </div>
      </section>

      {/* ── Hotel Details ── */}
      <section>
        <SectionHeader>Hotel Details</SectionHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Star Rating">
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleStarClick(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={n <= form.star_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">{form.star_rating} Star{form.star_rating !== 1 ? 's' : ''}</span>
            </div>
          </Field>
          <div /> {/* spacer */}
          <Field label="Check-in Time">
            <input className={inputCls} type="time" value={form.check_in_time} onChange={update('check_in_time')} />
          </Field>
          <Field label="Check-out Time">
            <input className={inputCls} type="time" value={form.check_out_time} onChange={update('check_out_time')} />
          </Field>
          <Field label="GST Number">
            <input className={inputCls} placeholder="37AABCS1429B1ZB" maxLength={15} value={form.gst_number} onChange={e => setForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="PMS Type">
            <select className={inputCls} value={form.pms_type} onChange={update('pms_type')}>
              {PMS_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
        </div>
      </section>

      {/* ── Embed Codes ── */}
      <section>
        <SectionHeader>Embed Codes & Integration</SectionHeader>
        <div className="space-y-4">
          <Field
            label="Google Maps Embed Code"
            hint='Go to Google Maps → Share → Embed a map → Copy HTML → Paste here'
          >
            <textarea
              className={textareaCls}
              rows={4}
              placeholder='<iframe src="https://www.google.com/maps/embed?..." />'
              value={form.google_maps_embed}
              onChange={update('google_maps_embed')}
            />
          </Field>
          <Field
            label="360° Virtual Tour Code"
            hint="Go to Google Maps → Find your business → Street View → Share → Embed → Paste here. Leave empty if not available."
          >
            <textarea
              className={textareaCls}
              rows={4}
              placeholder='<iframe src="https://www.google.com/maps/embed?..." />'
              value={form.virtual_tour_embed}
              onChange={update('virtual_tour_embed')}
            />
          </Field>
          <Field
            label="Google Place ID"
            hint="Used to display live Google reviews. Find at: maps.google.com → your hotel → share → copy Place ID"
          >
            <input className={inputCls} placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" value={form.google_place_id} onChange={update('google_place_id')} />
          </Field>
        </div>
      </section>

      {/* ── Visibility ── */}
      <section>
        <SectionHeader>Visibility</SectionHeader>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Show on website</p>
            <p className="text-xs text-gray-400">{form.is_active ? 'Hotel is publicly visible' : 'Hotel is hidden from guests'}</p>
          </div>
        </label>
      </section>

      {/* ── Save ── */}
      <div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-gray-900 font-semibold text-sm shadow-sm transition-all disabled:opacity-60 hover:shadow-md"
          style={{ backgroundColor: '#C9A84C' }}
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saving ? 'Saving Hotel…' : 'Save Hotel'}
        </button>
      </div>
    </div>
  );
}
