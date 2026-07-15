'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, stripHtml } from '@/lib/utils'
import { Heart, MessageCircle } from 'lucide-react'
import { useLike } from '@/lib/hooks/useLike'
import Link from 'next/link'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props {
  initialArticles: ArticleWithAuthor[]
  categoryFilter?: string
}

const PAGE = 12

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'var(--kenya-red)',
  Business: 'var(--accent)',
  Tech: 'var(--primary)',
  Sports: 'var(--success)',
  Science: 'var(--warning)',
  Health: 'var(--success)',
  Kenya: 'var(--kenya-green)',
  Africa: 'var(--accent)',
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NewsFeed({ initialArticles, categoryFilter }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set())

  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const loadedRef = useRef(initialArticles.length)
  const loadMoreRef = useRef<() => void>(() => {})
  const lastInteractionRef = useRef(0)

  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])
  useEffect(() => { loadedRef.current = initialArticles.length }, [initialArticles])

  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  // Realtime: live inserts / updates
  useEffect(() => {
    const supabase = createClient()

    async function fetchArticleWithRetry(articleId: number, attempts = 3, delay = 250) {
      let lastData: ArticleWithAuthor | null = null
      for (let i = 0; i < attempts; i++) {
        const { data, error } = await supabase
          .from('articles')
          .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
          .eq('article_id', articleId)
          .single()
        if (!error && data) {
          lastData = data as unknown as ArticleWithAuthor
          if (lastData.content && lastData.author) return lastData
        }
        await new Promise(r => setTimeout(r, delay))
      }
      return lastData
    }

    const channel = supabase
      .channel('live-news-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, async (payload) => {
        if (payload.new.status !== 'published') return
        const art = await fetchArticleWithRetry(payload.new.article_id)
        if (!art) return
        if (categoryFilter && art.category?.name !== categoryFilter) return
        setArticles(prev => {
          if (prev.some(a => a.article_id === art.article_id)) return prev
          return [art, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'articles' }, async (payload) => {
        if (payload.new.status !== 'published') {
          setArticles(prev => prev.filter(a => a.article_id !== payload.new.article_id))
          return
        }
        const art = await fetchArticleWithRetry(payload.new.article_id)
        if (!art) return
        setArticles(prev => {
          if (!prev.some(a => a.article_id === art.article_id)) return [art, ...prev]
          return prev.map(a => (a.article_id === art.article_id ? art : a))
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'articles' }, (payload) => {
        setArticles(prev => prev.filter(a => a.article_id !== payload.old.article_id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [categoryFilter])

  // Infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const from = loadedRef.current
      const { data } = await supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
        .eq('status', 'published' as never)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)
      const rows = (data ?? []) as ArticleWithAuthor[]
      loadedRef.current = from + rows.length
      if (rows.length < PAGE) setHasMore(false)
      if (rows.length) {
        setArticles(prev => {
          const ids = new Set(prev.map(a => a.article_id))
          const fresh = rows.filter(r => !ids.has(r.article_id))
          return fresh.length ? [...prev, ...fresh] : prev
        })
      }
    } catch { /* no-op */ } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [])

  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  // Auto-scroll (same pattern as HomeFeed)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const PX_PER_SEC = 48
    const RESUME_DELAY = 3500
    const END_PAUSE = 1400
    let raf = 0
    let last = performance.now()
    let endPauseUntil = 0

    const tick = (now: number) => {
      const dt = Math.min(now - last, 80)
      last = now
      const idle = now - lastInteractionRef.current > RESUME_DELAY
      if (el && !pausedRef.current && idle && el.scrollHeight > el.clientHeight + 4) {
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
        if (distanceFromBottom <= 80) {
          if (hasMoreRef.current && !loadingMoreRef.current) {
            loadMoreRef.current()
          } else if (!hasMoreRef.current) {
            if (endPauseUntil === 0) {
              endPauseUntil = now + END_PAUSE
            } else if (now >= endPauseUntil) {
              el.scrollTop = 0
              endPauseUntil = 0
            }
          }
        } else {
          el.scrollTop += (dt / 1000) * PX_PER_SEC
          endPauseUntil = 0
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Track manual interaction
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const mark = () => { lastInteractionRef.current = performance.now() }
    const opts = { passive: true } as AddEventListenerOptions
    el.addEventListener('wheel', mark, opts)
    el.addEventListener('touchstart', mark, opts)
    el.addEventListener('touchmove', mark, opts)
    el.addEventListener('pointerdown', mark)
    el.addEventListener('keydown', mark)
    return () => {
      el.removeEventListener('wheel', mark)
      el.removeEventListener('touchstart', mark)
      el.removeEventListener('touchmove', mark)
      el.removeEventListener('pointerdown', mark)
      el.removeEventListener('keydown', mark)
    }
  }, [])

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLike = async (articleId: number) => {
    setLikedArticles(prev => {
      const next = new Set(prev)
      if (next.has(articleId)) next.delete(articleId)
      else next.add(articleId)
      return next
    })
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })
    } catch {}
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No articles published yet.</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="home-feed-scroll"
      onMouseEnter={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) pausedRef.current = true }}
      onMouseLeave={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) pausedRef.current = false }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {articles.map(article => (
          <Link
            key={article.article_id}
            href={`/article/${article.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article
              style={{
                display: 'flex',
                gap: 20,
                padding: 20,
                borderRadius: 16,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'var(--card-shadow)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div
                className="news-feed-card-image"
                style={{
                  width: 180,
                  minWidth: 180,
                  height: 120,
                  borderRadius: 12,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <img
                  src={article.featured_image || `https://picsum.photos/id/${article.article_id}/400/250`}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: CATEGORY_COLORS[article.category?.name ?? ''] || 'var(--primary-light)',
                    color: '#fff',
                    marginBottom: 8,
                  }}
                >
                  {article.category?.name ?? 'General'}
                </span>

                <h2
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    fontFamily: "'Newsreader', Georgia, serif",
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                    marginBottom: 6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.title}
                </h2>

                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {stripHtml(article.content ?? '').slice(0, 140) + '...'}
                </p>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img
                      src={article.author?.profile_image || `https://i.pravatar.cc/40?u=${article.author?.name}`}
                      alt={article.author?.name ?? 'Author'}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{article.author?.name ?? 'Staff'}</span>
                  </div>
                  <span>·</span>
                  <span>{timeAgo(article.created_at)}</span>
                  <span>·</span>
                  <span>{formatNumber(article.views)} views</span>
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleLike(article.article_id) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      color: likedArticles.has(article.article_id) ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem', fontWeight: 500,
                    }}
                    title="Like"
                  >
                    <Heart size={14} fill={likedArticles.has(article.article_id) ? 'currentColor' : 'none'} />
                    {formatNumber((article.likes ?? article.like_count ?? 0) + (likedArticles.has(article.article_id) ? 1 : 0))}
                  </button>
                  <Link
                    href={`/article/${article.slug}#comments`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500,
                      textDecoration: 'none', padding: 6,
                    }}
                    title="Comments"
                  >
                    <MessageCircle size={14} />
                  </Link>
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); toggleBookmark(article.article_id) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: 10,
                      minWidth: 44,
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: bookmarked.has(article.article_id) ? 'var(--accent)' : 'var(--text-muted)',
                      transition: 'color 0.2s',
                    }}
                    title="Bookmark"
                  >
                    {bookmarked.has(article.article_id) ? '★' : '☆'}
                  </button>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {loadingMore && <p className="home-feed-status">Loading more stories…</p>}
      {!hasMore && articles.length > 0 && <p className="home-feed-status">You&rsquo;re all caught up</p>}

      <style>{`
        @media (max-width: 640px) {
          .news-feed-card-image {
            width: 120px !important;
            min-width: 120px !important;
            height: 90px !important;
          }
        }
        @media (max-width: 400px) {
          .news-feed-card-image {
            width: 100px !important;
            min-width: 100px !important;
            height: 80px !important;
          }
        }
      `}</style>
    </div>
  )
}
