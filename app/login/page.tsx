'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

type Mode = 'login' | 'journalist-signup' | 'admin-signup'

function LoginForm() {
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [mode, setMode]               = useState<Mode>('login')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [bio, setBio]                 = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio]     = useState('')
  const [phone, setPhone]             = useState('')

  const params     = useSearchParams()
  const redirectTo = params.get('redirect') ?? '/'
  const urlMessage = params.get('message')
  const urlError   = params.get('error')
  const modeParam  = params.get('mode')

  useEffect(() => {
    if (urlMessage) setSuccess(urlMessage)
    if (urlError)   setError(urlError)
    if (modeParam === 'signup') setMode('journalist-signup')
    if (modeParam === 'admin')  setMode('admin-signup')
  }, [urlMessage, urlError, modeParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'login') {
        const res  = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Login failed'); return }
        const role = data.user?.role
        if (role === 'admin')      window.location.href = '/admin/dashboard'
        else if (role === 'journalist') window.location.href = '/journalist/dashboard'
        else window.location.href = redirectTo || '/'
        return
      }

      if (mode === 'journalist-signup') {
        if (!name || !email || password.length < 6 || !bio || !organization) {
          setError('Please fill all required fields (name, bio, organization; password ≥ 6 chars).')
          return
        }
        const res  = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, bio, organization, portfolio, phone }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
        setSuccess(data.message ?? 'Account created! Check your inbox to confirm.')
        setName(''); setEmail(''); setPassword(''); setBio(''); setOrganization('')
        return
      }

      if (mode === 'admin-signup') {
        if (!name || !email || password.length < 8) {
          setError('Name, email, and password (≥ 8 chars) are required.')
          return
        }
        const res  = await fetch('/api/auth/admin-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, secret: adminSecret }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Admin signup failed'); return }
        setSuccess(data.message ?? 'Admin account created! Check your inbox.')
        setName(''); setEmail(''); setPassword(''); setAdminSecret('')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode !== 'login'

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <Link href="/" aria-label="026News home">
          <Image src="/logo.svg" alt="026News" width={160} height={48} className="mx-auto h-12 w-auto mb-2" />
        </Link>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {([
          { key: 'login',            label: 'Sign In' },
          { key: 'journalist-signup', label: 'Journalist' },
          { key: 'admin-signup',      label: 'Admin' },
        ] as { key: Mode; label: string }[]).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setMode(tab.key); setError(''); setSuccess('') }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400 text-center mb-5">
        {mode === 'login'            && 'Sign in to your account'}
        {mode === 'journalist-signup' && 'Create a journalist account'}
        {mode === 'admin-signup'      && 'Create an admin account'}
      </p>

      {error   && <div role="alert"  className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {isSignup && (
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="name">Full Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" required
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
            placeholder={mode === 'admin-signup' ? 'Min 8 characters' : '••••••••'} required
            minLength={mode === 'admin-signup' ? 8 : 6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </div>

        {mode === 'journalist-signup' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-xs text-orange-700">
              Journalist sign-up only. Readers can browse freely without an account.
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="org">Organization / Outlet *</label>
              <input id="org" type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="Your news outlet" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="bio">Short Bio *</label>
              <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} required
                placeholder="What you cover, your beat and experience"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="portfolio">Portfolio URL (optional)</label>
              <input id="portfolio" type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="phone">Phone / M-Pesa (optional)</label>
              <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        )}

        {mode === 'admin-signup' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              Admin accounts require an authorization secret. Contact your platform owner if you don&apos;t have one.
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="secret">Admin Authorization Secret</label>
              <input id="secret" type="password" value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-[#0d2a6e] hover:bg-[#1a3a6e] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
          {loading
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
        </button>
      </form>

      {/* OAuth */}
      <div className="mt-4">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">or continue with</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            🌐 Google
          </button>
          <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X
          </button>
          <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-[#1877F2] hover:bg-blue-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] px-4 py-12">
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
