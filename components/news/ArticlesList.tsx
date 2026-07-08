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

  // Sync state if initialArticles changes (e.g., category selection change)
  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('live-articles-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        async (payload) => {
          if (payload.new.status !== 'published') return

          // Fetch full joined data
          const { data: newArt, error } = await supabase
            .from('articles')
            .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
            .eq('article_id', payload.new.article_id)
            .single()

          if (!error && newArt) {
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

          // Fetch full joined data for updated article
          const { data: updatedArt, error } = await supabase
            .from('articles')
            .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
            .eq('article_id', payload.new.article_id)
            .single()

          if (!error && updatedArt) {
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
      <div className="bg-white dark:bg-gray-800/40 rounded-xl p-8 text-center border dark:border-gray-800/60 transition-colors">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No articles published in this category yet.</p>
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
