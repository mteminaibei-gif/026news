'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const redirectTo = params.get('redirect') ?? '/'
  const urlMessage = params.get('message')
  const urlError = params.get('error')

  // Show message from URL params
  const [success, setSuccess] = useState(urlMessage || '')

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
        return
      }

      // Redirect based on role
      const role = data.user?.role
      if (role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (role === 'journalist') {
        window.location.href = '/journalist/dashboard'
      } else {
        // Readers go to profile or homepage
        window.location.href = redirectTo === '/' ? '/profile' : redirectTo
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4 relative overflow-hidden">
      {/* WhatsApp-style doodle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large chat bubbles */}
        <div className="absolute top-10 left-5 w-20 h-20 text-green-300/15 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        
        <div className="absolute top-1/4 right-8 w-16 h-16 text-blue-300/15 animate-float">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-1/3 left-10 w-12 h-12 text-yellow-300/15 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-20 right-10 w-24 h-24 text-purple-300/15 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M3 3h18v13H3V3zm1 2v9h16V5H4zm7 2h2v2h-2V7zm0 4h2v2h-2v-2zm-4-4h2v2H7V7zm0 4h2v2H7v-2z"/>
          </svg>
        </div>
        
        <div className="absolute top-2/3 right-1/4 w-14 h-14 text-green-300/10 animate-float">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        
        {/* Small random dots */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-6 h-6"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.15 + 0.05,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-full h-full ${Math.random() > 0.5 ? 'text-green-300/10' : 'text-blue-300/10'}`}>
              <circle cx="12" cy="12" r="6"/>
            </svg>
          </div>
        ))}
      </div>
      
      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="mx-auto h-24 w-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1a5c2a] mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#1a5c2a] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5c2a] hover:bg-[#13411f] text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              or continue with
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              🌐 Google
            </button>
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </button>
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-[#1877F2] hover:bg-blue-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#1a5c2a] font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#ecfccb] via-[#bbf7d0] to-[#86efac] py-12 px-4 flex items-center justify-center">
        <div className="text-[#1a5c2a]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}