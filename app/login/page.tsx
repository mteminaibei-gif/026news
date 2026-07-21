'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'


function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(params.get('message') || '')
  const urlError = params.get('error')
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

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
        const role = (p as { role?: string } | null)?.role
        if (role === 'admin') home = '/admin'
      } catch { /* ignore */ }
      router.replace(home)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Please enter your email and password')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        setLoading(false)
        return
      }

      const role = data.user?.role?.toLowerCase()
      if (role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/social'
      }
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  async function handleOAuthSignIn(provider: 'google' | 'github' | 'twitter' | 'facebook') {
    setOauthLoading(provider)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch {
      setError('Failed to sign in with ' + provider)
    } finally {
      setOauthLoading(null)
    }
  }

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
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-30%', width: '80%', height: '80%', background: 'radial-gradient(circle, oklch(50% 0.14 175 / 0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-25%', width: '70%', height: '70%', background: 'radial-gradient(circle, oklch(65% 0.18 55 / 0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '40%', height: '40%', background: 'radial-gradient(circle, oklch(55% 0.12 220 / 0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Grid pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, oklch(100% 0 0 / 0.03) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="lg" href="/" baseColor="oklch(95% 0.005 175)" suffixColor="#e23b3b" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'oklch(94% 0.005 175)', lineHeight: 1.2, marginBottom: 16 }}>
            Welcome back to<br />the story.
          </h1>
          <p style={{ fontSize: '1rem', color: 'oklch(75% 0.008 175)', lineHeight: 1.7, maxWidth: 400 }}>
            Sign in to continue reading, writing, and engaging with Kenya&apos;s most trusted news platform.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['News', 'Analysis', 'Opinion', 'Data'].map(tag => (
              <span key={tag} style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, background: 'oklch(100% 0 0 / 0.08)', border: '1px solid oklch(100% 0 0 / 0.08)', color: 'oklch(85% 0.008 175)', backdropFilter: 'blur(8px)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="p-6 lg:p-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" href="/" />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>Sign In</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              New to 026connet!?{' '}
              <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, transition: 'color 0.2s' }}>Create an account</Link>
            </p>
          </div>

          {error && (
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
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 'var(--success-light)',
              color: 'var(--success)',
              border: '1px solid oklch(65% 0.12 145 / 0.2)',
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              {success}
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.01em' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-ui)',
                    outline: 'none',
                    transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.boxShadow = 'var(--glow-primary)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', transition: 'opacity 0.2s' }}>Forgot password?</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-ui)',
                    outline: 'none',
                    transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.boxShadow = 'var(--glow-primary)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
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
                  }} />
                )}
                {loading ? 'Signing in...' : 'Sign In'}
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

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
          <div className="page-spinner" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
