'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Eye, User } from 'lucide-react'

interface HeroArticle {
  article_id: string
  title: string
  slug: string
  content: string
  views: number
  author_name?: string
  image_url?: string
  published_at?: string
}

export default function HeroSlideshow() {
  const [articles, setArticles] = useState<HeroArticle[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    const fetchHeroArticles = async () => {
      try {
        const res = await fetch('/api/articles?limit=8&sort=trending')
        const data = await res.json()
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles.slice(0, 8))
        }
      } catch (error) {
        console.error('Failed to fetch hero articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHeroArticles()
  }, [])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!autoPlay || articles.length === 0) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay, articles.length])

  if (loading || articles.length === 0) {
    return (
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading featured articles...</p>
      </div>
    )
  }

  const currentArticle = articles[currentIndex]
  const excerpt = currentArticle.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
    setAutoPlay(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
    setAutoPlay(false)
  }

  return (
    <div className="relative group">
      {/* Main Slideshow Container */}
      <div className="relative h-96 bg-linear-to-r from-[#0a1628] to-[#1a3a6e] dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden">
        {/* Slide Content */}
        <Link
          href={`/article/${currentArticle.slug}`}
          className="block h-full relative overflow-hidden group/slide"
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/50 group-hover/slide:bg-black/30 transition-all duration-300"></div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-8 text-white">
            <h2 className="text-4xl font-bold mb-3 line-clamp-2 group-hover/slide:text-orange-400 transition-colors duration-300">
              {currentArticle.title}
            </h2>
            <p className="text-gray-200 line-clamp-2 mb-4">{excerpt}</p>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {currentArticle.author_name && (
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>{currentArticle.author_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>{currentArticle.views.toLocaleString()} views</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
                Read More →
              </button>
            </div>
          </div>
        </Link>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-orange-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-orange-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {articles.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx)
              setAutoPlay(false)
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'bg-orange-500 w-8'
                : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
        {articles.map((article, idx) => (
          <button
            key={article.article_id}
            onClick={() => {
              setCurrentIndex(idx)
              setAutoPlay(false)
            }}
            className={`shrink-0 h-20 w-28 rounded-lg overflow-hidden transition-all duration-300 ${
              idx === currentIndex ? 'ring-2 ring-orange-500' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div className="h-full w-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs text-center p-1">
              <span className="line-clamp-2">{article.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
