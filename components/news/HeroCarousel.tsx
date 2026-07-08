'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, formatNumber, cn } from '@/lib/utils'

interface SlideArticle {
  article_id: number
  title: string
  slug: string
  content: string
  featured_image: string | null
  views: number
  created_at: string
  author: { name: string } | null
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

  return (
    <section
      className="relative bg-[#1a5c2a] overflow-hidden select-none"
      aria-label="Featured news slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Kenya flag top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 h-1.5 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a]" />

      {/* Slide images */}
      {slides.map((s, i) => (
        <div
          key={s.article_id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
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
            /* Fallback — branded gradient when no image */
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c2a] via-[#2d8a47] to-[#0f3a1a]" />
          )}
          {/* Dark gradient overlay — left-heavy for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a12]/92 via-[#1a5c2a]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a12]/60 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-24 grid md:grid-cols-2 gap-8 items-center min-h-[420px] md:min-h-[520px]">
        <div
          key={current}
          style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Category + date */}
          <div className="flex items-center gap-2 mb-4 flex-wrap animate-fade-in delay-100">
            <span className={cn(
              'text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full',
              'animate-pulse-glow',
              isKenyan(slide.category?.name)
                ? 'bg-[#c8102e]'
                : 'bg-[#4caf28]'
            )}>
              {isKenyan(slide.category?.name) ? '🇰🇪 ' : '🔴 '}
              {slide.category?.name ?? 'Breaking'}
            </span>
            <span className="text-white/50 text-xs">{formatDate(slide.created_at)}</span>
          </div>

          {/* Title */}
          <h1
            className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4 line-clamp-3 drop-shadow-xl"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 80ms both' }}
          >
            {slide.title}
          </h1>

          {/* Excerpt */}
          <p
            className="text-white/70 text-sm md:text-base mb-5 leading-relaxed line-clamp-2 max-w-xl"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 160ms both' }}
          >
            {slide.content.substring(0, 160)}...
          </p>

          {/* Meta */}
          <div
            className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-6"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 220ms both' }}
          >
            {slide.author && <span>✍️ {slide.author.name}</span>}
            <span>👁 {formatNumber(slide.views)} views</span>
          </div>

          {/* CTAs */}
          <div
            className="flex gap-3 flex-wrap"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 280ms both' }}
          >
            <Link
              href={`/article/${slide.slug}`}
              className="bg-[#f5c518] hover:bg-[#d4a010] text-[#1a1a1a] font-bold px-6 py-3 rounded-2xl transition-all duration-300 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Read Full Story →
            </Link>
            <Link
              href="/?category=Kenya"
              className="border-2 border-white/25 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-5 py-3 rounded-2xl transition-all duration-300 text-sm"
            >
              <span className="animate-wave inline-block mr-1">🇰🇪</span> Kenya News
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1a5c2a]/70 hover:bg-[#1a5c2a] border border-[#4caf28]/40 text-white flex items-center justify-center transition-all backdrop-blur-sm text-xl font-bold"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1a5c2a]/70 hover:bg-[#1a5c2a] border border-[#4caf28]/40 text-white flex items-center justify-center transition-all backdrop-blur-sm text-xl font-bold"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[#f5c518]' : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 right-0 hidden lg:flex gap-1 p-3">
          {slides.map((s, i) => (
            <button
              key={s.article_id}
              onClick={() => setCurrent(i)}
              aria-label={`Jump to: ${s.title}`}
              className={`relative w-16 h-10 rounded overflow-hidden shrink-0 transition-all duration-200 ${
                i === current
                  ? 'ring-2 ring-[#f5c518] opacity-100'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              {hasValidImage(s.featured_image) && !imgErrors.has(s.article_id) ? (
                <Image src={s.featured_image!} alt={s.title} fill sizes="64px" className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-[#2d8a47] flex items-center justify-center text-white text-[8px] font-bold">026</div>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
