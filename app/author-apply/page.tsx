'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/layout/Logo'
import { createClient } from '@/lib/supabase/client'

const steps = [
  { number: 1, label: 'About You' },
  { number: 2, label: 'Portfolio' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Submitted' },
]

const niches = ['World Updates', 'Kenya Focus', 'Politics & Governance', 'Business & Economy', 'Tech & Innovation', 'Health & Wellness', 'Arts & Culture', 'Sports Arena']
const experienceLevels = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years']

export default function AuthorApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [title, setTitle] = useState('')
  const [niche, setNiche] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [motivation, setMotivation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authState, setAuthState] = useState<'checking' | 'guest' | 'reader' | 'journalist' | 'pending'>('checking')

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setAuthState('guest')
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role, author_application')
        .eq('auth_id', user.id)
        .single()
      if (!active) return
      const app = (data as any)?.author_application
      if (app?.status === 'pending') setAuthState('pending')
      else if ((data as any)?.role === 'journalist') setAuthState('journalist')
      else setAuthState('reader')
    })()
    return () => { active = false }
  }, [])

  async function submitApplication() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth/apply-journalist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: [firstName, lastName].filter(Boolean).join(' ') || undefined,
          portfolio: portfolioUrl || undefined,
          title: title || undefined,
          niche: niche || undefined,
          bio: bio || undefined,
          experience: experience || undefined,
          linkedin: linkedinUrl || undefined,
          motivation: motivation || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not submit your application.')
        if (data.status === 'pending') setAuthState('pending')
        setSubmitting(false)
        return
      }
      setStep(4)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '520px',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '20px',
    padding: '2.5rem',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.05) inset',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.92rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '12px 28px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.92rem',
    fontWeight: 700,
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }

  const btnSecondary: React.CSSProperties = {
    padding: '12px 28px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.92rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  }

  if (authState === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.92rem' }}>Loading...</div>
      </div>
    )
  }

  if (authState === 'guest') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Logo size="lg" href="/" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
              ✍️
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Become a Writer
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: '320px', margin: '0 auto' }}>
              Share your stories with thousands of readers. Sign in to apply.
            </p>
          </div>
          <button style={{ ...btnPrimary, width: '100%' }} onClick={() => router.push('/login?redirect=/author-apply')}>
            Sign in to Apply
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push('/signup')}>
              Create one
            </span>
          </p>
        </div>
      </div>
    )
  }

  if (authState === 'journalist') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
              ✍️
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              You&apos;re Already a Writer
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
              Start writing and publishing right away.
            </p>
            <button style={btnPrimary} onClick={() => router.push('/journalist')}>
              Go to Studio
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (authState === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
              ⏳
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Application Under Review
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
              Your application is being reviewed. We&apos;ll email you once a decision is made.
            </p>
            <button style={btnPrimary} onClick={() => router.push('/social')}>
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size="lg" href="/" />
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '14px 18px', borderRadius: '14px', fontSize: '0.88rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 700,
                  background: step >= s.number ? 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))' : 'var(--bg-elevated)',
                  color: step >= s.number ? '#fff' : 'var(--text-muted)',
                  border: step >= s.number ? 'none' : '1.5px solid var(--border)',
                  transition: 'all 0.3s var(--ease-out-expo)',
                  boxShadow: step >= s.number ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                }}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span style={{
                  fontSize: '0.72rem', color: step >= s.number ? 'var(--primary)' : 'var(--text-muted)',
                  marginTop: '6px', fontWeight: step >= s.number ? 600 : 400,
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: '60px', height: '2px', margin: '0 8px', marginBottom: '20px',
                  background: step > s.number ? 'linear-gradient(90deg, oklch(55% 0.15 175), oklch(45% 0.12 220))' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                About You
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Tell us about your writing background.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Professional Title</label>
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tech Author" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Writing Niche</label>
                <select style={inputStyle} value={niche} onChange={(e) => setNiche(e.target.value)}>
                  <option value="">Select a niche</option>
                  {niches.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your writing experience..."
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Years of Experience</label>
                <select style={inputStyle} value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="">Select experience level</option>
                  {experienceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btnPrimary} onClick={() => setStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Your Portfolio
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Share your work and professional presence.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Portfolio URL</label>
                <input style={inputStyle} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>LinkedIn Profile</label>
                <input style={inputStyle} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
              </div>

              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '14px',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
              }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Upload Writing Samples
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  PDF, DOC, or TXT files up to 10MB
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={btnSecondary} onClick={() => setStep(1)}>Back</button>
                <button style={btnPrimary} onClick={() => setStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Review & Submit
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Review the benefits and submit your application.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '💰', title: '70% Revenue Share', desc: 'Keep the majority of your earnings' },
                  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track your article performance' },
                  { icon: '💳', title: 'M-Pesa Withdrawals', desc: 'Get paid directly to your M-Pesa' },
                  { icon: '✍️', title: 'Rich Editor', desc: 'Powerful writing and editing tools' },
                ].map((perk) => (
                  <div key={perk.title} style={{
                    padding: '1rem', borderRadius: '14px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{perk.icon}</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '2px' }}>
                      {perk.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{perk.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Why do you want to write for 026connet!?</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Share your motivation..."
                />
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem',
              }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                />
                I agree to the terms and conditions
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={btnSecondary} onClick={() => setStep(2)}>Back</button>
                <button style={btnPrimary} onClick={submitApplication} disabled={submitting || !termsAccepted}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, oklch(55% 0.15 175), oklch(45% 0.12 220))',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem',
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Application Submitted!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
                Thank you for applying. We&apos;ll review your application and get back to you within 48 hours.
              </p>
              <button style={btnPrimary} onClick={() => window.location.href = '/'}>
                Back to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
