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
      className="fixed bottom-0 left-0 right-0 z-[9999] shadow-2xl"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>🍪 We use cookies</span> to improve your experience,
          serve personalised content, and analyse traffic. By clicking &quot;Accept&quot; you agree to our{' '}
          <Link href="/privacy" className="underline" style={{ color: 'var(--accent)' }}>
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="underline" style={{ color: 'var(--accent)' }}>
            Terms of Service
          </Link>.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-sm font-bold text-white px-5 py-2 rounded-lg transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
