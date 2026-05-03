'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.')
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Inter', sans-serif;
          background: #0d1520;
        }

        /* ── Left panel ── */
        .left-panel {
          position: relative;
          overflow: hidden;
          background: #1B2A4A;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(201,168,76,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(201,168,76,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .brand-block {
          position: relative;
          z-index: 2;
        }

        .brand-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #C9A84C, #e8c97a);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 32px rgba(201,168,76,0.35);
        }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .brand-sub {
          font-size: 0.8rem;
          color: rgba(201,168,76,0.8);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .hero-block {
          position: relative;
          z-index: 2;
        }

        .hero-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 3.5vw, 3rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }

        .hero-heading em {
          font-style: italic;
          color: #C9A84C;
        }

        .hero-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          max-width: 360px;
          font-weight: 300;
        }

        .stats-row {
          display: flex;
          gap: 2.5rem;
          margin-top: 2.5rem;
        }

        .stat-item {}

        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #C9A84C;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 0.3rem;
        }

        .divider-line {
          width: 48px;
          height: 1px;
          background: linear-gradient(90deg, #C9A84C, transparent);
          margin: 2rem 0;
        }

        .footer-note {
          position: relative;
          z-index: 2;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.04em;
        }

        /* ── Right panel ── */
        .right-panel {
          background: #f8f7f4;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          position: relative;
        }

        .right-panel::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .form-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .form-eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C9A84C;
          font-weight: 600;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #C9A84C;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: #1B2A4A;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 2.5rem;
          font-weight: 300;
          line-height: 1.5;
        }

        .field-group {
          margin-bottom: 1.25rem;
        }

        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .field-wrapper {
          position: relative;
        }

        .field-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #111827;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          -webkit-appearance: none;
        }

        .field-input::placeholder { color: #9ca3af; }

        .field-input:focus {
          border-color: #1B2A4A;
          box-shadow: 0 0 0 3px rgba(27,42,74,0.08);
        }

        .field-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .field-input:focus ~ .focus-bar,
        .field-wrapper:focus-within .field-icon {
          color: #1B2A4A;
        }

        .toggle-password {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .toggle-password:hover { color: #1B2A4A; }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
          color: #dc2626;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%;
          padding: 0.9375rem 1.5rem;
          background: #1B2A4A;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: 0.01em;
          margin-top: 1.75rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(201,168,76,0.15) 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .submit-btn:hover:not(:disabled)::before { opacity: 1; }

        .submit-btn:hover:not(:disabled) {
          background: #243755;
          box-shadow: 0 8px 24px rgba(27,42,74,0.3);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          margin-top: 1.5rem;
          font-size: 0.72rem;
          color: #9ca3af;
          letter-spacing: 0.04em;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-root {
            grid-template-columns: 1fr;
          }
          .left-panel {
            display: none;
          }
          .right-panel {
            min-height: 100vh;
            background: #1B2A4A;
          }
          .form-container {
            max-width: 100%;
          }
          .form-title { color: #fff; }
          .form-subtitle { color: rgba(255,255,255,0.55); }
          .field-label { color: rgba(255,255,255,0.8); }
          .field-input {
            background: rgba(255,255,255,0.07);
            border-color: rgba(255,255,255,0.15);
            color: #fff;
          }
          .field-input::placeholder { color: rgba(255,255,255,0.35); }
          .field-input:focus {
            border-color: #C9A84C;
            box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
          }
        }
      `}</style>

      <div className="login-root">
        {/* ── Left Panel ── */}
        <div className="left-panel">
          <div className="brand-block">
            <div className="brand-icon">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M13 2L22 8V18L13 24L4 18V8L13 2Z" fill="#1B2A4A" strokeWidth="0"/>
                <path d="M13 6L18 9.5V16.5L13 20L8 16.5V9.5L13 6Z" fill="rgba(27,42,74,0.4)"/>
                <circle cx="13" cy="13" r="3" fill="#1B2A4A"/>
              </svg>
            </div>
            <div className="brand-name">Southern Suites</div>
            <div className="brand-sub">Property Management</div>
          </div>

          <div className="hero-block">
            <h1 className="hero-heading">
              Manage every<br />
              property with<br />
              <em>precision</em>
            </h1>
            <div className="divider-line" />
            <p className="hero-desc">
              Your command centre for all 9 properties across Andhra Pradesh.
              Real-time bookings, revenue analytics, and guest intelligence — unified.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-number">9</div>
                <div className="stat-label">Properties</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Direct Bookings</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0%</div>
                <div className="stat-label">OTA Commission</div>
              </div>
            </div>
          </div>

          <div className="footer-note">
            © {new Date().getFullYear()} Southern Suites · Andhra Pradesh · All rights reserved
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="right-panel">
          <div className={`form-container ${mounted ? 'visible' : ''}`}>
            <div className="form-eyebrow">Admin Portal</div>
            <h2 className="form-title">Welcome<br />back</h2>
            <p className="form-subtitle">
              Sign in to your management dashboard.
              Authorised personnel only.
            </p>

            <form onSubmit={handleLogin} noValidate>
              {error && (
                <div className="error-box" role="alert">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:'1px'}}>
                    <circle cx="8" cy="8" r="7.5" stroke="#dc2626"/>
                    <path d="M8 4.5v4M8 10.5v1" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="email">Email Address</label>
                <div className="field-wrapper">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                      <path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    placeholder="admin@southernsuites.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="field-wrapper">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                      <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A2 2 0 0110 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                        <path d="M4.2 4.3C2.8 5.2 1.5 6.5 1 8c1 3 3.8 5 7 5 1.4 0 2.7-.4 3.8-1.1M7 3.1C7.3 3 7.7 3 8 3c3.2 0 6 2 7 5-.4 1.1-1 2.1-1.8 2.9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8c1-3 3.8-5 7-5s6 2 7 5c-1 3-3.8 5-7 5s-6-2-7-5z" stroke="currentColor" strokeWidth="1.25"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="secure-note">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L10 3v3c0 2.5-1.8 4.5-4 5-2.2-.5-4-2.5-4-5V3L6 1z" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
              256-bit encrypted · Secure session · Authorised access only
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
