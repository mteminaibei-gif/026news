'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type SignupRole = 'reader' | 'journalist' | 'admin'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<SignupRole>('reader')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Reader-specific fields
  const [location, setLocation] = useState('')

  // Journalist-specific fields
  const [bio, setBio] = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [phone, setPhone] = useState('')

  // Admin-specific fields
  const [adminSecret, setAdminSecret] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < (role === 'admin' ? 8 : 6)) {
      setError(`Password must be at least ${role === 'admin' ? 8 : 6} characters`)
      setLoading(false)
      return
    }

    try {
      if (role === 'reader') {
        if (!name || !email) {
          setError('Please fill in your name and email')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            role: 'reader',
            location 
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
        setSuccess('Account created! Please check your email to verify, then sign in.')
        setName(''); setEmail(''); setPassword(''); setConfirmPassword('')
        return
      }

      if (role === 'journalist') {
        if (!name || !email || !bio || !organization) {
          setError('Please fill all required fields (name, email, bio, organization)')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            bio, 
            organization, 
            portfolio, 
            phone,
            role: 'journalist'
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
        setSuccess('Journalist account created! You can now sign in to start publishing.')
        setName(''); setEmail(''); setPassword(''); setBio(''); setOrganization('')
        return
      }

      if (role === 'admin') {
        if (!name || !email) {
          setError('Please fill in your name and email')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/admin-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, secret: adminSecret }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Admin signup failed'); return }
        setSuccess('Admin account created! You can now sign in to access the dashboard.')
        setName(''); setEmail(''); setPassword(''); setAdminSecret('')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4 relative overflow-hidden">
      {/* WhatsApp-style doodle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large chat bubbles */}
        <div className="absolute top-5 left-8 w-24 h-24 text-green-300/15 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        
        <div className="absolute top-20 right-5 w-18 h-18 text-blue-300/15 animate-float">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-1/4 left-5 w-14 h-14 text-yellow-300/15 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-10 right-15 w-20 h-20 text-purple-300/15 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M3 3h18v13H3V3zm1 2v9h16V5H4zm7 2h2v2h-2V7zm0 4h2v2h-2v-2zm-4-4h2v2H7V7zm0 4h2v2H7v-2z"/>
          </svg>
        </div>
        
        <div className="absolute top-2/3 right-1/3 w-10 h-10 text-green-300/10 animate-float">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        
        {/* Small random dots */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.15 + 0.05,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-full h-full ${
              Math.random() > 0.66 ? 'text-green-300/10' : 
              Math.random() > 0.33 ? 'text-blue-300/10' : 'text-purple-300/10'
            }`}>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
        ))}
        
        {/* News-related icons */}
        <div className="absolute top-10 left-1/4 w-16 h-16 text-red-300/10 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"/>
            <path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 text-orange-300/10 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h7v2H7z"/>
          </svg>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="mx-auto h-24 w-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1a5c2a] mb-2">Join 026NEWS</h1>
          <p className="text-gray-600">Create your account and start your journey</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => { setRole('reader'); setError(''); setSuccess('') }}
            className={`p-4 rounded-2xl border-2 transition-all text-center ${
              role === 'reader'
                ? 'border-[#1a5c2a] bg-white shadow-lg'
                : 'border-gray-200 bg-white/60 hover:border-[#4caf28]'
            }`}
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-bold text-sm text-[#1a5c2a]">Reader</div>
            <div className="text-xs text-gray-500 mt-1">Browse & comment</div>
          </button>

          <button
            type="button"
            onClick={() => { setRole('journalist'); setError(''); setSuccess('') }}
            className={`p-4 rounded-2xl border-2 transition-all text-center ${
              role === 'journalist'
                ? 'border-[#1a5c2a] bg-white shadow-lg'
                : 'border-gray-200 bg-white/60 hover:border-[#4caf28]'
            }`}
          >
            <div className="text-3xl mb-2">✍️</div>
            <div className="font-bold text-sm text-[#1a5c2a]">Author</div>
            <div className="text-xs text-gray-500 mt-1">Write & publish</div>
          </button>

          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); setSuccess('') }}
            className={`p-4 rounded-2xl border-2 transition-all text-center ${
              role === 'admin'
                ? 'border-[#1a5c2a] bg-white shadow-lg'
                : 'border-gray-200 bg-white/60 hover:border-[#4caf28]'
            }`}
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-bold text-sm text-[#1a5c2a]">Admin</div>
            <div className="text-xs text-gray-500 mt-1">Manage platform</div>
          </button>
        </div>

        {/* Role Description */}
        <div className="bg-white rounded-2xl p-4 mb-6 text-sm">
          {role === 'reader' && (
            <div className="text-gray-600">
              <strong className="text-[#1a5c2a]">Reader Account</strong> — Browse all articles, 
              save favorites, comment on stories, and personalize your news feed.
            </div>
          )}
          {role === 'journalist' && (
            <div className="text-gray-600">
              <strong className="text-[#1a5c2a]">Author Account</strong> — Write and publish articles, 
              track your earnings, build your audience, and grow your journalist profile.
            </div>
          )}
          {role === 'admin' && (
            <div className="text-gray-600">
              <strong className="text-[#1a5c2a]">Admin Account</strong> — Full access to manage 
              users, content, analytics, and platform settings. Requires authorization secret.
            </div>
          )}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name - All roles */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            {/* Email - All roles */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Email Address *
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

            {/* Password - All roles */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={role === 'admin' ? 'Min 8 characters' : 'Min 6 characters'}
                required
                minLength={role === 'admin' ? 8 : 6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            {/* Confirm Password - All roles */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Confirm Password *
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

            {/* Reader-specific fields */}
            {role === 'reader' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                />
              </div>
            )}

            {/* Journalist-specific fields */}
            {role === 'journalist' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Organization / Outlet *
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Your news outlet or publication"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Short Bio *
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="What you cover, your beat and experience"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Portfolio URL (optional)
                  </label>
                  <input
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Phone / M-Pesa (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Admin-specific fields */}
            {role === 'admin' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Admin Authorization Secret *
                </label>
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter admin secret"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact your platform owner if you don&apos;t have an admin secret.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5c2a] hover:bg-[#13411f] text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20 mt-4"
            >
              {loading ? 'Creating Account...' : `Create ${role === 'reader' ? 'Reader' : role === 'journalist' ? 'Author' : 'Admin'} Account`}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1a5c2a] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}