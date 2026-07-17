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
  // Notifications
  unreadCount: number
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
  unreadCount: 0,
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
  markAllNotificationsRead: () => void
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

    // 2. Notifications — INSERT/UPDATE/DELETE (filtered by user)
    // Seed the authoritative unread count from the DB so the badge is correct on load.
    Promise.resolve(
      supabase
        .from('notifications')
        .select('notification_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
    ).then(({ count }) => {
      if (count != null) setState(s => ({ ...s, unreadCount: count }))
    }).catch(() => {})

    const notifCh = supabase
      .channel(`rt:notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        const n = payload.new as LiveNotification
        if (!n.read) setState(s => ({ ...s, unreadCount: s.unreadCount + 1, latestNotification: n }))
        else setState(s => ({ ...s, latestNotification: n }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        // If a notification was marked read, decrement the unread count.
        const updated = payload.new as LiveNotification
        if (updated.read) {
          setState(s => ({ ...s, unreadCount: Math.max(0, s.unreadCount - 1) }))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        setState(s => ({ ...s, unreadCount: Math.max(0, s.unreadCount - 1) }))
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
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setState(s => ({ ...s, unreadCount: 0 }))
  }, [])

  const clearBreakingNews = useCallback(() => {
    setState(s => ({ ...s, breakingNews: null }))
  }, [])

  const value: RealtimeContextValue = {
    ...state,
    subscribeToArticle,
    subscribeToComments,
    markNotificationRead,
    markAllNotificationsRead,
    clearBreakingNews,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
