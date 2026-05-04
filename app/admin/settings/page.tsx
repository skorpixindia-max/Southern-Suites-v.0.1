'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Globe, Phone, CreditCard, FileText, Bell,
  Save, Eye, EyeOff, Upload, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SettingValues {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  support_phone: string;
  support_email: string;
  whatsapp_number: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  gst_number: string;
  resend_api_key: string;
  google_places_api_key: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 ${
      toast.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {toast.type === 'success'
        ? <CheckCircle size={18} className="text-green-600 shrink-0" />
        : <AlertCircle size={18} className="text-red-600 shrink-0" />
      }
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  onSave,
  saving,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1B2A4A' }}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 font-playfair">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
      <div className="px-6 pb-5">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
          style={{ backgroundColor: '#C9A84C' }}
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
      style={{ '--tw-ring-color': '#C9A84C' } as React.CSSProperties}
      onFocus={e => e.target.style.borderColor = '#C9A84C'}
      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
    />
  );
}

function MaskedInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
        onFocus={e => e.target.style.borderColor = '#C9A84C'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingValues>({
    site_name: '',
    site_tagline: '',
    logo_url: '',
    support_phone: '',
    support_email: '',
    whatsapp_number: '',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    gst_number: '',
    resend_api_key: '',
    google_places_api_key: '',
  });

  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof SettingValues) => (value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  // Load existing settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) {
          data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value || ''; });
        } else if (data.settings) {
          data.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value || ''; });
        }
        setSettings(prev => ({ ...prev, ...map }));
      })
      .catch(() => {}); // silent fail — use defaults
  }, []);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ show: true, message, type });

  const saveSection = async (section: string, keys: (keyof SettingValues)[]) => {
    setSavingSection(section);
    try {
      const payload = keys.reduce((acc, k) => ({ ...acc, [k]: settings[k] }), {});
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast('Settings saved successfully', 'success');
    } catch {
      showToast('Failed to save settings. Try again.', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'brand');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      update('logo_url')(url);
      showToast('Logo uploaded successfully', 'success');
    } catch {
      showToast('Logo upload failed. Try again.', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        input:focus { box-shadow: 0 0 0 3px rgba(201,168,76,0.15); border-color: #C9A84C !important; }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="px-6 py-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900 font-playfair">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your platform configuration</p>
        </div>

        <div className="p-6 max-w-3xl mx-auto space-y-6">

          {/* 1. Brand Settings */}
          <SectionCard
            icon={Globe}
            title="Brand Settings"
            description="Site identity and logo"
            onSave={() => saveSection('brand', ['site_name', 'site_tagline', 'logo_url'])}
            saving={savingSection === 'brand'}
          >
            <Field label="Site Name">
              <Input value={settings.site_name} onChange={update('site_name')} placeholder="Southern Suites" />
            </Field>
            <Field label="Tagline">
              <Input value={settings.site_tagline} onChange={update('site_tagline')} placeholder="Your Home Across Andhra Pradesh" />
            </Field>
            <Field label="Logo">
              <div className="flex items-center gap-3">
                {settings.logo_url && (
                  <img src={settings.logo_url} alt="Logo" className="h-12 w-auto rounded-lg border border-gray-200 object-contain bg-white p-1" />
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
                >
                  {logoUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {logoUploading ? 'Uploading…' : 'Upload Logo'}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
              {settings.logo_url && (
                <p className="text-xs text-gray-400 mt-1 truncate">{settings.logo_url}</p>
              )}
            </Field>
          </SectionCard>

          {/* 2. Contact Settings */}
          <SectionCard
            icon={Phone}
            title="Contact Settings"
            description="Support contact information shown to guests"
            onSave={() => saveSection('contact', ['support_phone', 'support_email', 'whatsapp_number'])}
            saving={savingSection === 'contact'}
          >
            <Field label="Support Phone">
              <Input value={settings.support_phone} onChange={update('support_phone')} placeholder="+91 90000 00001" type="tel" />
            </Field>
            <Field label="Support Email">
              <Input value={settings.support_email} onChange={update('support_email')} placeholder="support@southernsuites.in" type="email" />
            </Field>
            <Field label="WhatsApp Number" hint="Include country code (e.g. +919876543210)">
              <Input value={settings.whatsapp_number} onChange={update('whatsapp_number')} placeholder="+919876543210" type="tel" />
            </Field>
          </SectionCard>

          {/* 3. Payment Settings */}
          <SectionCard
            icon={CreditCard}
            title="Payment Settings"
            description="Razorpay gateway credentials"
            onSave={() => saveSection('payment', ['razorpay_key_id', 'razorpay_key_secret'])}
            saving={savingSection === 'payment'}
          >
            <Field label="Razorpay Key ID" hint="Starts with rzp_live_ or rzp_test_">
              <Input value={settings.razorpay_key_id} onChange={update('razorpay_key_id')} placeholder="rzp_live_xxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Razorpay Secret Key" hint="Keep this confidential — never share">
              <MaskedInput value={settings.razorpay_key_secret} onChange={update('razorpay_key_secret')} placeholder="••••••••••••••••••••" />
            </Field>
          </SectionCard>

          {/* 4. GST Settings */}
          <SectionCard
            icon={FileText}
            title="GST Settings"
            description="Tax registration details"
            onSave={() => saveSection('gst', ['gst_number'])}
            saving={savingSection === 'gst'}
          >
            <Field label="GST Number" hint="15-character GSTIN (e.g. 37AABCS1429B1ZB)">
              <Input
                value={settings.gst_number}
                onChange={v => update('gst_number')(v.toUpperCase())}
                placeholder="37AABCS1429B1ZB"
              />
            </Field>
          </SectionCard>

          {/* 5. Notification Settings */}
          <SectionCard
            icon={Bell}
            title="Notification Settings"
            description="API keys for email and reviews"
            onSave={() => saveSection('notifications', ['resend_api_key', 'google_places_api_key'])}
            saving={savingSection === 'notifications'}
          >
            <Field label="Resend API Key" hint="Used to send booking confirmation emails">
              <MaskedInput value={settings.resend_api_key} onChange={update('resend_api_key')} placeholder="re_xxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Google Places API Key" hint="Used to fetch live Google reviews for hotels">
              <MaskedInput value={settings.google_places_api_key} onChange={update('google_places_api_key')} placeholder="AIzaSy…" />
            </Field>
          </SectionCard>

        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(t => ({ ...t, show: false }))} />
    </>
  );
}
