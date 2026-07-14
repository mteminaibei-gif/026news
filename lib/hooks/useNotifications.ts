'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'new_submission'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'new_comment'
  | 'new_user'
  | 'article_like'
  | 'comment_like'
  | 'follow'
  | 'article_published'
  | 'mention'
  | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  read: boolean
  timestamp: string
  actorName?: string | null
}

type Row = {
  notification_id: number
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

function mapRow(r: Row): AppNotification {
  return {
    id: String(r.notification_id),
    type: (r.type as NotificationType) ?? 'system',
    title: r.title,
    message: r.message,
    link: r.link,
    read: r.read,
    timestamp: r.created_at,
  }
}

/**
 * Full-featured notification hook with real-time subscriptions,
 * mark read/unread, delete, and pagination.
 */
export function useNotifications(userId: number, role: 'admin' | 'journalist' | 'reader') {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const recalc = useCallback((items: AppNotification[]) => {
    setNotifications(items)
    setUnreadCount(items.filter((n) => !n.read).length)
  }, [])

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const supabase = createClient()
    let active = true

    ;(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!active) return
      const mapped = ((data ?? []) as Row[]).map(mapRow)
      recalc(mapped)
      setLoading(false)
    })()

    // Subscribe to INSERT (new notifications) and UPDATE (read state changes)
    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = mapRow(payload.new as Row)
          setNotifications((prev) => [n, ...prev].slice(0, 50))
          setUnreadCount((c) => c + 1)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = mapRow(payload.new as Row)
          setNotifications((prev) => {
            const next = prev.map((n) => n.id === updated.id ? { ...n, read: updated.read } : n)
            setUnreadCount(next.filter((x) => !x.read).length)
            return next
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const deletedId = String((payload.old as { notification_id: number }).notification_id)
          setNotifications((prev) => {
            const next = prev.filter((n) => n.id !== deletedId)
            setUnreadCount(next.filter((x) => !x.read).length)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId, role, recalc])

  /** Mark a single notification as read */
  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id)
      if (!target || target.read) return prev
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      setUnreadCount(next.filter((x) => !x.read).length)
      return next
    })
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('notification_id', Number(id))
  }, [])

  /** Mark a single notification as unread */
  const markUnread = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id)
      if (!target || !target.read) return prev
      const next = prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      setUnreadCount(next.filter((x) => !x.read).length)
      return next
    })
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ read: false } as never)
      .eq('notification_id', Number(id))
  }, [])

  /** Mark all notifications as read */
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('user_id', userId)
      .eq('read', false)
  }, [userId])

  /** Delete a single notification */
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      setUnreadCount(next.filter((x) => !x.read).length)
      return next
    })
    const supabase = createClient()
    supabase
      .from('notifications')
      .delete()
      .eq('notification_id', Number(id))
  }, [])

  /** Clear all notifications */
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
  }, [userId])

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    clearAll,
  }
}
