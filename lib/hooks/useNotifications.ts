'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'new_submission'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'new_comment'
  | 'new_user'
  | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  read: boolean
  timestamp: string
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
 * Reads the user's persisted notifications from the `notifications` table and
 * subscribes to Realtime INSERTs so new ones arrive instantly. Mark actions
 * persist back to the database (RLS ensures a user only touches their own rows).
 */
export function useNotifications(userId: number, role: 'admin' | 'journalist' | 'reader') {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  function recalc(items: AppNotification[]) {
    setNotifications(items)
    setUnreadCount(items.filter((n) => !n.read).length)
  }

  useEffect(() => {
    if (!userId) return
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
    })()

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = mapRow(payload.new as Row)
          setNotifications((prev) => [n, ...prev].slice(0, 50))
          setUnreadCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId, role])

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('user_id', userId)
      .eq('read', false)
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('notification_id', Number(id))
  }

  return { notifications, unreadCount, markAllRead, markRead }
}
