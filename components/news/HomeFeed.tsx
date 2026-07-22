'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { HomeArticleCard } from './HomeArticleCard'
import { createClient } from '@/lib/supabase/client'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props {
  initialArticles: ArticleWithAuthor[]
  categoryFilterName?: string | null
}

const PAGE = 12

// In-house (non-aggregated) posts surface before aggregated/RSS content,
// pinned articles first, then by manual priority, then newest-first.
function sortInhouseFirst(list: ArticleWithAuthor[]): ArticleWithAuthor[] {
  return [...list].sort((a, b) => {
    const aAny = a as unknown as Record<string, unknown>
    const bAny = b as unknown as Record<string, unknown>
    const ap = aAny.pinned ? 1 : 0
    const bp = bAny.pinned ? 1 : 0
    if (ap !== bp) return bp - ap
    const priA = (aAny.priority as number) ?? 0
    const priB = (bAny.priority as number) ?? 0
    if (priA !== priB) return priB - priA
    const ai = aAny.is_aggregated === true ? 1 : 0
    const bi = bAny.is_aggregated === true ? 1 : 0
    if (ai !== bi) return ai - bi
    return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
  })
}

export function HomeFeed({ initialArticles, categoryFilterName }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

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
    // Sync initial articles (server-sorted in-house-first) into state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArticles(initialArticles)
  }, [initialArticles])

  // Realtime: live inserts / updates from the database
  useEffect(() => {
    const supabase = createClient()

    async function fetchArticleFromApi(articleId: number) {
      try {
        const res = await fetch(`/api/articles/single?id=${articleId}`)
        if (!res.ok) return null
        return (await res.json()) as unknown as ArticleWithAuthor
      } catch { return null }
    }

    const channel = supabase
      .channel('live-home-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') return
          const newArt = await fetchArticleFromApi(payload.new.article_id)
          if (!newArt) return
          const art = newArt as unknown as ArticleWithAuthor
          if (categoryFilterName && art.category?.name !== categoryFilterName) return
          setArticles((prev) => {
            if (prev.some((a) => a.article_id === art.article_id)) return prev
            return sortInhouseFirst([art, ...prev])
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') {
            setArticles((prev) => prev.filter((a) => a.article_id !== payload.new.article_id))
            return
          }
          const updatedArt = await fetchArticleFromApi(payload.new.article_id)
          if (!updatedArt) return
          const art = updatedArt as unknown as ArticleWithAuthor
          if (categoryFilterName && art.category?.name !== categoryFilterName) {
            setArticles((prev) => prev.filter((a) => a.article_id !== art.article_id))
            return
          }
          setArticles((prev) => {
            if (!prev.some((a) => a.article_id === art.article_id)) return sortInhouseFirst([art, ...prev])
            return sortInhouseFirst(prev.map((a) => (a.article_id === art.article_id ? art : a)))
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'articles' },
        (payload) => {
          setArticles((prev) => prev.filter((a) => a.article_id !== payload.old.article_id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [categoryFilterName])

  // Infinite scroll: load the next page of published articles
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const from = loadedRef.current
      const params = new URLSearchParams({ offset: String(from), limit: String(PAGE) })
      if (categoryFilterName) params.set('category', categoryFilterName)
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      let rows = (data.articles ?? []) as ArticleWithAuthor[]
      loadedRef.current = from + rows.length
      if (rows.length < PAGE) setHasMore(false)
      if (rows.length) {
        setArticles((prev) => {
          const ids = new Set(prev.map((a) => a.article_id))
          const fresh = rows.filter((r) => !ids.has(r.article_id))
          return fresh.length ? sortInhouseFirst([...prev, ...fresh]) : prev
        })
      }
    } catch {
      /* no-op */
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [categoryFilterName])

  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  // Auto-scroll the feed (loops to top after a brief pause at the end).
  // Paused on hover (fine pointers) and on any user interaction (touch / wheel /
  // keyboard); resumes automatically after a short idle period. Frame-rate
  // independent so it scrolls at a consistent speed on any device.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

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

  // Track manual interaction so auto-scroll pauses while the user scrolls.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const mark = () => {
      lastInteractionRef.current = performance.now()
    }
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

  // Realtime subscription handles live updates — no polling needed

  if (articles.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No articles published in this category yet.
        </p>
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
      <div className="article-feed">
        {articles.map((article, index) => (
          <HomeArticleCard key={`${article.article_id}-${index}`} article={article} />
        ))}
      </div>

      {loadingMore && <p className="home-feed-status">Loading more stories…</p>}
      {!hasMore && articles.length > 0 && <p className="home-feed-status">You&rsquo;re all caught up</p>}
    </div>
  )
}
