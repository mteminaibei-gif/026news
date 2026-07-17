'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/RealtimeProvider'

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
  | 'message'
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
 * Notification hook — fetches initial data, then syncs with the
 * RealtimeProvider's global notification subscription.
 * No duplicate channels are created.
 */
export function useNotifications(userId: number, _role?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const { latestNotification } = useRealtime()

  // Fetch initial notifications
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let active = true
    const supabase = createClient()

    ;(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!active) return
      const mapped = ((data ?? []) as Row[]).map(mapRow)
      setNotifications(mapped)
      setLoading(false)
    })()

    return () => { active = false }
  }, [userId])

  // Compute unread count from local notifications list
  const unreadCount = notifications.filter(n => !n.read).length

  // Prepend new notifications from RealtimeProvider
  useEffect(() => {
    if (!latestNotification || latestNotification.user_id !== userId) return
    const n: AppNotification = {
      id: String(latestNotification.notification_id),
      type: (latestNotification.type as NotificationType) ?? 'system',
      title: latestNotification.title,
      message: latestNotification.message,
      link: latestNotification.link,
      read: latestNotification.read,
      timestamp: latestNotification.created_at,
    }
    setNotifications(prev => {
      if (prev.some(p => p.id === n.id)) return prev
      return [n, ...prev].slice(0, 50)
    })
  }, [latestNotification, userId])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const supabase = createClient()
    supabase.from('notifications').update({ read: true } as never).eq('notification_id', Number(id))
  }, [])

  const markUnread = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
    const supabase = createClient()
    supabase.from('notifications').update({ read: false } as never).eq('notification_id', Number(id))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (!userId) return
    const supabase = createClient()
    supabase.from('notifications').update({ read: true } as never).eq('user_id', userId).eq('read', false)
  }, [userId])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const supabase = createClient()
    supabase.from('notifications').delete().eq('notification_id', Number(id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    if (!userId) return
    const supabase = createClient()
    supabase.from('notifications').delete().eq('user_id', userId)
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
