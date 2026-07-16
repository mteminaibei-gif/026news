import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Subscribe — 026News',
  description: 'Subscribe to the 026News daily digest and never miss a story.',
}

export default function SubscribePage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Daily Digest</h1>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
        Get the biggest stories of the day delivered to your inbox every morning. Curated by our editorial team.
      </p>

      <form className="digest-form" action="/api/subscribe" method="post" style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
        <input
          className="digest-input"
          type="email"
          name="email"
          placeholder="Your email address"
          required
          aria-label="Email address"
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14 }}
        />
        <button
          className="digest-btn"
          type="submit"
          style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
        >
          Subscribe
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
        No spam, unsubscribe anytime. We respect your inbox.
      </p>

      <Link href="/" style={{ display: 'inline-block', marginTop: 32, fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
        ← Back to Home
      </Link>
    </div>
  )
}
