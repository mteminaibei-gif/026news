'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, formatNumber } from '@/lib/utils'

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

interface Props {
  articles: SlideArticle[]
}

export function HeroCarousel({ articles }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)

  const slides = articles.slice(0, 7)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  // Auto-advance every 5 s unless hovered
  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next, slides.length])

  if (!slides.length) return null
  const slide = slides[current]

  return (
    <section
      className="relative bg-[#0a1628] overflow-hidden select-none"
      aria-label="Featured news slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide images (preloaded) */}
      {slides.map((s, i) => (
        <div
          key={s.article_id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {s.featured_image && (
            <Image
              src={s.featured_image}
              alt={s.title}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          )}
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/60 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center min-h-[420px]">
        <div
          key={current}
          className="animate-fade-in-up"
          style={{ animation: 'fadeInUp 0.5s ease both' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              🔴 {slide.category?.name ?? 'Breaking'}
            </span>
            <span className="text-white/40 text-xs">{formatDate(slide.created_at)}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4 line-clamp-3">
            {slide.title}
          </h1>

          <p className="text-white/60 text-sm md:text-base mb-5 leading-relaxed line-clamp-2">
            {slide.content.substring(0, 150)}...
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 mb-6">
            {slide.author && <span>✍️ {slide.author.name}</span>}
            <span>👁 {formatNumber(slide.views)} views</span>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/article/${slide.slug}`}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Read Full Story →
            </Link>
            <Link
              href="/"
              className="border border-white/25 text-white hover:bg-white/10 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              More Stories
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
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
                i === current ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/40 hover:bg-white/70'
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
                i === current ? 'ring-2 ring-orange-500 opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
            >
              {s.featured_image && (
                <Image src={s.featured_image} alt={s.title} fill className="object-cover" />
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
