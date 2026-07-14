'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ArticleStats {
  views: number
  likes: number
  comments: number
}

/**
 * Subscribes to real-time updates for an article's views, likes, and comments.
 * Returns live counts that update instantly when other users interact.
 */
export function useArticleStats(articleId: number, initial: ArticleStats) {
  const [stats, setStats] = useState(initial)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to comments count changes
    const commentsChannel = supabase
      .channel(`article-comments:${articleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` },
        () => setStats(s => ({ ...s, comments: s.comments + 1 }))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` },
        () => setStats(s => ({ ...s, comments: Math.max(0, s.comments - 1) }))
      )
      .subscribe()

    // Subscribe to likes count changes
    const likesChannel = supabase
      .channel(`article-likes:${articleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'article_likes', filter: `article_id=eq.${articleId}` },
        () => setStats(s => ({ ...s, likes: s.likes + 1 }))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'article_likes', filter: `article_id=eq.${articleId}` },
        () => setStats(s => ({ ...s, likes: Math.max(0, s.likes - 1) }))
      )
      .subscribe()

    // Subscribe to views count changes (from articles table)
    const viewsChannel = supabase
      .channel(`article-views:${articleId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'articles', filter: `article_id=eq.${articleId}` },
        (payload) => {
          const newViews = (payload.new as { views?: number }).views
          if (newViews !== undefined) setStats(s => ({ ...s, views: newViews }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(likesChannel)
      supabase.removeChannel(viewsChannel)
    }
  }, [articleId])

  const updateViews = useCallback((v: number) => setStats(s => ({ ...s, views: v })), [])
  const updateLikes = useCallback((l: number) => setStats(s => ({ ...s, likes: l })), [])
  const updateComments = useCallback((c: number) => setStats(s => ({ ...s, comments: c })), [])

  return { ...stats, updateViews, updateLikes, updateComments }
}
