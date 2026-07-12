'use client'

import { useState, useEffect } from 'react'
import { ArticleCard } from './ArticleCard'
import { createClient } from '@/lib/supabase/client'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props {
  initialArticles: ArticleWithAuthor[]
  categoryFilterName?: string | null
}

export function ArticlesList({ initialArticles, categoryFilterName }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles)

  // Lightweight in-memory realtime log for debugging (inspect via devtools)
  if (typeof window !== 'undefined') {
    ;(window as any).__realtimeLogs = (window as any).__realtimeLogs || []
  }

  // Sync state if initialArticles changes (e.g., category selection change)
  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  useEffect(() => {
    const supabase = createClient()

    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    async function fetchArticleWithRetry(articleId: number, attempts = 3, delay = 250) {
      let lastData: any = null
      for (let i = 0; i < attempts; i++) {
        const res: any = await supabase
          .from('articles')
          .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
          .eq('article_id', articleId)
          .single()

        const data = res?.data
        const error = res?.error

        if (!error && data) {
          lastData = data
          // Consider data valid if it has content and author (joined fields)
          if ((data as any).content && (data as any).author) return lastData
        }

        // small delay before retrying
        await sleep(delay)
      }
      return lastData
    }

    const channel = supabase
      .channel('live-articles-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') return

          const t0 = Date.now()
          ;(console as any).debug?.('[realtime] INSERT payload received', payload.new)

          // Try fetching the full joined row with retries to avoid partial reads
          const newArt = await fetchArticleWithRetry(payload.new.article_id)

          const t1 = Date.now()
          ;(console as any).debug?.(`[realtime] fetched article ${payload.new.article_id} in ${t1 - t0}ms`, newArt)

          // store a short log for inspection in the browser
          if (typeof window !== 'undefined') {
            ;(window as any).__realtimeLogs.push({ event: 'INSERT', id: payload.new.article_id, ts: new Date().toISOString(), fetched: !!newArt })
          }

          if (newArt) {
            const art = newArt as unknown as ArticleWithAuthor
            // Apply category filter if active
            if (categoryFilterName && art.category?.name !== categoryFilterName) {
              return
            }

            setArticles(prev => {
              if (prev.some(a => a.article_id === art.article_id)) return prev
              return [art, ...prev]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') {
            // If article was unpublished, remove it
            setArticles(prev => prev.filter(a => a.article_id !== payload.new.article_id))
            return
          }

          const t0 = Date.now()
          ;(console as any).debug?.('[realtime] UPDATE payload received', payload.new)

          const updatedArt = await fetchArticleWithRetry(payload.new.article_id)

          const t1 = Date.now()
          ;(console as any).debug?.(`[realtime] fetched updated article ${payload.new.article_id} in ${t1 - t0}ms`, updatedArt)

          if (typeof window !== 'undefined') {
            ;(window as any).__realtimeLogs.push({ event: 'UPDATE', id: payload.new.article_id, ts: new Date().toISOString(), fetched: !!updatedArt })
          }

          if (updatedArt) {
            const art = updatedArt as unknown as ArticleWithAuthor
            // Check if it belongs in current category filter
            if (categoryFilterName && art.category?.name !== categoryFilterName) {
              setArticles(prev => prev.filter(a => a.article_id !== art.article_id))
              return
            }

            setArticles(prev => {
              // If it wasn't in the list yet, prepend it; otherwise, update it in-place
              if (!prev.some(a => a.article_id === art.article_id)) {
                return [art, ...prev]
              }
              return prev.map(a => a.article_id === art.article_id ? art : a)
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'articles' },
        (payload) => {
          setArticles(prev => prev.filter(a => a.article_id !== payload.old.article_id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [categoryFilterName])

  if (articles.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No articles published in this category yet.</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-5 mb-10">
      {articles.map(article => (
        <ArticleCard key={article.article_id} article={article as never} />
      ))}
    </div>
  )
}
