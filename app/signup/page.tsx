'use client'

import { useState, useEffect } from 'react'
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

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '', general: '' }))
  }

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

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

  return (
    <div className="auth-layout grid grid-cols-1 lg:grid-cols-2" style={{ flex: 1, width: '100%' }}>
      {/* Left Panel: Branding */}
      <div
        className="auth-brand hidden lg:flex"
        style={{
          background: 'oklch(18% 0.03 175)',
          padding: 48,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20%', right: '-30%', width: '80%', height: '80%', background: 'radial-gradient(circle, oklch(35% 0.08 175 / 0.3) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, oklch(50% 0.1 55 / 0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="lg" href="/" baseColor="oklch(95% 0.005 175)" suffixColor="#e23b3b" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'oklch(94% 0.005 175)', lineHeight: 1.2, marginBottom: 16 }}>
            Start your<br />journey here.
          </h1>
          <p style={{ fontSize: '1rem', color: 'oklch(75% 0.008 175)', lineHeight: 1.6, maxWidth: 400 }}>
            Create an account to read, follow journalists, join communities, and be part of the news.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Social Feed', 'Communities', 'Live Radio', 'Live TV'].map(tag => (
              <span key={tag} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, background: 'oklch(25% 0.03 175)', color: 'oklch(80% 0.008 175)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="p-6 lg:p-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" href="/" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>

          {generalError && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light, #fdeceb)', color: 'var(--error, #b5372f)' }}>
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: errors.name ? '1px solid var(--error)' : '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--error, #d8453a)' }}>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: errors.email ? '1px solid var(--error)' : '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error, #d8453a)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: errors.password ? '1px solid var(--error)' : '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error, #d8453a)' }}>{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: errors.confirmPassword ? '1px solid var(--error)' : '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--error, #d8453a)' }}>{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{
                background: 'var(--primary)',
                color: 'var(--bg-elevated)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ background: 'var(--bg-elevated)', padding: '0 12px', color: 'var(--text-muted)' }}>
              or continue with
            </div>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-3 gap-3">
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
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
              >
                {oauthLoading === provider.provider ? (
                  <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={provider.color}>
                    <path d={provider.path} />
                  </svg>
                )}
                <span className="hidden sm:inline">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
