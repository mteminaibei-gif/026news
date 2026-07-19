'use client'

import { useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime, type LiveNotification } from '@/components/providers/RealtimeProvider'

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

function mapRow(r: LiveNotification): AppNotification {
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
 * Notification hook — a thin view over the RealtimeProvider's authoritative
 * notifications list. Because every consumer (navbar badge, dropdown, full
 * page) reads from the same provider state, marking a notification read (or
 * marking all read) anywhere is reflected everywhere immediately.
 */
export function useNotifications(userId: number, _role?: string) {
  const realtime = useRealtime()

  const notifications = useMemo(
    () => realtime.notifications.map(mapRow),
    [realtime.notifications]
  )

  const unreadCount = useMemo(
    () => realtime.notifications.filter(n => !n.read).length,
    [realtime.notifications]
  )

  const loading = realtime.notificationsLoading

  const markRead = useCallback((id: string) => {
    const supabase = createClient()
    supabase.from('notifications').update({ read: true } as never).eq('notification_id', Number(id))
    realtime.markNotificationRead(Number(id))
  }, [realtime])

  const markUnread = useCallback((id: string) => {
    const supabase = createClient()
    supabase.from('notifications').update({ read: false } as never).eq('notification_id', Number(id))
    realtime.markNotificationUnread(Number(id))
  }, [realtime])

  const markAllRead = useCallback(() => {
    realtime.markAllNotificationsRead()
    if (!userId) return
    const supabase = createClient()
    supabase.from('notifications').update({ read: true } as never).eq('user_id', userId).eq('read', false)
  }, [realtime, userId])

  const deleteNotification = useCallback(async (id: string) => {
    realtime.deleteNotification(Number(id))
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('notification_id', Number(id))
  }, [realtime])

  const clearAll = useCallback(async () => {
    realtime.clearAllNotifications()
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId)
    if (error) {
      // On failure, re-seed the list from the DB so the UI recovers.
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      realtime.setNotifications(data ?? [])
    }
  }, [realtime, userId])

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
