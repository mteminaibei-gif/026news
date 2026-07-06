'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a1628] text-white shadow-2xl border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-white/70 max-w-2xl">
          <span className="font-semibold text-white">🍪 We use cookies</span> to improve your experience,
          serve personalised content, and analyse traffic. By clicking &quot;Accept&quot; you agree to our{' '}
          <Link href="/privacy" className="underline text-orange-400 hover:text-orange-300">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="underline text-orange-400 hover:text-orange-300">
            Terms of Service
          </Link>.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="text-sm font-medium text-white/50 hover:text-white px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-lg transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
