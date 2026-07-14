'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  useNotifications,
  type AppNotification,
  type NotificationType,
} from '@/lib/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'

type Filter = 'all' | 'submissions' | 'comments' | 'system'

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submissions', value: 'submissions' },
  { label: 'Comments', value: 'comments' },
  { label: 'System', value: 'system' },
]

const TYPE_META: Record<NotificationType, { icon: string; bg: string; color: string }> = {
  new_submission:     { icon: '📝', bg: 'var(--primary-light)', color: 'var(--primary)' },
  approved:           { icon: '✅', bg: 'var(--success-light)', color: 'var(--success)' },
  rejected:           { icon: '❌', bg: 'var(--error-light)', color: 'var(--error)' },
  revision_requested: { icon: '🔄', bg: 'var(--warning-light)', color: 'var(--warning)' },
  new_comment:        { icon: '💬', bg: 'var(--accent-light)', color: 'var(--accent)' },
  new_user:           { icon: '🆕', bg: 'var(--success-light)', color: 'var(--success)' },
  system:             { icon: '🔔', bg: 'var(--bg-inset)', color: 'var(--text-tertiary)' },
}

function groupKey(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  if (d >= startOfToday) return 'Today'
  if (d >= startOfYesterday) return 'Yesterday'
  if (d >= startOfWeek) return 'This Week'
  return 'Earlier'
}

function matchesFilter(n: AppNotification, f: Filter): boolean {
  if (f === 'all') return true
  if (f === 'submissions') return n.type === 'new_submission'
  if (f === 'comments') return n.type === 'new_comment'
  if (f === 'system') return n.type === 'system' || n.type === 'new_user'
  return true
}

export default function AdminNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [userId, setUserId] = useState<number | null>(null)
  const [role, setRole] = useState<'admin' | 'journalist' | 'reader'>('admin')
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingUser(false)
        return
      }
      const { data: profile } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('email', user.email ?? '')
        .single()
      if (profile) {
        setUserId((profile as { user_id: number }).user_id)
        setRole((profile as { role: string }).role as typeof role)
      }
      setLoadingUser(false)
    })()
  }, [])

  const { notifications, unreadCount, markAllRead, markRead } =
    useNotifications(userId ?? 0, role)

  const visible = notifications.filter((n) => matchesFilter(n, activeFilter))
  const groups: { key: string; items: AppNotification[] }[] = []
  for (const n of visible) {
    const key = groupKey(n.timestamp)
    let g = groups.find((x) => x.key === key)
    if (!g) {
      g = { key, items: [] }
      groups.push(g)
    }
    g.items.push(n)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-lg)' }}
      >
        <div>
          <h1 className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="font-semibold"
          style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 flex-wrap" style={{ marginBottom: 'var(--space-lg)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className="font-semibold"
            style={{
              fontSize: '0.78rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: activeFilter === f.value ? 'var(--primary)' : 'var(--border)',
              background: activeFilter === f.value ? 'var(--primary)' : 'var(--bg-surface)',
              color: activeFilter === f.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadingUser ? (
        <p style={{ color: 'var(--text-tertiary)', paddingBlock: 'var(--space-2xl)' }}>Loading…</p>
      ) : userId === null ? (
        <div className="text-center" style={{ paddingBlock: 'var(--space-3xl)', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Not authenticated</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center" style={{ paddingBlock: 'var(--space-3xl)', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🔔</div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>No notifications</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <h2 className="font-semibold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
                {group.key}
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                {group.items.map((item, i) => {
                  const meta = TYPE_META[item.type] ?? TYPE_META.system
                  const inner = (
                    <>
                      <div style={{ width: '8px', height: '8px', marginTop: '7px', flexShrink: 0, borderRadius: '9999px', background: !item.read ? 'var(--primary)' : 'transparent' }} />
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: !item.read ? 600 : 400, lineHeight: 1.4 }}>
                          {item.message}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {timeAgo(item.timestamp)}
                        </p>
                      </div>
                    </>
                  )
                  const style = {
                    padding: '0.875rem 1rem',
                    borderBottom: i < group.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: !item.read ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.15s',
                  }
                  if (item.link) {
                    return (
                      <Link key={item.id} href={item.link} onClick={() => markRead(item.id)} className="flex items-start gap-3" style={style} >
                        {inner}
                      </Link>
                    )
                  }
                  return (
                    <div key={item.id} className="flex items-start gap-3" style={style}>
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
