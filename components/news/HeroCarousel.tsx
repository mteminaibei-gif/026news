'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Tv } from 'lucide-react'
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
    cat && ['Kenya Focus', 'Politics & Governance', 'Business & Economy', 'World Updates'].includes(cat)

  const hasValidImage = (url?: string | null) =>
    !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

  const readTime = readingTime(slide.content)

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
      <section
        className="hero-slideshow"
        style={{
          position: 'relative',
          height: 'clamp(560px, 85vh, 1000px)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--primary)',
        }}
        aria-label="Featured news slideshow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slide images with crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.article_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {hasValidImage(slide.featured_image) && !imgErrors.has(slide.article_id) ? (
              <Image
                src={slide.featured_image!}
                alt={slide.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
                unoptimized
                onError={() => setImgErrors(prev => new Set([...prev, slide.article_id]))}
              />
            ) : (
              <div className="absolute inset-0" style={{ background: 'var(--primary)' }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Content (bottom-left) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.article_id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hero-content"
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              padding: '80px 40px 96px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)',
            }}
          >
            {/* Category */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
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
            </motion.span>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.15,
                marginBottom: 16,
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {slide.title}
            </motion.h1>

            {/* Excerpt */}
            {stripHtml(slide.content).length > 10 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                style={{ 
                  color: 'rgba(255,255,255,0.85)', 
                  fontSize: '1.05rem', 
                  marginBottom: 20, 
                  maxWidth: 700,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                  paddingRight: 10
                }}
              >
                {stripHtml(slide.content).split('\n').map((paragraph, idx) => (
                  <p key={idx} style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>{paragraph}</p>
                ))}
              </motion.div>
            )}

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', flexWrap: 'wrap' }}
            >
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
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <Link
                href={`/article/${slide.slug}`}
                className="hero-btn"
                style={{ background: 'var(--accent)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s, transform 0.2s' }}
              >
                Read Story →
              </Link>
              <Link
                href="/tv"
                className="hero-btn-secondary"
                style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Tv size={16} className="inline mr-1.5" />Watch
              </Link>
              <Link
                href="/radio"
                className="hero-btn-secondary"
                style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Radio size={16} className="inline mr-1.5" />Listen
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

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
