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

  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])
  useEffect(() => { loadedRef.current = initialArticles.length }, [initialArticles])

  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  // Realtime: live inserts / updates from the database
  useEffect(() => {
    const supabase = createClient()

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    async function fetchArticleWithRetry(articleId: number, attempts = 3, delay = 250) {
      let lastData: any = null
      for (let i = 0; i < attempts; i++) {
        const res: any = await supabase
          .from('articles')
          .select('*, author:users(user_id,name,profile_image,bio), category:categories(name), journalist:journalists(user_id,name,avatar_url,bio)')
          .eq('article_id', articleId)
          .single()

        const data = res?.data
        const error = res?.error

        if (!error && data) {
          lastData = data
          if ((data as any).content && (data as any).author) return lastData
        }
        await sleep(delay)
      }
      return lastData
    }

    const channel = supabase
      .channel('live-home-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') return
          const newArt = await fetchArticleWithRetry(payload.new.article_id)
          if (!newArt) return
          const art = newArt as unknown as ArticleWithAuthor
          if (categoryFilterName && art.category?.name !== categoryFilterName) return
          setArticles((prev) => {
            if (prev.some((a) => a.article_id === art.article_id)) return prev
            return [art, ...prev]
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
          const updatedArt = await fetchArticleWithRetry(payload.new.article_id)
          if (!updatedArt) return
          const art = updatedArt as unknown as ArticleWithAuthor
          if (categoryFilterName && art.category?.name !== categoryFilterName) {
            setArticles((prev) => prev.filter((a) => a.article_id !== art.article_id))
            return
          }
          setArticles((prev) => {
            if (!prev.some((a) => a.article_id === art.article_id)) return [art, ...prev]
            return prev.map((a) => (a.article_id === art.article_id ? art : a))
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
      const supabase = createClient()
      const from = loadedRef.current
      let query = supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
        .eq('status', 'published' as never)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)
      if (categoryFilterName) {
        query = query.eq('category', categoryFilterName as never)
      }
      const { data } = await query
      const rows = (data ?? []) as ArticleWithAuthor[]
      loadedRef.current = from + rows.length
      if (rows.length < PAGE) setHasMore(false)
      if (rows.length) {
        setArticles((prev) => {
          const ids = new Set(prev.map((a) => a.article_id))
          const fresh = rows.filter((r) => !ids.has(r.article_id))
          return fresh.length ? [...prev, ...fresh] : prev
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

  // Auto-scroll the feed (loops to top), paused on hover; loads more near bottom
  useEffect(() => {
    let raf = 0
    const SPEED = 0.4
    const step = () => {
      const el = scrollRef.current
      if (el && !pausedRef.current && el.scrollHeight > el.clientHeight + 4) {
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
        if (distanceFromBottom <= 80) {
          if (hasMoreRef.current && !loadingMoreRef.current) {
            loadMoreRef.current()
          } else if (!hasMoreRef.current) {
            el.scrollTop = 0
          }
        } else {
          el.scrollTop += SPEED
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Auto-refresh: pull the newest published posts and prioritise them
  useEffect(() => {
    const id = setInterval(async () => {
      const supabase = createClient()
      let query = supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
        .eq('status', 'published' as never)
        .order('created_at', { ascending: false })
        .limit(12)
      if (categoryFilterName) {
        query = query.eq('category', categoryFilterName as never)
      }
      const { data } = await query
      if (data && data.length) {
        setArticles((prev) => {
          const ids = new Set(prev.map((a) => a.article_id))
          const fresh = (data as ArticleWithAuthor[]).filter((a) => !ids.has(a.article_id))
          return fresh.length ? [...fresh, ...prev] : prev
        })
      }
    }, 45000)
    return () => clearInterval(id)
  }, [categoryFilterName])

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
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="article-feed">
        {articles.map((article) => (
          <HomeArticleCard key={article.article_id} article={article} />
        ))}
      </div>

      {loadingMore && <p className="home-feed-status">Loading more stories…</p>}
      {!hasMore && articles.length > 0 && <p className="home-feed-status">You&rsquo;re all caught up</p>}
    </div>
  )
}
