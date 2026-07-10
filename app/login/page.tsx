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
    <div className="min-h-screen bg-gradient-to-br from-[#f0faf2] via-[#ffffff] to-[#fef7cd] py-12 px-4 relative overflow-hidden">
      {/* Kenya flag inspired background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large decorative shapes with Kenya colors */}
        <div className="absolute top-10 left-5 w-24 h-24 text-[#1a5c2a]/8 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        
        <div className="absolute top-1/4 right-8 w-20 h-20 text-[#c8102e]/8 animate-float">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-1/3 left-10 w-16 h-16 text-[#f5c518]/12 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
        
        <div className="absolute bottom-20 right-10 w-28 h-28 text-[#1a5c2a]/6 animate-bounce-slow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M3 3h18v13H3V3zm1 2v9h16V5H4zm7 2h2v2h-2V7zm0 4h2v2h-2v-2zm-4-4h2v2H7V7zm0 4h2v2H7v-2z"/>
          </svg>
        </div>
        
        {/* Scattered Kenya flag dots */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.08 + 0.02,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          >
            <div className={`w-full h-full rounded-full ${
              Math.random() > 0.7 ? 'bg-[#c8102e]' : 
              Math.random() > 0.4 ? 'bg-[#1a5c2a]' : 'bg-[#f5c518]'
            } animate-pulse`} />
          </div>
        ))}
      </div>
      
      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="mx-auto h-24 w-auto mb-4" />
          </Link>
          {/* Kenya flag accent bar */}
          <div className="w-24 h-1 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a] mx-auto rounded-full mb-4" />
          <h1 className="text-3xl font-black text-[#1a5c2a] mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-[#374151] font-medium">Sign in to your 026NEWS account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-[#1a5c2a]/10 p-8 border-2 border-[#e8f5ea] hover:border-[#1a5c2a]/20 transition-all duration-300">
          {error && (
            <div className="bg-[#dc2626]/5 border-2 border-[#dc2626]/20 text-[#dc2626] text-sm px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 font-medium">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-[#16a34a]/5 border-2 border-[#16a34a]/20 text-[#16a34a] text-sm px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 font-medium">
              <span className="text-lg">✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-[#1a5c2a] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full border-2 border-[#e8f5ea] focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/20 rounded-2xl px-5 py-4 text-sm font-medium text-[#1a1a1a] placeholder-[#6b7280] bg-[#fafdfb] transition-all duration-300 outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-[#1a5c2a] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#1a5c2a] hover:text-[#2d8a47] font-bold hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full border-2 border-[#e8f5ea] focus:border-[#1a5c2a] focus:ring-4 focus:ring-[#1a5c2a]/20 rounded-2xl px-5 py-4 text-sm font-medium text-[#1a1a1a] placeholder-[#6b7280] bg-[#fafdfb] transition-all duration-300 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] hover:from-[#2d8a47] hover:to-[#4caf28] disabled:from-[#6b7280] disabled:to-[#9ca3af] text-white font-black py-4 rounded-2xl text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/25 hover:shadow-xl hover:shadow-[#1a5c2a]/35 hover:-translate-y-1 active:scale-95 min-h-14 relative overflow-hidden group"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
              
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🇰🇪</span> Sign In to 026NEWS
                </span>
              )}
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
          <div className="grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 border-2 border-[#e8f5ea] hover:border-[#1a5c2a] rounded-xl py-3 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#f0faf2] hover:text-[#1a5c2a] transition-all duration-300 min-h-12 hover:shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="hidden sm:inline">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-[#e8f5ea] hover:border-[#1a1a1a] rounded-xl py-3 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#1a1a1a]/5 transition-all duration-300 min-h-12 hover:shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="hidden sm:inline">X</span>
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-[#e8f5ea] hover:border-[#1877F2] rounded-xl py-3 text-xs md:text-sm font-semibold text-[#1877F2] hover:bg-[#1877F2]/5 transition-all duration-300 min-h-12 hover:shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>

          {/* Demo Account for Preview */}
          <div className="mt-6 p-4 bg-[#f0faf2] dark:bg-[#1a5c2a]/20 rounded-xl border-2 border-[#1a5c2a]/20">
            <p className="text-xs font-bold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider mb-3">📋 Demo Preview Account</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Journalist:</span>
                <button
                  onClick={() => {
                    setEmail('journalist@demo.com')
                    setPassword('demo123')
                  }}
                  className="font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:underline"
                >
                  journalist@demo.com
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Admin:</span>
                <button
                  onClick={() => {
                    setEmail('admin@demo.com')
                    setPassword('demo123')
                  }}
                  className="font-semibold text-[#c8102e] hover:underline"
                >
                  admin@demo.com
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Password for both: demo123</p>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-[#6b7280]">Don&apos;t have an account?</span>{' '}
            <Link href="/signup" className="font-bold text-[#1a5c2a] hover:text-[#2d8a47] hover:underline transition-colors">
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