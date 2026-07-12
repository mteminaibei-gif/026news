'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'kenya', label: 'Kenya', emoji: '🇰🇪' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'health', label: 'Health', emoji: '🏥' },
  { id: 'africa', label: 'Africa', emoji: '🌍' },
  { id: 'science', label: 'Science', emoji: '🔬' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>([])

  const totalSteps = 3
  const progress = ((step + 1) / totalSteps) * 100

  function toggleCategory(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

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
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/">
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
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: 'var(--bg-inset)',
            marginBottom: 40,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 99,
              background: 'var(--primary)',
              transition: 'width 0.4s var(--ease-out-expo)',
            }}
          />
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: '48px 40px',
            boxShadow: 'var(--card-shadow)',
            minHeight: 360,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Slide 0: Welcome */}
          {step === 0 && (
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 24 }}>📰</div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 12,
                }}
              >
                Welcome to 026News
              </h1>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  maxWidth: 420,
                  margin: '0 auto 32px',
                }}
              >
                Your personalized news experience awaits. We deliver the stories
                that matter most to you — from Kenya and across Africa, in real
                time.
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '14px 48px',
                  background: 'var(--primary)',
                  color: 'var(--bg-elevated)',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.2s',
                }}
              >
                Get Started
              </button>
            </div>
          )}

          {/* Slide 1: Pick Interests */}
          {step === 1 && (
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                Pick Your Interests
              </h2>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-tertiary)',
                  marginBottom: 28,
                }}
              >
                Select at least 3 topics to personalize your feed.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {CATEGORIES.map((cat) => {
                  const active = selected.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--primary-light)' : 'var(--bg-elevated)',
                        color: active ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={selected.length < 3}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: selected.length >= 3 ? 'var(--primary)' : 'var(--bg-inset)',
                  color: selected.length >= 3 ? 'var(--bg-elevated)' : 'var(--text-muted)',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: selected.length >= 3 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Slide 2: All Set */}
          {step === 2 && (
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--success-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 12,
                }}
              >
                You&apos;re All Set!
              </h2>

              <p
                style={{
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  marginBottom: 24,
                }}
              >
                You&apos;re following{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  {selected.length} topic{selected.length !== 1 ? 's' : ''}
                </strong>
                . Your feed is now personalized.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center',
                  marginBottom: 36,
                }}
              >
                {selected.map((id) => {
                  const cat = CATEGORIES.find((c) => c.id === id)
                  if (!cat) return null
                  return (
                    <span
                      key={id}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => router.push('/')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'var(--primary)',
                  color: 'var(--bg-elevated)',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Start Reading
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step > 0 && step < 2 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
            >
              ← Back
            </button>
            <span
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              {step} of {totalSteps - 1}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
