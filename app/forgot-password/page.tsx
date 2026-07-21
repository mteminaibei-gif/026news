'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [devLink, setDevLink] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [tokenVerified, setTokenVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error ?? 'Failed to process request')
        return
      }

      setSuccess(data.message)
      if (data.devResetLink) {
        setDevLink(data.devResetLink)
      }
      setEmail('')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password')
        return
      }

      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (token) {
    return <VerifyToken token={token} />
  }

  const glassInput: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    padding: '13px 16px',
    fontSize: '0.9rem',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ maxWidth: 440, width: '100%', animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            <Logo size="lg" href="/" />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your email to receive a reset link</p>
        </div>

        <div style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          boxShadow: 'var(--glow-soft)',
        }}>
          {error && (
            <div style={{
              background: 'var(--error-light)',
              border: '1px solid oklch(65% 0.14 25 / 0.2)',
              color: 'var(--error)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 18,
              boxShadow: '0 0 0 1px oklch(65% 0.14 25 / 0.08)',
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'var(--success-light)',
              border: '1px solid oklch(65% 0.12 145 / 0.2)',
              color: 'var(--success)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
              <span>{success}</span>
            </div>
          )}

          {devLink && (
            <div style={{
              background: 'var(--warning-light)',
              border: '1px solid oklch(72% 0.13 80 / 0.3)',
              color: 'var(--warning)',
              fontSize: '0.78rem',
              fontWeight: 500,
              padding: '12px 16px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 18,
              wordBreak: 'break-all',
            }}>
              <strong>Dev Link:</strong> {devLink}
            </div>
          )}

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'var(--primary-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={glassInput}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--grad-primary)',
                color: '#fff',
                fontWeight: 700,
                padding: '14px 0',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.9rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : 'var(--glow-primary)',
                fontFamily: 'var(--font-ui)',
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyToken({ token }: { token: string }) {
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/auth/forgot-password?token=${token}`)
        const data = await res.json()

        if (!res.ok || !data.valid) {
          setError(data.error ?? 'Invalid token')
          return
        }

        setUserEmail(data.email ?? '')
      } catch (err) {
        setError('Failed to verify token')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  })

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password')
        return
      }

      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const glassInput: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    padding: '13px 16px',
    fontSize: '0.9rem',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-ui)',
    transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
  }

  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="page-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Verifying token...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ maxWidth: 440, width: '100%', animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Logo size="lg" href="/" />
          </div>
          <div style={{
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 32px',
            boxShadow: 'var(--glow-soft)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'var(--error-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
            </div>
            <p style={{ color: 'var(--error)', fontWeight: 600, marginBottom: 20, fontSize: '0.95rem' }}>{error}</p>
            <Link href="/forgot-password" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '12px 28px', borderRadius: 10,
              background: 'var(--grad-primary)', color: '#fff',
              fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
              boxShadow: 'var(--glow-primary)',
            }}>Request new reset link</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ maxWidth: 440, width: '100%', animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            <Logo size="lg" href="/" />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>New Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your new password for <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{userEmail}</span></p>
        </div>

        <div style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          boxShadow: 'var(--glow-soft)',
        }}>
          {error && (
            <div style={{
              background: 'var(--error-light)',
              border: '1px solid oklch(65% 0.14 25 / 0.2)',
              color: 'var(--error)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 18,
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'var(--success-light)',
              border: '1px solid oklch(65% 0.12 145 / 0.2)',
              color: 'var(--success)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '14px 18px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
              <span>{success}</span>
            </div>
          )}

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'var(--primary-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
          </div>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                style={glassInput}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                style={glassInput}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--grad-primary)',
                color: '#fff',
                fontWeight: 700,
                padding: '14px 0',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.9rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : 'var(--glow-primary)',
                fontFamily: 'var(--font-ui)',
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="page-spinner" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
