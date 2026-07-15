'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { formatDate, formatNumber, readingTime, stripHtml } from '@/lib/utils'

interface SlideArticle {
  article_id: number
  title: string
  slug: string
  content: string
  featured_image: string | null
  views: number
  created_at: string
  author: { name: string; profile_image?: string | null } | null
  category: { name: string } | null
}

interface Props { articles: SlideArticle[] }

export function HeroCarousel({ articles }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  const slides = articles.slice(0, 7)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [paused, next, slides.length])

  if (!slides.length) return null
  const slide = slides[current]

  const isKenyan = (cat?: string | null) =>
    cat && ['Kenya', 'Africa', 'Politics', 'Business'].includes(cat)

  const hasValidImage = (url?: string | null) =>
    !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

  const readTime = readingTime(slide.content)

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      <section
        className="hero-slideshow"
        style={{
          position: 'relative',
          height: 'clamp(380px, 60vh, 760px)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--primary)',
        }}
        aria-label="Featured news slideshow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slide images */}
        {slides.map((s, i) => (
          <div
            key={s.article_id}
            aria-hidden={i !== current}
            style={{
              position: 'absolute',
              inset: 0,
              display: i === current ? 'block' : 'none',
            }}
          >
            {hasValidImage(s.featured_image) && !imgErrors.has(s.article_id) ? (
              <Image
                src={s.featured_image!}
                alt={s.title}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
                unoptimized
                onError={() => setImgErrors(prev => new Set([...prev, s.article_id]))}
              />
            ) : (
              <div className="absolute inset-0" style={{ background: 'var(--primary)' }} />
            )}
          </div>
        ))}

        {/* Content (bottom-left) */}
        <div
          key={current}
          className="hero-content"
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            maxWidth: 820,
            padding: '60px 32px 80px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          }}
        >
          {/* Category */}
          <span
            className="hero-cat"
            style={{
              display: 'inline-block',
              background: isKenyan(slide.category?.name) ? 'var(--error)' : 'var(--accent)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}
          >
            {isKenyan(slide.category?.name) ? '🇰🇪 ' : '🔴 '}
            {slide.category?.name ?? 'Breaking'}
          </span>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: 16,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {slide.title}
          </h1>

          {/* Excerpt */}
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', marginBottom: 20, maxWidth: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {stripHtml(slide.content).replace(/\n+/g, ' ').slice(0, 200).trim()}…
          </p>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            {slide.author?.profile_image ? (
              <Image src={slide.author.profile_image} alt={slide.author.name} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
            ) : (
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                {slide.author?.name?.charAt(0) ?? 'S'}
              </span>
            )}
            <span>{slide.author?.name ?? 'Staff Writer'}</span>
            <span>·</span>
            <span>{formatDate(slide.created_at)}</span>
            <span>·</span>
            <span>{readTime} min read</span>
            <span>·</span>
            <span>{formatNumber(slide.views)} views</span>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href={`/article/${slide.slug}`}
              className="hero-btn"
              style={{ background: 'var(--accent)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s, transform 0.2s' }}
            >
              Read Story →
            </Link>
            <Link
              href="/radio"
              className="hero-btn-secondary"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
            >
              <Radio size={16} className="inline mr-1.5" />Listen
            </Link>
          </div>
        </div>

        {/* Arrows */}
        {slides.length > 1 && (
          <div className="hero-nav">
            <button onClick={prev} aria-label="Previous slide" className="hero-nav-btn" style={{ left: 24 }}>
              ‹
            </button>
            <button onClick={next} aria-label="Next slide" className="hero-nav-btn" style={{ right: 24 }}>
              ›
            </button>
          </div>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`hero-dot ${i === current ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        <style>{`
          .hero-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            color: #fff;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            z-index: 10;
          }
          .hero-nav-btn:hover { background: rgba(255,255,255,0.22); }
          .hero-dots {
            position: absolute;
            bottom: 24px;
            left: 48px;
            display: flex;
            gap: 8px;
            z-index: 10;
          }
          .hero-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.3s;
          }
          .hero-dot.active { background: var(--accent); width: 28px; border-radius: 4px; }
          @media (max-width: 640px) {
            .hero-dots { left: 20px; bottom: 16px; }
            .hero-dot { width: 10px; height: 10px; }
            .hero-dot.active { width: 22px; }
            .hero-nav-btn { width: 40px; height: 40px; font-size: 1.3rem; }
            .hero-nav-btn:first-of-type { left: 12px; }
            .hero-nav-btn:last-of-type { right: 12px; }
          }
        `}</style>
      </section>
    </div>
  )
}
