'use client'

import { useEffect, useRef, useState } from 'react'
import { trackAdImpression, trackAdClick } from '@/lib/hooks/useTracking'

interface Props {
  adId: string
  slot: 'sidebar' | 'feed'
  title: string
  body: string
  imageUrl?: string
  cta?: string
  ctaUrl?: string
}

export function SponsoredCard({ adId, slot, title, body, imageUrl, cta = 'Learn More', ctaUrl = '#' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || visible) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          trackAdImpression(adId, slot)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [adId, slot, visible])

  if (slot === 'sidebar') {
    return (
      <div
        ref={ref}
        className="social-side-card sponsored-card"
        style={{
          animation: 'futr-fade-up 0.5s var(--ease-out-expo) both',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
          transition: 'transform 0.3s var(--ease-out-expo), box-shadow 0.3s',
        }}
        onClick={() => { trackAdClick(adId, slot); if (ctaUrl !== '#') window.open(ctaUrl, '_blank') }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: 140, objectFit: 'cover' }}
            loading="lazy"
          />
        )}
        <div style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 4 }}>Sponsored</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>{body}</div>
          <button
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--grad-primary)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--glow-primary)',
              transition: 'transform 0.2s',
            }}
            onClick={e => { e.stopPropagation(); trackAdClick(adId, slot); if (ctaUrl !== '#') window.open(ctaUrl, '_blank') }}
          >
            {cta}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="social-post sponsored-feed-card"
      style={{
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'futr-fade-up 0.5s var(--ease-out-expo) both',
        cursor: 'pointer',
        transition: 'transform 0.3s var(--ease-out-expo), box-shadow 0.3s',
      }}
      onClick={() => { trackAdClick(adId, slot); if (ctaUrl !== '#') window.open(ctaUrl, '_blank') }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600, background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--glass-border)' }}>Ad</div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}
          loading="lazy"
        />
      )}
      <div style={{ padding: '0.9rem 1rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{body}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              padding: '7px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--grad-primary)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--glow-primary)',
              transition: 'transform 0.2s',
            }}
            onClick={e => { e.stopPropagation(); trackAdClick(adId, slot); if (ctaUrl !== '#') window.open(ctaUrl, '_blank') }}
          >
            {cta}
          </button>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Sponsored</span>
        </div>
      </div>
    </div>
  )
}
