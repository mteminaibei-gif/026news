'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type Step = 0 | 1 | 2 | 3 | 4

const INTERESTS = [
  { id: 'tech-innovation', label: 'Tech & Innovation', icon: '💻' },
  { id: 'business-economy', label: 'Business & Economy', icon: '📈' },
  { id: 'arts-culture', label: 'Arts & Culture', icon: '🎭' },
  { id: 'health-wellness', label: 'Health & Wellness', icon: '🏥' },
  { id: 'sports-arena', label: 'Sports Arena', icon: '⚽' },
  { id: 'politics-governance', label: 'Politics & Governance', icon: '🏛️' },
  { id: 'kenya-focus', label: 'Kenya Focus', icon: '🇰🇪' },
  { id: 'world-updates', label: 'World Updates', icon: '🌐' },
  { id: 'opinion-analysis', label: 'Opinion & Analysis', icon: '💭' },
  { id: 'trending-now', label: 'Trending Now', icon: '🔥' },
  { id: 'features-profiles', label: 'Features & Profiles', icon: '📰' },
  { id: 'environment-climate', label: 'Environment & Climate', icon: '🌿' },
]

type AuthorItem = { id: string; name: string; topic: string; initials: string; grad: string; profile_image?: string | null }

const NOTIFS = [
  { id: 'daily_digest', name: 'Daily Digest Email', desc: 'Top 5 stories delivered every morning' },
  { id: 'push', name: 'Push Notifications', desc: 'Breaking news and followed author updates' },
  { id: 'comment_replies', name: 'Comment Replies', desc: 'When someone replies to your comments' },
  { id: 'weekly_recap', name: 'Weekly Recap', desc: 'Your reading stats every Sunday' },
]

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo)',
}

const STEP_LABELS = ['Account', 'Interests', 'Authors', 'Alerts', 'Review']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)

  // Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Preferences
  const [interests, setInterests] = useState<string[]>([])
  const [follows, setFollows] = useState<string[]>([])
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    daily_digest: true, push: true, comment_replies: true, weekly_recap: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authors, setAuthors] = useState<AuthorItem[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('users')
      .select('user_id, name, profile_image, bio')
      .eq('role', 'journalist' as never)
      .eq('status', 'active' as never)
      .order('rank_score', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const grads = [
            'linear-gradient(135deg, oklch(50% 0.14 220), oklch(45% 0.12 200))',
            'linear-gradient(135deg, oklch(50% 0.14 30), oklch(50% 0.12 50))',
            'linear-gradient(135deg, oklch(50% 0.14 140), oklch(45% 0.12 160))',
            'linear-gradient(135deg, oklch(50% 0.14 310), oklch(45% 0.12 330))',
            'linear-gradient(135deg, oklch(50% 0.14 25), oklch(50% 0.12 40))',
          ]
          setAuthors(data.map((u: any, i: number) => ({
            id: String(u.user_id),
            name: u.name,
            topic: u.bio?.slice(0, 30) || 'Journalist',
            initials: u.name.split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
            grad: grads[i % grads.length],
            profile_image: u.profile_image,
          })))
        }
      })
  }, [])

  const TOTAL = 5

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const accountValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) &&
    password === confirm

  async function finish() {
    setError('')
    if (!accountValid) { setStep(0); setError('Please complete your account details.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password,
          interests,
          notification_prefs: notifs,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      localStorage.setItem('026-interests', JSON.stringify(interests))
      localStorage.setItem('026-follows', JSON.stringify(follows))
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progressPct = (step / (TOTAL - 1)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'futr-fade-up 0.5s var(--ease-out-expo) both' }}>
          <Logo size="md" href="/" />
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 28, animation: 'futr-fade-up 0.5s var(--ease-out-expo) 0.1s both' }}>
          {/* Step labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            {STEP_LABELS.map((label, i) => (
              <span key={i} style={{
                fontSize: '0.7rem',
                fontWeight: i === step ? 700 : 500,
                color: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'color 0.3s var(--ease-out-expo)',
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            ))}
          </div>
          {/* Track */}
          <div style={{ position: 'relative', height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progressPct}%`,
              background: 'var(--grad-primary)',
              borderRadius: 99,
              transition: 'width 0.5s var(--ease-out-expo)',
              boxShadow: '0 0 12px -2px oklch(65% 0.12 175 / 0.4)',
            }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: 6 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', fontFeatureSettings: '"tnum"' }}>
              Step {step + 1} of {TOTAL}
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          minHeight: 420,
          boxShadow: 'var(--glow-soft)',
          animation: 'futr-fade-up 0.5s var(--ease-out-expo) 0.15s both',
        }}>
          {error && (
            <div style={{
              background: 'var(--error-light)',
              color: 'var(--error)',
              border: '1px solid oklch(65% 0.14 25 / 0.2)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: 20,
              boxShadow: '0 0 0 1px oklch(65% 0.14 25 / 0.08)',
              animation: 'futr-fade-up 0.3s var(--ease-out-expo) both',
            }}>
              {error}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.5rem' }}>📰</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>Create your account</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Join 026connet! and personalize your news experience.</p>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                <input style={inputStyle} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 44 }} type={showPassword ? 'text' : 'password'} placeholder="Password (min 8, upper + lower + number)" value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                </div>
                <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 44 }} type={showConfirm ? 'text' : 'password'} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--glow-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!accountValid}
                style={{
                  width: '100%', marginTop: 22, padding: '14px', borderRadius: 10, border: 'none',
                  background: accountValid ? 'var(--grad-primary)' : 'var(--border)',
                  color: accountValid ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.88rem', cursor: accountValid ? 'pointer' : 'not-allowed',
                  boxShadow: accountValid ? 'var(--glow-primary)' : 'none',
                  transition: 'all 0.3s var(--ease-out-expo)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Continue →
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
              </p>
            </div>
          )}

          {/* ── Step 1: Interests ── */}
          {step === 1 && (
            <div style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.5rem' }}>🎯</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>What are you interested in?</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Pick at least 3 topics so we can personalize your feed.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {INTERESTS.map((it) => {
                  const sel = interests.includes(it.id)
                  return (
                    <button key={it.id} type="button" onClick={() => toggle(interests, setInterests, it.id)}
                      style={{
                        padding: '16px 10px',
                        borderRadius: 'var(--radius-xs)',
                        border: `2px solid ${sel ? 'var(--primary)' : 'var(--glass-border)'}`,
                        background: sel ? 'var(--primary-light)' : 'var(--glass-bg)',
                        backdropFilter: sel ? 'none' : 'blur(6px)',
                        WebkitBackdropFilter: sel ? 'none' : 'blur(6px)',
                        cursor: 'pointer',
                        transition: 'all 0.25s var(--ease-out-expo)',
                        boxShadow: sel ? 'var(--glow-primary)' : 'none',
                      }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{it.icon}</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: sel ? 'var(--primary)' : 'var(--text-primary)', lineHeight: 1.3 }}>{it.label}</div>
                    </button>
                  )
                })}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>
                <span style={{ fontWeight: 700, color: interests.length >= 3 ? 'var(--success)' : 'var(--text-secondary)' }}>{interests.length}</span> selected · Pick at least 3 to continue
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={ghostBtn}>← Back</button>
                <button onClick={() => setStep(2)} disabled={interests.length < 3} style={primaryBtn(interests.length >= 3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Follow authors ── */}
          {step === 2 && (
            <div style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.5rem' }}>✍️</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Follow some authors</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Get notified when these writers publish new stories.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {authors.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                    <span className="page-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Loading authors...</span>
                  </div>
                )}
                {authors.map((a) => {
                  const f = follows.includes(a.id)
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-xs)',
                      border: `1px solid ${f ? 'oklch(65% 0.12 175 / 0.2)' : 'var(--glass-border)'}`,
                      background: f ? 'var(--primary-light)' : 'var(--glass-bg)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      transition: 'all 0.25s var(--ease-out-expo)',
                    }}>
                      {a.profile_image ? (
                        <img src={a.profile_image} alt={a.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: a.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(98% 0.005 175)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{a.initials}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{a.topic}</div>
                      </div>
                      <button onClick={() => toggle(follows, setFollows, a.id)} style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: `1.5px solid ${f ? 'var(--primary)' : 'var(--border)'}`,
                        background: f ? 'var(--primary)' : 'transparent',
                        color: f ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                        transition: 'all 0.25s var(--ease-out-expo)',
                      }}>{f ? 'Following' : 'Follow'}</button>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={ghostBtn}>← Back</button>
                <button onClick={() => setStep(3)} style={primaryBtn(true)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Notifications ── */}
          {step === 3 && (
            <div style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.5rem' }}>🔔</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Stay in the loop</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Choose how you&apos;d like to hear from us.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
                {NOTIFS.map((n) => {
                  const on = notifs[n.id]
                  return (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                      borderRadius: 'var(--radius-xs)',
                      border: `1px solid ${on ? 'oklch(65% 0.12 175 / 0.15)' : 'var(--glass-border)'}`,
                      background: on ? 'var(--primary-light)' : 'var(--glass-bg)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      transition: 'all 0.25s var(--ease-out-expo)',
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: on ? 'var(--primary)' : 'var(--bg-inset)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'background 0.25s var(--ease-out-expo)',
                      }}>
                        <span style={{ fontSize: '1.1rem', filter: on ? 'brightness(10)' : 'none' }}>{n.id === 'push' ? '🔔' : n.id === 'comment_replies' ? '💬' : n.id === 'weekly_recap' ? '📈' : '✉️'}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{n.desc}</div>
                      </div>
                      <button onClick={() => setNotifs((p) => ({ ...p, [n.id]: !p[n.id] }))} style={{
                        width: 46, height: 26, borderRadius: 13,
                        background: on ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', cursor: 'pointer', flexShrink: 0,
                        transition: 'background 0.25s var(--ease-out-expo)',
                        border: 'none', padding: 0,
                      }}>
                        <span style={{
                          position: 'absolute', top: 3, left: 3,
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#fff',
                          transition: 'transform 0.25s var(--ease-out-expo)',
                          transform: on ? 'translateX(20px)' : 'translateX(0)',
                          boxShadow: '0 1px 3px oklch(0% 0 0 / 0.15)',
                        }} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={ghostBtn}>← Back</button>
                <button onClick={() => setStep(4)} style={primaryBtn(true)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done / Review ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'var(--grad-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontWeight: 700, color: '#fff',
                margin: '0 auto 20px',
                boxShadow: 'var(--glow-primary)',
              }}>
                {name.trim().charAt(0).toUpperCase() || '👋'}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>You&apos;re all set, {name.split(' ')[0] || 'friend'}!</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '40ch', margin: '0 auto 24px', lineHeight: 1.6 }}>
                We&apos;ll send a verification link to <strong style={{ color: 'var(--primary)' }}>{email}</strong>.
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: '40ch', margin: '0 auto 24px', lineHeight: 1.5 }}>
                Want to write for 026connet!? You can apply to become an author from your profile anytime.
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 28 }}>
                {[
                  { value: interests.length, label: 'Topics' },
                  { value: follows.length, label: 'Authors' },
                  { value: Object.values(notifs).filter(Boolean).length, label: 'Alerts' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', fontFeatureSettings: '"tnum"' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={ghostBtn}>← Back</button>
                <button onClick={finish} disabled={loading} style={{ ...primaryBtn(true), flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {loading && (
                    <span style={{
                      width: 18, height: 18,
                      borderWidth: '2.5px',
                      borderStyle: 'solid',
                      borderColor: 'oklch(100% 0 0 / 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }} />
                  )}
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <a href="#" onClick={(e) => { e.preventDefault(); if (step < 5) setStep((s) => (s + 1) as Step) }} style={{ display: 'block', textAlign: 'center', marginTop: 18, fontSize: '0.78rem', color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 0.2s' }}>
          Skip for now
        </a>
      </div>
      </div>
    </div>
  )
}

function primaryBtn(enabled: boolean): CSSProperties {
  return {
    flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.88rem',
    background: enabled ? 'var(--grad-primary)' : 'var(--border)',
    color: enabled ? '#fff' : 'var(--text-muted)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? 'var(--glow-primary)' : 'none',
    transition: 'all 0.25s var(--ease-out-expo)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-ui)',
  }
}

const ghostBtn: CSSProperties = {
  padding: '14px 22px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent',
  color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-ui)',
  transition: 'all 0.25s var(--ease-out-expo)',
}
