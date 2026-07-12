'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

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

  const inputStyle = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} style={{ margin: '0 auto 16px', height: 96, width: 'auto' }} />
          </Link>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your email to receive a reset link</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', padding: 24 }}>
          {error && (
            <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
              {success}
            </div>
          )}

          {devLink && (
            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: 12, padding: '12px 16px', borderRadius: 12, marginBottom: 16, wordBreak: 'break-all' }}>
              <strong>Dev Link:</strong> {devLink}
            </div>
          )}

          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'var(--text-inverse)', fontWeight: 700, padding: '16px 0', borderRadius: 16, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
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

  useState(() => {
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

  const inputStyle = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }

  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ color: 'var(--primary)' }}>Verifying token...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', padding: 24 }}>
            <div style={{ color: 'var(--error)', marginBottom: 16 }}>{error}</div>
            <Link href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Request new reset link</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} style={{ margin: '0 auto 16px', height: 96, width: 'auto' }} />
          </Link>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>New Password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your new password for {userEmail}</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', padding: 24 }}>
          {error && (
            <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>{error}</div>
          )}
          {success && (
            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>{success}</div>
          )}

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary)', color: 'var(--text-inverse)', fontWeight: 700, padding: '16px 0', borderRadius: 16, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
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
        <div style={{ color: 'var(--primary)' }}>Loading...</div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
