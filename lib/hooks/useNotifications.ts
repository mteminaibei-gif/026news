'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: 'article_approved' | 'article_rejected' | 'revision_requested' | 'new_comment' | 'new_submission'
  message: string
  articleId?: number
  timestamp: string
  read: boolean
}

// ─── Realtime notifications hook ──────────────────────────────────────────────
// Listens to review_workflow changes (for journalists) and new article
// submissions (for admins) over Supabase Realtime.
export function useNotifications(userId: number, role: 'admin' | 'journalist' | 'reader') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId || role === 'reader') return

    const supabase = createClient()
    const channels: ReturnType<typeof supabase.channel>[] = []

    if (role === 'journalist') {
      // Watch review_workflow for status changes on their articles
      const reviewChannel = supabase
        .channel(`notifications:journalist:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'review_workflow' },
          async (payload) => {
            const review = payload.new as {
              article_id: number
              action: string
              review_notes: string
            }

            // Check this review is for an article owned by this journalist
            const { data: rawArticle } = await supabase
              .from('articles')
              .select('title, author_id')
              .eq('article_id', review.article_id)
              .single()
            const article = rawArticle as unknown as { title: string; author_id: number } | null

            if (article?.author_id !== userId) return

            const actionLabels: Record<string, string> = {
              approved: '✅ Your article was approved and published!',
              rejected: '❌ Your article was rejected.',
              revision_requested: '🔄 Revision requested on your article.',
            }

            const notification: Notification = {
              id: `review-${Date.now()}`,
              type: review.action as Notification['type'],
              message: `${actionLabels[review.action] ?? review.action}: "${article.title}"`,
              articleId: review.article_id,
              timestamp: new Date().toISOString(),
              read: false,
            }

            setNotifications(prev => [notification, ...prev])
            setUnreadCount(c => c + 1)
          }
        )
        .subscribe()

      channels.push(reviewChannel)
    }

    if (role === 'admin') {
      // Watch articles table for new under_review submissions
      const submissionChannel = supabase
        .channel(`notifications:admin:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'articles',
            filter: `status=eq.under_review`,
          },
          (payload) => {
            const article = payload.new as { article_id: number; title: string }
            const notification: Notification = {
              id: `submission-${Date.now()}`,
              type: 'new_submission',
              message: `📝 New article pending review: "${article.title}"`,
              articleId: article.article_id,
              timestamp: new Date().toISOString(),
              read: false,
            }
            setNotifications(prev => [notification, ...prev])
            setUnreadCount(c => c + 1)
          }
        )
        .subscribe()

      channels.push(submissionChannel)
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [userId, role])

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  return { notifications, unreadCount, markAllRead, markRead }
}
