'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'


const confettiColors = ['#f2545b', '#f4a259', '#25a18e', '#3a86ff', '#8338ec', '#ffbe0b']
const confettiPieces = Array.from({ length: 50 }).map((_, i) => ({
  left: `${Math.random() * 100}%`,
  bg: confettiColors[i % confettiColors.length],
  anim: `ob-confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
}))

function VerifyEmailInner() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const verified = params.get('verified') === '1'
  const [success, setSuccess] = useState(verified)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push('/social'), 4000)
    return () => clearTimeout(t)
  }, [success, router])

  async function resend() {
    if (resendCooldown > 0 || !email) return
    setResendMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    setResendMsg(error ? 'Could not resend. Try again shortly.' : 'Verification email sent!')
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', animation: 'futr-fade-up 0.6s var(--ease-out-expo) both' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 40 }}>
          <Logo size="md" href="/" />
        </Link>

        {/* ── Check your email ── */}
        {!success && (
          <div style={{
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 40px',
            boxShadow: 'var(--glow-soft)',
          }}>
            {/* Animated email icon */}
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 28px' }}>
              {/* Gradient glow behind icon */}
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                background: 'radial-gradient(circle, oklch(65% 0.12 175 / 0.15) 0%, transparent 70%)',
                animation: 'futr-pulse 3s ease-in-out infinite',
              }} />
              {/* Spinning dashed ring */}
              <div style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%',
                border: '2px dashed var(--primary)',
                opacity: 0.25,
                animation: 'ob-spin-slow 20s linear infinite',
              }} />
              {/* Envelope body */}
              <div style={{
                position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                width: 80, height: 56,
                background: 'var(--grad-primary)',
                borderRadius: 8,
                boxShadow: 'var(--glow-primary)',
              }} />
              {/* Envelope flap */}
              <div style={{
                position: 'absolute', bottom: 42, left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '40px solid transparent',
                borderRight: '40px solid transparent',
                borderTop: '30px solid var(--primary-hover)',
                animation: 'ob-flap-open 2.5s var(--ease-out-expo) infinite',
                transformOrigin: 'top center',
              }} />
              {/* Letter peeking */}
              <div style={{
                position: 'absolute', bottom: 34, left: '50%',
                transform: 'translateX(-50%)',
                width: 60, height: 44,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                animation: 'ob-letter-peek 2.5s var(--ease-out-expo) infinite',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px oklch(0% 0 0 / 0.1)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <span style={{ width: 36, height: 3, background: 'var(--border)', borderRadius: 2 }} />
                  <span style={{ width: 28, height: 3, background: 'var(--border-subtle)', borderRadius: 2 }} />
                </div>
              </div>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.01em' }}>Check your email</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>We&apos;ve sent a verification link to</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 32 }}>{email || 'your email'}</p>

            <div style={{
              textAlign: 'left',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xs)',
              padding: 22,
              marginBottom: 28,
            }}>
              {[
                'Open your email inbox (check spam/promotions too)',
                'Find the email from 026connet!',
                'Click the "Verify Email" button in the message',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: i < 2 ? 14 : 0, lineHeight: 1.5 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--grad-primary)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                    boxShadow: 'var(--glow-primary)',
                  }}>{i + 1}</span>
                  {t}
                </div>
              ))}
            </div>

            <a href={email ? `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}` : 'https://mail.google.com'} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '14px 28px', borderRadius: 10,
                fontSize: '0.88rem', fontWeight: 700,
                background: 'var(--grad-primary)',
                color: '#fff', textDecoration: 'none',
                boxShadow: 'var(--glow-primary)',
                transition: 'all 0.3s var(--ease-out-expo)',
                fontFamily: 'var(--font-ui)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Open Gmail
            </a>

            <button onClick={() => setSuccess(true)} style={{
              display: 'block', width: '100%', marginTop: 10,
              padding: '13px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'all 0.2s var(--ease-out-expo)',
            }}>
              I&apos;ll check later
            </button>

            <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Didn&apos;t receive the email?</p>
              <button onClick={resend} disabled={resendCooldown > 0} style={{
                background: 'none', border: 'none',
                color: resendCooldown > 0 ? 'var(--text-tertiary)' : 'var(--primary)',
                fontWeight: 600, fontSize: '0.82rem',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-ui)',
                transition: 'color 0.2s',
              }}>
                {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
              </button>
              {resendMsg && <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: 8, fontWeight: 500 }}>{resendMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Verified success ── */}
        {success && (
          <div style={{
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 40px',
            boxShadow: 'var(--glow-soft)',
            animation: 'futr-fade-up 0.5s var(--ease-out-expo) both',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'var(--success-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              animation: 'ob-pop-in 0.6s var(--ease-out-expo)',
              boxShadow: '0 0 0 8px oklch(65% 0.12 145 / 0.08)',
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>Email Verified!</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '38ch', margin: '0 auto 32px', lineHeight: 1.6 }}>
              Your account is confirmed and ready to go. Welcome to the 026connet! community{email ? `, ${email.split('@')[0]}` : ''}.
            </p>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 28,
            }}>
              {[
                { bold: 'Personalized feed', rest: 'based on your interests' },
                { bold: 'Save & like articles', rest: 'to build your library' },
                { bold: 'Join conversations', rest: 'with authors and readers' },
                { bold: 'Listen to articles', rest: 'narrated by AI while commuting' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.85rem', color: 'var(--text-secondary)',
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'var(--success-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>{f.bold}</strong> {f.rest}</span>
                </div>
              ))}
            </div>

            <Link href="/social" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '14px 28px', borderRadius: 10,
              fontSize: '0.88rem', fontWeight: 700,
              background: 'var(--grad-primary)',
              color: '#fff', textDecoration: 'none', marginBottom: 10,
              boxShadow: 'var(--glow-primary)',
              transition: 'all 0.3s var(--ease-out-expo)',
              fontFamily: 'var(--font-ui)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Go to my feed
            </Link>
            <Link href="/" style={{
              display: 'block', width: '100%', padding: '13px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-ui)',
              transition: 'all 0.2s var(--ease-out-expo)',
            }}>
              Browse news instead
            </Link>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 16 }}>
              Redirecting you to your feed...
            </p>
          </div>
        )}
      </div>

      {/* Confetti */}
      {success && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
          {confettiPieces.map((p, i) => (
            <span key={i} style={{
              position: 'absolute', top: -20, left: p.left,
              width: 8, height: 12, borderRadius: 2, background: p.bg,
              animation: p.anim,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Suspense fallback={
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
          <div className="page-spinner" />
        </div>
      }>
        <VerifyEmailInner />
      </Suspense>
    </div>
  )
}
