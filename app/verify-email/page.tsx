'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'inline-block', marginBottom: 32 }}>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            026
            <span style={{ color: 'var(--primary)' }}>News</span>
          </span>
        </Link>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: '48px 40px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Animated envelope icon */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              border: '2px dashed var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
              animation: 'spin 12s linear infinite',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'spin 12s linear infinite reverse' }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 6L2 7" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Verify Your Email
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: 32,
              maxWidth: 360,
              marginInline: 'auto',
            }}
          >
            We&apos;ve sent a verification link to your email address. Check your
            inbox and click the link to activate your account.
          </p>

          {/* Primary button */}
          <a
            href="mailto:"
            style={{
              display: 'inline-block',
              width: '100%',
              padding: '14px 24px',
              background: 'var(--primary)',
              color: 'var(--bg-elevated)',
              borderRadius: 12,
              fontSize: '0.9rem',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
              marginBottom: 16,
            }}
          >
            Open Email Client
          </a>

          {/* Resend link */}
          <button
            type="button"
            style={{
              display: 'block',
              margin: '0 auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            Resend Email
          </button>
        </div>

        {/* Back to Login */}
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: 24,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
