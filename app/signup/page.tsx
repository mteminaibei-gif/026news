'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      let home = '/social'
      try {
        const { data: p } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single()
        const r = (p as { role?: string } | null)?.role
        if (r === 'admin') home = '/admin'
      } catch { /* ignore */ }
      router.replace(home)
    })
  }, [router])

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '', general: '' }))
  }

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

  const passwordStrength = useMemo(() => {
    const p = form.password
    if (!p) return { score: 0, label: '', color: 'var(--border)' }
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[a-z]/.test(p)) score++
    if (/\d/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 2) return { score: 1, label: 'Weak', color: 'var(--error)' }
    if (score <= 3) return { score: 2, label: 'Fair', color: 'var(--warning)' }
    if (score <= 4) return { score: 3, label: 'Good', color: 'var(--primary)' }
    return { score: 4, label: 'Strong', color: 'var(--success)' }
  }, [form.password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError('')
    setErrors({})

    const localErrors: Record<string, string> = {}
    if (!form.name.trim()) localErrors.name = 'Full name is required.'
    if (!form.email.trim()) localErrors.email = 'Email is required.'
    if (form.password.length < 8)
      localErrors.password = 'Password must be at least 8 characters.'
    else if (!PASSWORD_REGEX.test(form.password))
      localErrors.password = 'Password must include uppercase, lowercase, and a number.'
    if (form.password !== form.confirmPassword)
      localErrors.confirmPassword = 'Passwords do not match.'
    if (!acceptedTerms) localErrors.terms = 'You must accept the terms.'
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const fieldErrors: Record<string, string> = {}
        ;(data.errors as { field?: string; message: string }[] | undefined)?.forEach((err) => {
          if (err.field) fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
        setGeneralError(data.error || 'Could not create your account. Please try again.')
        setLoading(false)
        return
      }
      router.push(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
    } catch {
      setGeneralError('Network error. Please try again.')
      setLoading(false)
    }
  }

  async function handleOAuthSignIn(provider: 'google' | 'github' | 'twitter') {
    setOauthLoading(provider)
    setGeneralError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (error) setGeneralError(error.message)
    } catch {
      setGeneralError('Failed to sign in with ' + provider)
    } finally {
      setOauthLoading(null)
    }
  }

  const glassInput = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: 'var(--radius-xs)',
    border: `1.5px solid ${hasError ? 'var(--error)' : 'var(--border)'}`,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
    boxShadow: hasError ? '0 0 0 1px oklch(65% 0.14 25 / 0.1)' : 'none',
  })

  return (
    <div className="auth-layout grid grid-cols-1 lg:grid-cols-2" style={{ flex: 1, width: '100%' }}>
      {/* Left Panel: Branding */}
      <div
        className="auth-brand hidden lg:flex"
        style={{
          background: 'linear-gradient(160deg, oklch(15% 0.03 175) 0%, oklch(12% 0.04 200) 50%, oklch(14% 0.05 160) 100%)',
          padding: 48,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', right: '-30%', width: '80%', height: '80%', background: 'radial-gradient(circle, oklch(50% 0.14 175 / 0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-25%', width: '70%', height: '70%', background: 'radial-gradient(circle, oklch(65% 0.18 55 / 0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, oklch(100% 0 0 / 0.03) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="lg" href="/" baseColor="oklch(95% 0.005 175)" suffixColor="#e23b3b" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'oklch(94% 0.005 175)', lineHeight: 1.2, marginBottom: 16 }}>
            Start your<br />journey here.
          </h1>
          <p style={{ fontSize: '1rem', color: 'oklch(75% 0.008 175)', lineHeight: 1.7, maxWidth: 400 }}>
            Create an account to read, follow journalists, join communities, and be part of the news.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Social Feed', 'Communities', 'Live Radio', 'Live TV'].map(tag => (
              <span key={tag} style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, background: 'oklch(100% 0 0 / 0.08)', border: '1px solid oklch(100% 0 0 / 0.08)', color: 'oklch(85% 0.008 175)', backdropFilter: 'blur(8px)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="p-6 lg:p-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', overflow: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" href="/" />
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>Create your account</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>

          {generalError && (
            <div style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 'var(--error-light)',
              color: 'var(--error)',
              border: '1px solid oklch(65% 0.14 25 / 0.2)',
              boxShadow: '0 0 0 1px oklch(65% 0.14 25 / 0.08), 0 4px 16px -4px oklch(65% 0.14 25 / 0.15)',
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              {generalError}
            </div>
          )}

          {/* Glass form card */}
          <div style={{
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 28px',
            boxShadow: 'var(--glow-soft)',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  style={glassInput(!!errors.name)}
                  onFocus={(e) => { if (!errors.name) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' } }}
                  onBlur={(e) => { if (!errors.name) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' } }}
                />
                {errors.name && <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--error)', fontWeight: 500 }}>{errors.name}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={glassInput(!!errors.email)}
                  onFocus={(e) => { if (!errors.email) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' } }}
                  onBlur={(e) => { if (!errors.email) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' } }}
                />
                {errors.email && <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--error)', fontWeight: 500 }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  style={glassInput(!!errors.password)}
                  onFocus={(e) => { if (!errors.password) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' } }}
                  onBlur={(e) => { if (!errors.password) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' } }}
                />
                {form.password && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= passwordStrength.score ? passwordStrength.color : 'var(--border)',
                          transition: 'background 0.3s var(--ease-out-expo)',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
                {errors.password && <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--error)', fontWeight: 500 }}>{errors.password}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={glassInput(!!errors.confirmPassword)}
                  onFocus={(e) => { if (!errors.confirmPassword) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' } }}
                  onBlur={(e) => { if (!errors.confirmPassword) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' } }}
                />
                {errors.confirmPassword && <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--error)', fontWeight: 500 }}>{errors.confirmPassword}</p>}
              </div>

              {/* Terms checkbox */}
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${acceptedTerms ? 'var(--primary)' : 'var(--border)'}`,
                      background: acceptedTerms ? 'var(--primary)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s var(--ease-out-expo)',
                      padding: 0,
                    }}
                  >
                    {acceptedTerms && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    I agree to the <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>
                  </span>
                </label>
                {errors.terms && <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--error)', fontWeight: 500 }}>{errors.terms}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: 'var(--grad-primary)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-ui)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: loading ? 'none' : 'var(--glow-primary)',
                  transition: 'all 0.3s var(--ease-out-expo)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {loading && (
                  <span style={{
                    width: 18, height: 18,
                    border: '2.5px solid oklch(100% 0 0 / 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                )}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div style={{ position: 'relative', margin: '24px 0' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.78rem', background: 'var(--bg-base)', padding: '0 16px', color: 'var(--text-muted)', fontWeight: 500 }}>
              or continue with
            </div>
          </div>

          {/* OAuth */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'Google', provider: 'google' as const, color: '#4285F4', path: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' },
              { name: 'X', provider: 'twitter' as const, color: 'currentColor', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { name: 'GitHub', provider: 'github' as const, color: 'currentColor', path: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' },
            ].map(provider => (
              <button
                key={provider.name}
                type="button"
                disabled={oauthLoading === provider.provider}
                onClick={() => handleOAuthSignIn(provider.provider)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-ui)',
                  cursor: oauthLoading === provider.provider ? 'not-allowed' : 'pointer',
                  opacity: oauthLoading && oauthLoading !== provider.provider ? 0.5 : 1,
                  transition: 'all 0.25s var(--ease-out-expo)',
                }}
                onMouseEnter={(e) => {
                  if (oauthLoading) return
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'var(--primary-light)'
                  e.currentTarget.style.color = 'var(--primary)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = 'var(--glow-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)'
                  e.currentTarget.style.background = 'var(--glass-bg)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {oauthLoading === provider.provider ? (
                  <span style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={provider.color}>
                    <path d={provider.path} />
                  </svg>
                )}
                <span style={{ display: 'none' }} className="sm:inline">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
