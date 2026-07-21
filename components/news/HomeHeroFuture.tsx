'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, PenLine, Users, Radio, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber, readingTime, formatDate } from '@/lib/utils'
import { BreakingNewsTicker } from './BreakingNewsTicker'

interface Stat { label: string; value: string }

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

interface Headline {
  article_id: number
  title: string
  slug: string
  created_at: string
  category: { name: string } | null
}

export function HomeHeroFuture({
  storyCount,
  journalistCount,
  liveCount,
  articles = [],
  headlines = [],
}: {
  storyCount: number
  journalistCount: number
  liveCount: number
  articles?: SlideArticle[]
  headlines?: Headline[]
}) {
  const stats: Stat[] = [
    { label: 'Stories', value: formatNumber(storyCount) },
    { label: 'Journalists', value: formatNumber(journalistCount) },
    { label: 'Live now', value: formatNumber(liveCount) },
  ]

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  const slides = articles.slice(0, 7)

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [paused, next, slides.length])

  const hasValidImage = (url?: string | null) =>
    !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

  const isKenyan = (cat?: string | null) =>
    cat && ['Kenya Focus', 'Politics & Governance', 'Business & Economy', 'World Updates'].includes(cat)

  const slide = slides.length > 0 ? slides[current] : null

  return (
    <section
      className="hero-bg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Background slideshow images ── */}
      <div className="hero-bg-slides" aria-hidden="true">
        {slides.map((s, i) => (
          <div
            key={s.article_id}
            className={`hero-bg-slide ${i === current ? 'active' : ''}`}
          >
            {hasValidImage(s.featured_image) && !imgErrors.has(s.article_id) ? (
              <Image
                src={s.featured_image!}
                alt=""
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
                unoptimized
                onError={() => setImgErrors(prev => new Set([...prev, s.article_id]))}
              />
            ) : (
              <div className="hero-bg-gradient" />
            )}
          </div>
        ))}
        {/* Fallback gradient if no slides */}
        {slides.length === 0 && <div className="hero-bg-gradient" />}
      </div>

      {/* ── Overlays ── */}
      <div className="hero-bg-overlay" />
      <div className="hero-bg-vignette" />

      {/* ── Content ── */}
      <div className="hero-bg-content">
        <div className="hero-bg-inner">
          {/* Left: brand copy + CTAs */}
          <div className="hero-bg-copy">
            <span className="pill hero-pill">
              <Sparkles size={13} /> The future of African journalism
            </span>
            <h1 className="hero-title">
              026<span className="text-gradient-hero">connect</span>
            </h1>
            <p className="hero-lede">
              A living newsroom where reporting meets conversation. Follow journalists,
              react in real time, and shape the stories that matter.
            </p>

            <div className="hero-ctas">
              <Link href="/social" className="hero-btn primary">
                <Users size={16} /> Enter the Feed
              </Link>
              <Link href="/news" className="hero-btn ghost">
                Explore News <ArrowRight size={16} />
              </Link>
              <Link href="/journalist/create" className="hero-btn ghost">
                <PenLine size={16} /> Write
              </Link>
            </div>

            <div className="hero-stats">
              {stats.map(s => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-val">{s.value}</span>
                  <span className="hero-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: featured article card (current slide) */}
          {slide && (
            <Link href={`/article/${slide.slug}`} className="hero-featured-card">
              <div className="hero-featured-img">
                {hasValidImage(slide.featured_image) && !imgErrors.has(slide.article_id) ? (
                  <Image
                    src={slide.featured_image!}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 820px) 100vw, 480px"
                    unoptimized
                  />
                ) : (
                  <div className="hero-bg-gradient" />
                )}
                <div className="hero-featured-gradient" />
              </div>
              <div className="hero-featured-body">
                <span
                  className="hero-featured-cat"
                  style={{ background: isKenyan(slide.category?.name) ? 'var(--error)' : 'var(--accent)' }}
                >
                  {slide.category?.name ?? 'Breaking'}
                </span>
                <h3 className="hero-featured-title">{slide.title}</h3>
                <div className="hero-featured-meta">
                  <span>{slide.author?.name ?? 'Staff Writer'}</span>
                  <span className="dot">·</span>
                  <span>{readingTime(slide.content)} min</span>
                </div>
              </div>

              {/* Slideshow nav */}
              {slides.length > 1 && (
                <>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev() }} className="hero-slide-nav prev" aria-label="Previous">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); next() }} className="hero-slide-nav next" aria-label="Next">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </Link>
          )}
        </div>

        {/* Dots under the hero content */}
        {slides.length > 1 && (
          <div className="hero-dots">
            {slides.map((s, i) => (
              <button
                key={s.article_id}
                onClick={() => setCurrent(i)}
                className={`hero-dot ${i === current ? 'active' : ''}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Breaking news ticker integrated at the bottom of the hero ── */}
      {headlines.length > 0 && (
        <div className="hero-ticker-wrap">
          <BreakingNewsTicker initialHeadlines={headlines} />
        </div>
      )}
    </section>
  )
}
