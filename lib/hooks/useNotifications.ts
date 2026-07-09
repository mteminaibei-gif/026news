'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type:
    | 'article_approved'
    | 'article_rejected'
    | 'revision_requested'
    | 'new_comment'
    | 'new_submission'
    | 'new_user'
  message: string
  articleId?: number
  userId?: number
  timestamp: string
  read: boolean
}

export function useNotifications(userId: number, role: 'admin' | 'journalist' | 'reader') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)

  useEffect(() => {
    if (!userId || role === 'reader') return

    const supabase = createClient()
    const channels: ReturnType<typeof supabase.channel>[] = []

    // ── JOURNALIST: watch review_workflow for decisions on their articles ──
    if (role === 'journalist') {
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

            const { data: rawArticle } = await supabase
              .from('articles')
              .select('title, author_id')
              .eq('article_id', review.article_id)
              .single()
            const article = rawArticle as unknown as { title: string; author_id: number } | null

            if (article?.author_id !== userId) return

            const actionLabels: Record<string, string> = {
              approved:           '✅ Your article was approved and published!',
              rejected:           '❌ Your article was rejected.',
              revision_requested: '🔄 Revision requested on your article.',
            }

            push({
              id:        `review-${Date.now()}`,
              type:      review.action as Notification['type'],
              message:   `${actionLabels[review.action] ?? review.action}: "${article.title}"`,
              articleId: review.article_id,
            })
          }
        )
        .subscribe()

      channels.push(reviewChannel)
    }

    // ── ADMIN: watch new article submissions ──
    if (role === 'admin') {
      const submissionChannel = supabase
        .channel(`notifications:admin:submissions:${userId}`)
        .on(
          'postgres_changes',
          {
            event:  'UPDATE',
            schema: 'public',
            table:  'articles',
            filter: `status=eq.under_review`,
          },
          (payload) => {
            const article = payload.new as { article_id: number; title: string }
            push({
              id:        `submission-${Date.now()}`,
              type:      'new_submission',
              message:   `📝 New article pending review: "${article.title}"`,
              articleId: article.article_id,
            })
          }
        )
        .subscribe()

      channels.push(submissionChannel)

      // ── ADMIN: watch new user registrations (INSERT on users table) ──
      const newUserChannel = supabase
        .channel(`notifications:admin:new-users:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'users' },
          (payload) => {
            const newUser = payload.new as {
              user_id: number
              name: string
              email: string
              role: string
            }
            const roleLabel = newUser.role === 'journalist' ? 'Author' : newUser.role
            push({
              id:      `new-user-${Date.now()}`,
              type:    'new_user',
              message: `🆕 New ${roleLabel} registered: ${newUser.name || newUser.email}`,
              userId:  newUser.user_id,
            })
          }
        )
        .subscribe()

      channels.push(newUserChannel)
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [userId, role]) // eslint-disable-line react-hooks/exhaustive-deps

  function push(n: Omit<Notification, 'timestamp' | 'read'>) {
    const notif: Notification = { ...n, timestamp: new Date().toISOString(), read: false }
    setNotifications(prev => [notif, ...prev.slice(0, 49)]) // keep last 50
    setUnreadCount(c => c + 1)
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  function markRead(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount(c => Math.max(0, c - 1))
  }

  return { notifications, unreadCount, markAllRead, markRead }
}
