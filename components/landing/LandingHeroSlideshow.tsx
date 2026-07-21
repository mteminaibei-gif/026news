'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Slide {
  title: string
  slug: string
  image: string | null
  category: string
  author: string
}

export function LandingHeroSlideshow({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (idx === current || fading) return
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setFading(false)
    }, 600)
  }, [current, fading])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % slides.length)
        setFading(false)
      }, 600)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides.length) return null

  const slide = slides[current]

  return (
    <div className="landing-slideshow" aria-hidden="true">
      {slides.map((s, i) => (
        <div
          key={s.slug}
          className={`landing-slideshow-slide ${i === current ? 'active' : ''} ${i === current && fading ? 'fading' : ''}`}
        >
          {s.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="landing-slideshow-img" />
          ) : (
            <div className="landing-slideshow-fallback" />
          )}
        </div>
      ))}
      <div className="landing-slideshow-overlay" />
      <div className="landing-slideshow-gradient" />

      {/* Dots */}
      {slides.length > 1 && (
        <div className="landing-slideshow-dots">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              className={`landing-slideshow-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide info bar */}
      <Link href={`/article/${slide.slug}`} className="landing-slideshow-info">
        <span className="landing-slideshow-cat">{slide.category}</span>
        <span className="landing-slideshow-title">{slide.title}</span>
        <span className="landing-slideshow-author">by {slide.author}</span>
      </Link>
    </div>
  )
}
