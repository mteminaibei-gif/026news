'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

// Separated component so useSearchParams is inside a Suspense boundary
function LoginForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [bio, setBio] = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [phone, setPhone] = useState('')

  const params = useSearchParams()
  const redirectTo = params.get('redirect') ?? '/'
  const urlMessage = params.get('message')
  const urlError = params.get('error')
  const modeParam = params.get('mode')

  useEffect(() => {
    if (urlMessage) setSuccessMessage(urlMessage)
    if (urlError) setError(urlError)
    if (modeParam === 'signup') setMode('signup')
  }, [urlMessage, urlError, modeParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const payload: Record<string, string> = { email, password }

    if (mode === 'signup') {
      payload.name = name.trim() || email.split('@')[0]
      payload.role = 'journalist'
      payload.bio = bio
      payload.organization = organization
      payload.portfolio = portfolio
      payload.phone = phone

      if (!name || !email || password.length < 6 || !bio || !organization) {
        setError('Please complete all required fields (name, bio, organization, password min 6 chars).')
        setLoading(false)
        return
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Authentication failed')
      return
    }

    if (mode === 'login') {
      const role = data.user?.role
      if (role === 'admin') window.location.href = '/admin/dashboard'
      else if (role === 'journalist') window.location.href = '/journalist/dashboard'
      else window.location.href = redirectTo || '/'
      return
    }

    setSuccessMessage(
      data.message ?? 'Account created. Check your inbox to confirm your email before signing in.'
    )
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" aria-label="026News home">
          <Image src="/logo.svg" alt="026News" width={160} height={48} className="mx-auto h-12 w-auto mb-2" />
        </Link>
        <p className="text-sm text-gray-400">
          {mode === 'login' ? 'Sign in to your account' : 'Create a journalist account'}
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="name">Full Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Alex Johnson" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required minLength={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </div>

        {mode === 'signup' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
              Sign-up is for journalists only. Readers can enjoy the full public experience without an account.
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="org">Organization / Outlet</label>
              <input id="org" type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="Your news outlet" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="bio">Short Bio</label>
              <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} required
                placeholder="What you cover, your beat and experience"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="portfolio">Portfolio / Website (optional)</label>
              <input id="portfolio" type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.example"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="phone">Phone (optional)</label>
              <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-[#0d2a6e] hover:bg-[#1a3a6e] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {/* OAuth */}
      <div className="mt-4">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">or continue with</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            🌐 Google
          </button>
          <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            🐙 GitHub
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400 mt-5">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-blue-600 font-semibold hover:underline">
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>

      {/* Demo shortcuts */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400 mb-2">Demo shortcuts</p>
        <div className="flex gap-2">
          <Link href="/journalist/dashboard" className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 transition-colors">
            ✍️ Journalist
          </Link>
          <Link href="/admin/dashboard" className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 transition-colors">
            ⚙️ Admin
          </Link>
          <Link href="/" className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 transition-colors">
            🏠 Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] px-4">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex items-center justify-center h-64">
          <div className="text-gray-400 text-sm">Loading…</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
