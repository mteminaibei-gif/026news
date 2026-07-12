'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  /** If true, renders the full dark card (sidebar); if false, renders inline form */
  variant?: 'card' | 'inline'
}

export function SubscribeWidget({ variant = 'card' }: Props) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage('You\'re subscribed! Check your inbox to confirm.')
        setEmail('')
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (variant === 'card') {
    return (
      <div className="rounded-xl p-5 text-center text-white" style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}>
        <h4 className="font-bold mb-1">Subscribe for Full Access</h4>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Unlimited access to premium freelance journalism.</p>

        {status === 'success' ? (
          <p className="text-sm font-semibold py-2" style={{ color: 'var(--success)' }}>{message}</p>
        ) : (
          <form onSubmit={handleSubscribe} noValidate>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              aria-label="Email address for subscription"
              className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 mb-2 outline-none focus:ring-2 focus:ring-orange-400"
            />
            {status === 'error' && (
              <p className="text-xs mb-2" style={{ color: 'var(--error)' }}>{message}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe Now'}
            </button>
          </form>
        )}
        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Or <Link href="/subscribe" className="underline hover:text-white">view plans →</Link>
        </p>
      </div>
    )
  }

  // inline variant used inside article sidebar
  return (
    <div className="rounded-xl p-5 text-white text-center" style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}>
      <h4 className="font-bold mb-1">Subscribe for Full Access</h4>
      <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Unlimited access to premium content.</p>
      {status === 'success' ? (
        <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>{message}</p>
      ) : (
        <form onSubmit={handleSubscribe} noValidate className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            aria-label="Email address for subscription"
            className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-400"
          />
          {status === 'error' && <p className="text-xs" style={{ color: 'var(--error)' }}>{message}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe Now'}
          </button>
        </form>
      )}
    </div>
  )
}
