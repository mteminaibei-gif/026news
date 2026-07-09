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

  // Reset password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  // Verify token on mount
  const [tokenVerified, setTokenVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  // If we have a token, verify it first
  if (token && !tokenVerified && !verifying === false) {
    // This will be handled in useEffect below
  }

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

  // If we have a token, verify it
  if (token) {
    return <VerifyToken token={token} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="mx-auto h-24 w-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1a5c2a] mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          {/* Dev link for testing */}
          {devLink && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-4 py-3 rounded-xl mb-4 break-all">
              <strong>Dev Link:</strong> {devLink}
            </div>
          )}

          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5c2a] hover:bg-[#13411f] text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="text-[#1a5c2a] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Token verification component
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

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4 flex items-center justify-center">
        <div className="text-[#1a5c2a]">Verifying token...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="text-red-600 mb-4">{error}</div>
            <Link href="/forgot-password" className="text-[#1a5c2a] font-semibold hover:underline">
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="mx-auto h-24 w-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1a5c2a] mb-2">New Password</h1>
          <p className="text-gray-600">Enter your new password for {userEmail}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5c2a] hover:bg-[#13411f] text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link href="/login" className="text-[#1a5c2a] font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4 flex items-center justify-center">
        <div className="text-[#1a5c2a]">Loading...</div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}