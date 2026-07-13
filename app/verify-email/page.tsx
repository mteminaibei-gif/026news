'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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

  // After a successful confirmation, send the reader to their profile.
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push('/profile'), 4000)
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
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 40 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            026<span style={{ color: 'var(--primary)' }}>Newsblog</span>
          </span>
        </Link>

        {/* ── Check your email ── */}
        {!success && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '48px 40px' }}>
            <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 24px' }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px dashed var(--primary)', opacity: 0.2, animation: 'ob-spin-slow 20s linear infinite' }} />
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 72, height: 52, background: 'var(--primary)', borderRadius: 6 }} />
              <div style={{ position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '36px solid transparent', borderRight: '36px solid transparent', borderTop: '28px solid var(--primary-hover)', animation: 'ob-flap-open 2s var(--ease-out-expo) infinite', transformOrigin: 'top center' }} />
              <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 56, height: 40, background: 'var(--bg-elevated)', borderRadius: 4, animation: 'ob-letter-peek 2s var(--ease-out-expo) infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 32, height: 3, background: 'var(--border)', borderRadius: 2 }} />
              </div>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Check your email</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>We&apos;ve sent a verification link to</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 28 }}>{email || 'your email'}</p>

            <div style={{ textAlign: 'left', background: 'var(--bg-inset)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
              {[
                'Open your email inbox (check spam/promotions too)',
                'Find the email from 026Newsblog',
                'Click the "Verify Email" button in the message',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: i < 2 ? 12 : 0 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  {t}
                </div>
              ))}
            </div>

            <a href={email ? `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}` : 'https://mail.google.com'} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 28px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, background: 'var(--primary)', color: 'oklch(98% 0.005 175)', textDecoration: 'none' }}>
              ✉️ Open Gmail
            </a>

            <button onClick={() => setSuccess(true)} style={{ display: 'block', width: '100%', marginTop: 10, padding: '13px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              I&apos;ll check later
            </button>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>Didn&apos;t receive the email?</p>
              <button onClick={resend} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-tertiary)' : 'var(--primary)', fontWeight: 600, fontSize: '0.82rem', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
              </button>
              {resendMsg && <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 6 }}>{resendMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Verified success ── */}
        {success && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '48px 40px', animation: 'ob-fade-in 0.5s var(--ease-out-expo)' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'ob-pop-in 0.5s var(--ease-out-expo)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>Email Verified!</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '38ch', margin: '0 auto 28px' }}>
              Your account is confirmed and ready to go. Welcome to the 026Newsblog community{email ? `, ${email.split('@')[0]}` : ''}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 28 }}>
              {[
                'Personalized feed based on your interests',
                'Save & like articles to build your library',
                'Join conversations with authors and readers',
                'Listen to articles narrated by AI while commuting',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-inset)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <span><strong style={{ color: 'var(--text-primary)' }}>{f.split(' ')[0] === 'Personalized' ? 'Personalized feed' : f.split(' ').slice(0, 2).join(' ')}</strong> {f.replace(/^\S+\s/, '')}</span>
                </div>
              ))}
            </div>

            <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 28px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 700, background: 'var(--primary)', color: 'oklch(98% 0.005 175)', textDecoration: 'none', marginBottom: 10 }}>
              🎉 Go to my profile
            </Link>
            <Link href="/" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Browse news instead
            </Link>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 14 }}>
              Redirecting you to your profile…
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
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-tertiary)' }}>Loading…</div>
      }>
        <VerifyEmailInner />
      </Suspense>
      <Footer />
    </div>
  )
}
