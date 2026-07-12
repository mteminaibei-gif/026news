'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type Filter = 'all' | 'likes' | 'comments' | 'follows' | 'mentions' | 'system'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system'
  text: string
  detail?: string
  time: string
  read: boolean
  thumbnail?: string
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Likes', value: 'likes' },
  { label: 'Comments', value: 'comments' },
  { label: 'Follows', value: 'follows' },
  { label: 'Mentions', value: 'mentions' },
  { label: 'System', value: 'system' },
]

const MOCK_NOTIFICATIONS: { group: string; items: Notification[] }[] = [
  {
    group: 'Today',
    items: [
      { id: '1', type: 'like', text: 'Sarah Kimani liked your article', detail: '"Kenya\'s Tech Boom in 2026"', time: '2 min ago', read: false },
      { id: '2', type: 'comment', text: 'James Odhiambo commented on your article', detail: '"Election Coverage Trends"', time: '18 min ago', read: false },
      { id: '3', type: 'follow', text: 'Amina Hassan started following you', time: '1 hour ago', read: true },
      { id: '4', type: 'mention', text: 'Peter Mwangi mentioned you in a comment', detail: '"Best journalism practices"', time: '3 hours ago', read: false },
    ],
  },
  {
    group: 'Yesterday',
    items: [
      { id: '5', type: 'like', text: 'David Kipchoge liked your article', detail: '"Sports Funding in East Africa"', time: '1 day ago', read: true },
      { id: '6', type: 'system', text: 'Your article has been approved for publication', time: '1 day ago', read: true },
      { id: '7', type: 'comment', text: 'Grace Wanjiku replied to your comment', time: '1 day ago', read: true },
    ],
  },
  {
    group: 'This Week',
    items: [
      { id: '8', type: 'follow', text: 'Brian Otieno started following you', time: '3 days ago', read: true },
      { id: '9', type: 'like', text: '12 people liked your article', detail: '"AI in African Newsrooms"', time: '5 days ago', read: true },
      { id: '10', type: 'system', text: 'Your weekly analytics report is ready', time: '6 days ago', read: true },
    ],
  },
]

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  like: { bg: 'var(--error-light)', color: 'var(--error)' },
  comment: { bg: 'var(--primary-light)', color: 'var(--primary)' },
  follow: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  mention: { bg: 'var(--success-light)', color: 'var(--success)' },
  system: { bg: 'var(--bg-inset)', color: 'var(--text-tertiary)' },
}

const TYPE_ICONS: Record<string, string> = {
  like: '\u2764',
  comment: '\uD83D\uDCAC',
  follow: '\uD83D\uDC64',
  mention: '\uD83D\uDCDD',
  system: '\u2699',
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(group => ({
        ...group,
        items: group.items.map(item => ({ ...item, read: true })),
      }))
    )
  }

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications
        .map(group => ({
          ...group,
          items: group.items.filter(n => {
            if (activeFilter === 'likes') return n.type === 'like'
            if (activeFilter === 'comments') return n.type === 'comment'
            if (activeFilter === 'follows') return n.type === 'follow'
            if (activeFilter === 'mentions') return n.type === 'mention'
            if (activeFilter === 'system') return n.type === 'system'
            return true
          }),
        }))
        .filter(group => group.items.length > 0)

  const totalUnread = notifications.reduce(
    (acc, group) => acc + group.items.filter(n => !n.read).length,
    0
  )

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      <main className="flex-1 w-full" style={{ maxWidth: '720px', marginInline: 'auto', paddingInline: 'var(--space-md)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ paddingBlock: 'var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-lg)' }}
        >
          <div>
            <h1
              className="font-serif"
              style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              Notifications
            </h1>
            {totalUnread > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {totalUnread} unread notification{totalUnread !== 1 ? 's' : ''}
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

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 'var(--space-xl)' }}>
          {FILTERS.map(f => (
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
                color: activeFilter === f.value ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div
            className="text-center"
            style={{
              paddingBlock: 'var(--space-3xl)',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
              {'\uD83D\uDD14'}
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
              No notifications
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              You&apos;re all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(group => (
              <div key={group.group}>
                <h2
                  className="font-semibold uppercase"
                  style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  {group.group}
                </h2>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {group.items.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3"
                      style={{
                        padding: '0.875rem 1rem',
                        borderBottom: i < group.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: !item.read ? 'var(--primary-light)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Unread dot */}
                      <div style={{ width: '8px', height: '8px', marginTop: '7px', flexShrink: 0, borderRadius: '9999px', background: !item.read ? 'var(--primary)' : 'transparent' }} />

                      {/* Icon */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: TYPE_COLORS[item.type]?.bg ?? 'var(--bg-inset)',
                          color: TYPE_COLORS[item.type]?.color ?? 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.95rem',
                          flexShrink: 0,
                        }}
                      >
                        {TYPE_ICONS[item.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: !item.read ? 600 : 400, lineHeight: 1.4 }}>
                          {item.text}
                        </p>
                        {item.detail && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px', fontStyle: 'italic' }}>
                            {item.detail}
                          </p>
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.time}
                        </p>
                      </div>

                      {/* Optional thumbnail */}
                      {item.thumbnail && (
                        <div
                          style={{
                            width: '48px',
                            height: '36px',
                            borderRadius: '6px',
                            background: 'var(--bg-inset)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
