'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────
export interface LiveArticle {
  article_id: number
  title: string
  slug: string
  status: string
  views: number
  created_at: string
  featured_image: string | null
  author: { user_id: number; name: string; profile_image?: string | null } | null
  category: { name: string } | null
}

export interface LiveNotification {
  notification_id: number
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
  user_id: number
}

export interface LiveComment {
  comment_id: number
  article_id: number
  user_id: number
  content: string
  created_at: string
}

export interface LiveActivity {
  kind: 'read' | 'listen' | 'watch'
  ref_id: number | string
  name?: string
  created_at: string
}

export interface LivePresence {
  user_id: number
  name: string
  avatar?: string | null
  online_at: string
}

interface RealtimeState {
  // Articles
  latestArticle: LiveArticle | null
  articleCount: number
  // Notifications — full list is the single source of truth; unreadCount is derived from it
  notifications: LiveNotification[]
  notificationsLoading: boolean
  latestNotification: LiveNotification | null
  // Comments
  latestComment: LiveComment | null
  // Activity (reads/listens/watches)
  latestActivity: LiveActivity | null
  // Presence
  onlineUsers: LivePresence[]
  // Breaking news
  breakingNews: LiveArticle | null
  // Connection
  connected: boolean
}

const initialState: RealtimeState = {
  latestArticle: null,
  articleCount: 0,
  notifications: [],
  notificationsLoading: true,
  latestNotification: null,
  latestComment: null,
  latestActivity: null,
  onlineUsers: [],
  breakingNews: null,
  connected: false,
}

interface RealtimeContextValue extends RealtimeState {
  subscribeToArticle: (articleId: number) => () => void
  subscribeToComments: (articleId: number) => () => void
  markNotificationRead: (id: number) => void
  markNotificationUnread: (id: number) => void
  setNotifications: (rows: LiveNotification[]) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: number) => void
  clearAllNotifications: () => void
  clearBreakingNews: () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}

// ── Provider ───────────────────────────────────────────────────
export function RealtimeProvider({ children, userId }: { children: ReactNode; userId?: number }) {
  const [state, setState] = useState<RealtimeState>(initialState)
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const supabaseRef = useRef(createClient())

  // Stable reference to supabase
  const supabase = supabaseRef.current

  // ── Global subscriptions (always active) ──────────────────────
  useEffect(() => {
    if (!userId) return

    const channels: RealtimeChannel[] = []

    // 1. Articles feed — INSERT/UPDATE/DELETE
    const articlesCh = supabase
      .channel('rt:articles:global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, (payload) => {
        const art = payload.new as LiveArticle
        if (art.status === 'published') {
          setState(s => ({ ...s, latestArticle: art, articleCount: s.articleCount + 1 }))
          // Breaking news: if article is very recent (< 5 min old)
          const age = Date.now() - new Date(art.created_at).getTime()
          if (age < 5 * 60 * 1000) {
            setState(s => ({ ...s, breakingNews: art }))
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'articles' }, () => {
        setState(s => ({ ...s, articleCount: Math.max(0, s.articleCount - 1) }))
      })
      .subscribe()
    channels.push(articlesCh)

    // 2. Notifications — full list is the single source of truth for all
    //    consumers (navbar badge, dropdown, notifications page). Seed it from
    //    the DB on mount, then keep it in sync via realtime INSERT/UPDATE/DELETE.
    const seedNotif = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    Promise.resolve(seedNotif).then(({ data }) => {
      setState(s => ({
        ...s,
        notifications: (data ?? []) as LiveNotification[],
        notificationsLoading: false,
      }))
    }).catch(() => {
      setState(s => ({ ...s, notificationsLoading: false }))
    })

    const notifCh = supabase
      .channel(`rt:notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as LiveNotification
        setState(s => {
          if (s.notifications.some(x => x.notification_id === n.notification_id)) {
            return { ...s, latestNotification: n }
          }
          return { ...s, notifications: [n, ...s.notifications].slice(0, 50), latestNotification: n }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const updated = payload.new as LiveNotification
        setState(s => ({
          ...s,
          notifications: s.notifications.map(x =>
            x.notification_id === updated.notification_id ? { ...x, ...updated } : x
          ),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const deleted = payload.old as LiveNotification | undefined
        const id = deleted?.notification_id
        if (id == null) return
        setState(s => ({ ...s, notifications: s.notifications.filter(x => x.notification_id !== id) }))
      })
      .subscribe()
    channels.push(notifCh)

    // 2b. Per-user activity (reads / listens / watches)
    const activityTables: { table: string; kind: LiveActivity['kind']; refCol: string }[] = [
      { table: 'article_reads', kind: 'read', refCol: 'article_id' },
      { table: 'listen_history', kind: 'listen', refCol: 'station_id' },
      { table: 'watch_history', kind: 'watch', refCol: 'channel_id' },
    ]
    for (const a of activityTables) {
      const ch = supabase
        .channel(`rt:activity:${a.table}:${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: a.table, filter: `user_id=eq.${userId}` }, (payload) => {
          const row = payload.new as { [k: string]: unknown; created_at: string }
          setState(s => ({
            ...s,
            latestActivity: {
              kind: a.kind,
              ref_id: row[a.refCol] as number | string,
              name: (row.station_name as string) ?? (row.channel_name as string) ?? undefined,
              created_at: row.created_at,
            },
          }))
        })
        .subscribe()
      channels.push(ch)
    }

    // 3. Presence — track online users
    const presenceCh = supabase
      .channel('rt:presence:global')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceCh.presenceState()
        const users: LivePresence[] = []
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as Array<LivePresence>
          if (presences?.[0]) users.push(presences[0])
        }
        setState(s => ({ ...s, onlineUsers: users }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceCh.track({
            user_id: userId,
            name: `User ${userId}`,
            online_at: new Date().toISOString(),
          })
        }
      })
    channels.push(presenceCh)

    setState(s => ({ ...s, connected: true }))

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current.clear()
      setState(s => ({ ...s, connected: false }))
    }
  }, [userId, supabase])

  // ── Dynamic per-article subscriptions ─────────────────────────
  const subscribeToArticle = useCallback((articleId: number) => {
    const key = `rt:article:${articleId}`
    if (channelsRef.current.has(key)) return () => {}

    const ch = supabase
      .channel(key)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'articles', filter: `article_id=eq.${articleId}` }, () => {
        // Trigger a refetch in consuming components via state bump
        setState(s => ({ ...s }))
      })
      .subscribe()

    channelsRef.current.set(key, ch)
    return () => {
      supabase.removeChannel(ch)
      channelsRef.current.delete(key)
    }
  }, [supabase])

  // ── Dynamic per-article comment subscriptions ─────────────────
  const subscribeToComments = useCallback((articleId: number) => {
    const key = `rt:comments:${articleId}`
    if (channelsRef.current.has(key)) return () => {}

    const ch = supabase
      .channel(key)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_id=eq.${articleId}` }, (payload) => {
        const comment = payload.new as LiveComment
        setState(s => ({ ...s, latestComment: comment }))
      })
      .subscribe()

    channelsRef.current.set(key, ch)
    return () => {
      supabase.removeChannel(ch)
      channelsRef.current.delete(key)
    }
  }, [supabase])

  const markNotificationRead = useCallback((id: number) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n =>
        n.notification_id === id ? { ...n, read: true } : n
      ),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    }))
  }, [])

  const markNotificationUnread = useCallback((id: number) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n =>
        n.notification_id === id ? { ...n, read: false } : n
      ),
    }))
  }, [])

  const setNotifications = useCallback((rows: LiveNotification[]) => {
    setState(s => ({ ...s, notifications: rows }))
  }, [])

  const deleteNotification = useCallback((id: number) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.filter(n => n.notification_id !== id),
    }))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setState(s => ({ ...s, notifications: [] }))
  }, [])

  const clearBreakingNews = useCallback(() => {
    setState(s => ({ ...s, breakingNews: null }))
  }, [])

  const value: RealtimeContextValue = {
    ...state,
    subscribeToArticle,
    subscribeToComments,
    markNotificationRead,
    markNotificationUnread,
    setNotifications,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    clearBreakingNews,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
