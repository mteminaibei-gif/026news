'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

type Step = 0 | 1 | 2 | 3 | 4 | 5

const INTERESTS = [
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'business', label: 'Business', icon: '📈' },
  { id: 'science', label: 'Science', icon: '🧬' },
  { id: 'culture', label: 'Culture', icon: '🎨' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'ai-ml', label: 'AI & ML', icon: '🤖' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'politics', label: 'Politics', icon: '🌍' },
  { id: 'fintech', label: 'Fintech', icon: '💰' },
  { id: 'startups', label: 'Startups', icon: '🚀' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'education', label: 'Education', icon: '📚' },
]

type AuthorItem = { id: string; name: string; topic: string; initials: string; grad: string; profile_image?: string | null }

const NOTIFS = [
  { id: 'daily_digest', name: 'Daily Digest Email', desc: 'Top 5 stories delivered every morning' },
  { id: 'push', name: 'Push Notifications', desc: 'Breaking news and followed author updates' },
  { id: 'comment_replies', name: 'Comment Replies', desc: 'When someone replies to your comments' },
  { id: 'weekly_recap', name: 'Weekly Recap', desc: 'Your reading stats every Sunday' },
]

const NICHES = ['Technology', 'Business', 'Health', 'Sports', 'Entertainment', 'Science', 'Politics', 'Lifestyle']
const EXPERIENCE = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']

const inputStyle: CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--border)',
  background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit',
  fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)

  // Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // Preferences
  const [interests, setInterests] = useState<string[]>([])
  const [follows, setFollows] = useState<string[]>([])
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    daily_digest: true, push: true, comment_replies: true, weekly_recap: false,
  })

  // Author application
  const [applyAuthor, setApplyAuthor] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [title, setTitle] = useState('')
  const [niche, setNiche] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [motivation, setMotivation] = useState('')
  const [terms, setTerms] = useState(false)

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

  const TOTAL = 6

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const accountValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) &&
    password === confirm

  const applyValid = !applyAuthor || (
    firstName.trim() !== '' && lastName.trim() !== '' && title.trim() !== '' && niche !== '' && bio.trim() !== '' && terms
  )

  async function finish() {
    setError('')
    if (!accountValid) { setStep(0); setError('Please complete your account details.'); return }
    if (!applyValid) { setError('Please complete the author application or uncheck it.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password,
          interests,
          notification_prefs: notifs,
          applyAuthor,
          application: { firstName, lastName, title, niche, bio, experience, portfolioUrl, linkedinUrl, motivation },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/">
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
               026<span style={{ color: '#e23b3b' }}>Newsblog</span>
            </span>
          </Link>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.4s var(--ease-out-expo)',
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 20, padding: '40px 36px', minHeight: 380,
          animation: 'ob-fade-in 0.5s var(--ease-out-expo)',
        }}>
          {error && (
            <div style={{ background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 12, fontSize: '0.85rem', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>📰</div>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Create your account</h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Join 026Newsblog and personalize your news experience.</p>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                <input style={inputStyle} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <input style={inputStyle} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input style={inputStyle} type="password" placeholder="Password (min 8, upper + lower + number)" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input style={inputStyle} type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!accountValid}
                style={{
                  width: '100%', marginTop: 22, padding: '14px', borderRadius: 11, border: 'none',
                  background: accountValid ? 'var(--primary)' : 'var(--bg-inset)',
                  color: accountValid ? 'oklch(98% 0.005 175)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.9rem', cursor: accountValid ? 'pointer' : 'not-allowed',
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
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>🎯</div>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>What are you interested in?</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>Pick at least 3 topics so we can personalize your feed.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {INTERESTS.map((it) => {
                  const sel = interests.includes(it.id)
                  return (
                    <button key={it.id} type="button" onClick={() => toggle(interests, setInterests, it.id)}
                      style={{
                        padding: '16px 10px', borderRadius: 12, border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                        background: sel ? 'var(--primary-light)' : 'var(--bg-surface)', cursor: 'pointer',
                        transition: 'all 0.2s var(--ease-out-expo)',
                      }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{it.icon}</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: sel ? 'var(--primary)' : 'var(--text-primary)' }}>{it.label}</div>
                    </button>
                  )
                })}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                {interests.length} selected · Pick at least 3 to continue
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={ghostBtn}>← Back</button>
                <button onClick={() => setStep(2)} disabled={interests.length < 3} style={primaryBtn(interests.length >= 3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Follow authors ── */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>✍️</div>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Follow some authors</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>Get notified when these writers publish new stories.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {authors.length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>Loading authors...</p>
                )}
                {authors.map((a) => {
                  const f = follows.includes(a.id)
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      {a.profile_image ? (
                        <img src={a.profile_image} alt={a.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: a.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(98% 0.005 175)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{a.initials}</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{a.topic}</div>
                      </div>
                      <button onClick={() => toggle(follows, setFollows, a.id)} style={{
                        padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${f ? 'var(--primary)' : 'var(--border)'}`,
                        background: f ? 'var(--primary)' : 'transparent', color: f ? 'oklch(98% 0.005 175)' : 'var(--text-secondary)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
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
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>🔔</div>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Stay in the loop</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>Choose how you&apos;d like to hear from us.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
                {NOTIFS.map((n) => {
                  const on = notifs[n.id]
                  return (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '1.1rem' }}>{n.id === 'push' ? '🔔' : n.id === 'comment_replies' ? '💬' : n.id === 'weekly_recap' ? '📈' : '✉️'}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{n.desc}</div>
                      </div>
                      <button onClick={() => setNotifs((p) => ({ ...p, [n.id]: !p[n.id] }))} style={{
                        width: 42, height: 24, borderRadius: 12, background: on ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                      }}>
                        <span style={{ position: 'absolute', top: 3, left: 3, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-elevated)', transition: 'transform 0.2s var(--ease-out-expo)', transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
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

          {/* ── Step 4: Apply as Author ── */}
          {step === 4 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>✨</div>
                <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Want to write for us?</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>You&apos;re signed up as a reader. Apply to become an author — it only takes a minute.</p>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: `1.5px solid ${applyAuthor ? 'var(--primary)' : 'var(--border-subtle)'}`, background: applyAuthor ? 'var(--primary-light)' : 'var(--bg-surface)', cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={applyAuthor} onChange={(e) => setApplyAuthor(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Apply as an Author</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Earn 70% revenue share, M-Pesa payouts, analytics & more.</div>
                </div>
              </label>

              {applyAuthor && (
                <div style={{ display: 'grid', gap: 12, marginBottom: 18, animation: 'ob-fade-in 0.4s var(--ease-out-expo)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
                    <input style={inputStyle} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <input style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <input style={inputStyle} placeholder="Professional title (e.g. Tech Author)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <select style={inputStyle} value={niche} onChange={(e) => setNiche(e.target.value)}>
                    <option value="">Select your writing niche</option>
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <textarea style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Short bio — what you cover" value={bio} onChange={(e) => setBio(e.target.value)} />
                  <select style={inputStyle} value={experience} onChange={(e) => setExperience(e.target.value)}>
                    <option value="">Years of experience</option>
                    {EXPERIENCE.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Portfolio URL (optional)" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
                  <input style={inputStyle} placeholder="LinkedIn profile (optional)" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} placeholder="Why do you want to write for 026Newsblog?" value={motivation} onChange={(e) => setMotivation(e.target.value)} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                    I agree to the terms and conditions
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={ghostBtn}>← Back</button>
                <button onClick={() => setStep(5)} disabled={!applyValid} style={primaryBtn(applyValid)}>
                  {applyAuthor ? 'Review →' : 'Finish →'}
                </button>
              </div>
              {applyAuthor && !applyValid && (
                <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--error)', marginTop: 10 }}>
                  Please complete the required fields and accept the terms.
                </p>
              )}
            </div>
          )}

          {/* ── Step 5: Done / Review ── */}
          {step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, oklch(50% 0.15 175), oklch(45% 0.12 220))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', margin: '0 auto 20px' }}>
                {name.trim().charAt(0).toUpperCase() || '👋'}
              </div>
              <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>You&apos;re all set, {name.split(' ')[0] || 'friend'}!</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '40ch', margin: '0 auto 24px' }}>
                {applyAuthor ? 'Your author application is ready to submit. ' : ''}We&apos;ll send a verification link to <strong style={{ color: 'var(--primary)' }}>{email}</strong>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
                <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{interests.length}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Topics</div></div>
                <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{follows.length}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Authors</div></div>
                <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>{Object.values(notifs).filter(Boolean).length}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Alerts</div></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(4)} style={ghostBtn}>← Back</button>
                <button onClick={finish} disabled={loading} style={{ ...primaryBtn(true), flex: 1 }}>
                  {loading ? '⏳ Creating account…' : applyAuthor ? 'Submit Application' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <a href="#" onClick={(e) => { e.preventDefault(); if (step < 5) setStep((s) => (s + 1) as Step) }} style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: '0.78rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          Skip for now
        </a>
      </div>
      </div>
      <Footer />
    </div>
  )
}

function primaryBtn(enabled: boolean): CSSProperties {
  return {
    flex: 1, padding: '14px 24px', borderRadius: 11, border: 'none', fontWeight: 700, fontSize: '0.88rem',
    background: enabled ? 'var(--primary)' : 'var(--bg-inset)', color: enabled ? 'oklch(98% 0.005 175)' : 'var(--text-muted)',
    cursor: enabled ? 'pointer' : 'not-allowed', transition: 'all 0.2s var(--ease-out-expo)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit',
  }
}

const ghostBtn: CSSProperties = {
  padding: '14px 22px', borderRadius: 11, border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
  transition: 'all 0.2s var(--ease-out-expo)',
}
