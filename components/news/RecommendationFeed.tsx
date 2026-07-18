'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'

interface RecommendedArticle {
  article_id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  views: number
  created_at: string
  score?: number
  author?: { name: string; profile_image: string | null } | null
  category?: { name: string } | null
}

export function RecommendationFeed() {
  const [articles, setArticles] = useState<RecommendedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const res = await fetch('/api/recommendations?limit=10')
        if (!res.ok) throw new Error('Failed to fetch')
        const { data } = await res.json()
        setArticles(data ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 320
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (loading || articles.length === 0 || error) return null

  return (
    <section style={{ marginTop: 48, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2
          className="feed-heading"
          style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          Recommended for You
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => scroll('left')}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'background 0.15s',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'background 0.15s',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: 8,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {articles.map((article) => (
          <Link
            key={article.article_id}
            href={`/article/${article.slug}`}
            style={{
              flex: '0 0 280px',
              scrollSnapAlign: 'start',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            className="rec-card"
          >
            <div style={{ position: 'relative', width: '100%', height: 160, background: 'var(--bg-inset)' }}>
              <Image
                src={article.featured_image || `https://picsum.photos/seed/${article.article_id}/400/240`}
                alt={article.title}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
                sizes="280px"
               loading="lazy"/>
              {article.category?.name && (
                <span style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '3px 10px', borderRadius: 6,
                  fontSize: '0.65rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'var(--bg-base)', color: 'var(--primary)',
                  backdropFilter: 'blur(8px)',
                }}>
                  {article.category.name}
                </span>
              )}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <h3 style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.35,
                margin: '0 0 8px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {article.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {article.author?.name ?? 'Staff'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={11} />
                  {formatNumber(article.views)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .rec-card:hover { transform: translateY(-2px); box-shadow: var(--card-shadow); }
      `}</style>
    </section>
  )
}
