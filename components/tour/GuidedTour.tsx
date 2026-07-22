'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface TourStep {
  title: string
  description: string
  icon: string
  highlight?: string
}

const READER_STEPS: TourStep[] = [
  { title: 'Welcome to 026connet!', description: 'Your dashboard for news, discussions, and community. Let us show you around.', icon: '👋' },
  { title: 'Social Feed', description: 'See posts from journalists and the community. Like, comment, and share stories that matter.', icon: '📰', highlight: '[data-tour="social-feed"]' },
  { title: 'Explore', description: 'Discover trending stories, top journalists, and curated content from across Kenya and Africa.', icon: '🔍', highlight: '[data-tour="explore"]' },
  { title: 'Messages', description: 'Chat directly with journalists and other readers. Start conversations that matter.', icon: '💬', highlight: '[data-tour="messages"]' },
  { title: 'News Feed', description: 'Stay updated with breaking news, categorized by topic. Tap any story to read the full article.', icon: '📡', highlight: '[data-tour="news"]' },
  { title: 'Your Profile', description: 'Customize your profile, manage saved articles, and track your activity.', icon: '👤', highlight: '[data-tour="profile"]' },
  { title: 'You\'re All Set!', description: 'Start exploring! You can replay this tour anytime from your profile settings.', icon: '🚀' },
]

const AUTHOR_STEPS: TourStep[] = [
  { title: 'Welcome, Author!', description: 'You have access to powerful publishing tools. Here\'s a quick tour.', icon: '✍️' },
  { title: 'Write Articles', description: 'Access the editor from your dashboard. Write, format, and submit articles for review.', icon: '📝', highlight: '[data-tour="write"]' },
  { title: 'Your Dashboard', description: 'Track article performance, views, earnings, and manage your published content.', icon: '📊', highlight: '[data-tour="dashboard"]' },
  { title: 'Social Feed', description: 'Engage with readers, share insights, and build your audience.', icon: '💬', highlight: '[data-tour="social-feed"]' },
  { title: 'Messages', description: 'Connect with other journalists, editors, and readers directly.', icon: '✉️', highlight: '[data-tour="messages"]' },
  { title: 'Notifications', description: 'Stay updated on article approvals, comments, and community activity.', icon: '🔔', highlight: '[data-tour="notifications"]' },
  { title: 'Start Writing!', description: 'Your voice matters. Start publishing and building your audience today.', icon: '🚀' },
]

const TOUR_KEY = '036connect_tour_completed'

export function GuidedTour({ role }: { role: 'reader' | 'journalist' | 'admin' }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  const steps = role === 'reader' ? READER_STEPS : AUTHOR_STEPS
  const current = steps[step]
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        setActive(true)
        requestAnimationFrame(() => setTimeout(() => setVisible(true), 50))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setActive(false)
      localStorage.setItem(TOUR_KEY, '1')
    }, 300)
  }, [])

  const next = useCallback(() => {
    if (isLast) { close(); return }
    setVisible(false)
    setTimeout(() => {
      setStep(s => s + 1)
      requestAnimationFrame(() => setTimeout(() => setVisible(true), 50))
    }, 200)
  }, [isLast, close])

  const prev = useCallback(() => {
    if (isFirst) return
    setVisible(false)
    setTimeout(() => {
      setStep(s => s - 1)
      requestAnimationFrame(() => setTimeout(() => setVisible(true), 50))
    }, 200)
  }, [isFirst])

  if (!active) return null

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={close}
      />

      <div
        style={{
          position: 'fixed', zIndex: 9999,
          top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.9})`,
          opacity: visible ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          width: 'min(420px, calc(100vw - 32px))',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--bg-inset)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${((step + 1) / steps.length) * 100}%`,
            background: 'var(--grad-primary)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>{current.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{current.title}</h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Step {step + 1} of {steps.length}</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close tour"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--bg-inset)', color: 'var(--text-tertiary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {current.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? 'var(--primary)' : i < step ? 'var(--primary)' : 'var(--border)',
                opacity: i === step ? 1 : i < step ? 0.5 : 0.3,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button
                onClick={prev}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: isLast ? 'var(--grad-primary)' : 'var(--primary)',
                color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {isLast ? <><Sparkles size={14} /> Get Started</> : <><span>Next</span> <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function TourTrigger({ role }: { role: 'reader' | 'journalist' | 'admin' }) {
  const [show, setShow] = useState(false)

  const restart = useCallback(() => {
    localStorage.removeItem(TOUR_KEY)
    setShow(true)
  }, [])

  if (!show) return (
    <button
      onClick={restart}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)',
        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      <Sparkles size={14} /> Take Tour
    </button>
  )

  return <GuidedTour role={role} />
}
