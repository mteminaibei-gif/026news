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
  const [prev, setPrev] = useState<number | null>(null)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (idx === current || fading) return
    setPrev(current)
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setFading(false)
      setPrev(null)
    }, 600)
  }, [current, fading])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setPrev(current)
      setFading(true)
      setTimeout(() => {
        setCurrent(p => (p + 1) % slides.length)
        setFading(false)
        setPrev(null)
      }, 600)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length, current])

  if (!slides.length) return null

  const slide = slides[current]
  const prevSlide = prev !== null ? slides[prev] : null

  return (
    <div className="landing-slideshow" aria-hidden="true">
      {prevSlide?.image && (
        <div className="landing-slideshow-slide active fading">
          <img src={prevSlide.image} alt="" className="landing-slideshow-img" loading="eager" />
        </div>
      )}
      <div className={`landing-slideshow-slide active ${fading ? '' : ''}`}>
        {slide.image ? (
          <img src={slide.image} alt="" className="landing-slideshow-img" loading="eager" fetchPriority="high" />
        ) : (
          <div className="landing-slideshow-fallback" />
        )}
      </div>
      <div className="landing-slideshow-overlay" />
      <div className="landing-slideshow-gradient" />

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

      <Link href={`/article/${slide.slug}`} className="landing-slideshow-info">
        <span className="landing-slideshow-cat">{slide.category}</span>
        <span className="landing-slideshow-title">{slide.title}</span>
        <span className="landing-slideshow-author">by {slide.author}</span>
      </Link>
    </div>
  )
}
