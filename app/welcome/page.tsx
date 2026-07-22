'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const confettiColors = ['#f2545b', '#f4a259', '#25a18e', '#3a86ff', '#8338ec', '#ffbe0b']
const confettiPieces = Array.from({ length: 50 }).map((_, i) => ({
  left: `${Math.random() * 100}%`,
  bg: confettiColors[i % confettiColors.length],
  anim: `ob-confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
}))

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      supabase
        .from('users')
        .select('name')
        .eq('auth_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setName((data as { name: string }).name)
        })
    })
  }, [router])

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vmax', height: '80vmax', background: 'radial-gradient(circle, oklch(65% 0.12 175 / 0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center', animation: 'futr-fade-up 0.6s var(--ease-out-expo) both', position: 'relative' }}>
        {/* Checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--success-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'ob-pop-in 0.6s var(--ease-out-expo)',
          boxShadow: '0 0 0 6px oklch(65% 0.12 145 / 0.08)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Welcome{name ? `, ${name}` : ''}!
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          Your account is ready. Here&apos;s what you can do next.
        </p>

        {/* Action cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {[
            { icon: '📰', title: 'Explore your feed', desc: 'Articles curated for your interests' },
            { icon: '💬', title: 'Join the conversation', desc: 'Comment, like, and share with the community' },
            { icon: '👤', title: 'Set up your profile', desc: 'Add a photo and tell people about yourself' },
            { icon: '🔔', title: 'Stay updated', desc: 'Get notifications for breaking news' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xs)',
              textAlign: 'left',
              animation: `futr-fade-up 0.4s var(--ease-out-expo) ${0.15 + i * 0.08}s both`,
            }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href="/social" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '14px 28px', borderRadius: 10,
          fontSize: '0.9rem', fontWeight: 700,
          background: 'var(--grad-primary)',
          color: '#fff', textDecoration: 'none',
          boxShadow: 'var(--glow-primary)',
          transition: 'all 0.3s var(--ease-out-expo)',
          fontFamily: 'var(--font-ui)',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Go to my feed →
        </Link>

        <Link href="/" style={{
          display: 'block', width: '100%', marginTop: 10,
          padding: '13px', borderRadius: 10,
          border: '1.5px solid var(--border)', background: 'transparent',
          color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
          textDecoration: 'none', fontFamily: 'var(--font-ui)',
          transition: 'all 0.2s var(--ease-out-expo)',
        }}>
          Browse news instead
        </Link>
      </div>

      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
        {confettiPieces.map((p, i) => (
          <span key={i} style={{
            position: 'absolute', top: -20, left: p.left,
            width: 8, height: 12, borderRadius: 2, background: p.bg,
            animation: p.anim,
          }} />
        ))}
      </div>
    </div>
  )
}
