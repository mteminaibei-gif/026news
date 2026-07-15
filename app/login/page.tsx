'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(params.get('message') || '')
  const urlError = params.get('error')

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
        window.location.href = '/admin/profile'
      } else if (role === 'journalist') {
        window.location.href = '/journalist/profile'
      } else {
        window.location.href = '/profile'
      }
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
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
          <span className="text-2xl font-bold" style={{ color: 'oklch(95% 0.005 175)' }}>
             026<span style={{ color: '#e23b3b' }}>Newsblog</span>
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 600, color: 'oklch(94% 0.005 175)', lineHeight: 1.2, marginBottom: 16 }}>
            Welcome back to<br />the story.
          </h1>
          <p style={{ fontSize: '1rem', color: 'oklch(75% 0.008 175)', lineHeight: 1.6, maxWidth: 400 }}>
            Sign in to continue reading, writing, and engaging with Kenya&apos;s most trusted news platform.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['News', 'Analysis', 'Opinion', 'Data'].map(tag => (
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
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
               026<span style={{ color: '#e23b3b' }}>Newsblog</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
               New to 026NEWS?{' '}
               <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create an account</Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
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
              {loading ? 'Signing in...' : 'Sign In'}
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
              { name: 'Google', color: '#4285F4', path: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' },
              { name: 'X', color: 'currentColor', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { name: 'Facebook', color: '#1877F2', path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z' },
            ].map(provider => (
              <button
                key={provider.name}
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={provider.color}>
                  <path d={provider.path} />
                </svg>
                <span className="hidden sm:inline">{provider.name}</span>
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
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
          <div style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  )
}
