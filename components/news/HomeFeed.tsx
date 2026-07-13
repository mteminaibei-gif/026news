'use client'

import { useState, useEffect, useRef } from 'react'
import { HomeArticleCard } from './HomeArticleCard'
import { createClient } from '@/lib/supabase/client'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props {
  initialArticles: ArticleWithAuthor[]
  categoryFilterName?: string | null
}

export function HomeFeed({ initialArticles, categoryFilterName }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

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

  // Auto-scroll the feed (loops to top), paused on hover
  useEffect(() => {
    let raf = 0
    const SPEED = 0.25
    const step = () => {
      const el = scrollRef.current
      if (el && !pausedRef.current && el.scrollHeight > el.clientHeight + 4) {
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
        el.scrollTop = atBottom ? 0 : el.scrollTop + SPEED
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
    </div>
  )
}
