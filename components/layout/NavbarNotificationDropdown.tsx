'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications, type AppNotification, type NotificationType } from '@/lib/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'
import { Check, CheckCheck, Trash2, EyeOff, MoreHorizontal } from 'lucide-react'

const TYPE_ICONS: Record<NotificationType, string> = {
  new_submission: '📝',
  approved: '✅',
  rejected: '❌',
  revision_requested: '🔄',
  new_comment: '💬',
  new_user: '🆕',
  article_like: '❤️',
  comment_like: '💙',
  follow: '👤',
  article_published: '📰',
  mention: '🏷️',
  message: '✉️',
  system: '🔔',
}

interface Props {
  userId: number
  role: 'admin' | 'journalist' | 'reader'
  onClose: () => void
}

export function NavbarNotificationDropdown({ userId, role, onClose }: Props) {
  const router = useRouter()
  const { notifications, unreadCount, markAllRead, markRead, markUnread, deleteNotification } = useNotifications(userId, role)
  const [menuId, setMenuId] = useState<string | null>(null)

  // Auto-mark all read when dropdown opens
  useEffect(() => {
    if (unreadCount > 0) markAllRead()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick(n: AppNotification) {
    markRead(n.id)
    if (n.link) router.push(n.link)
    onClose()
  }

  function handleToggleMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setMenuId(menuId === id ? null : id)
  }

  return (
    <div
      style={{
        position: 'absolute', right: 0, top: '100%', marginTop: 8,
        width: 'min(380px, calc(100vw - 24px))',
        maxHeight: 'min(480px, calc(100dvh - 80px))',
        background: 'var(--bg-elevated)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
        zIndex: 50,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h3>
          {unreadCount > 0 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{unreadCount} unread</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              title="Mark all as read"
              style={{ padding: 6, borderRadius: 8, border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
            >
              <CheckCheck size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>No notifications yet</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>You&apos;re all caught up!</p>
          </div>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                cursor: 'pointer',
                background: !n.read ? 'var(--primary-light)' : 'transparent',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.12s',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (n.read) e.currentTarget.style.background = 'var(--bg-surface)' }}
              onMouseLeave={(e) => { if (n.read) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Unread dot */}
              {!n.read && (
                <span style={{
                  position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--primary)',
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}>
                {TYPE_ICONS[n.type] ?? '📬'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.82rem', lineHeight: 1.4,
                  color: 'var(--text-primary)',
                  fontWeight: !n.read ? 600 : 400,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {n.message}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {timeAgo(n.timestamp)}
                </p>
              </div>

              {/* Context menu */}
              <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
                <button
                  onClick={(e) => handleToggleMenu(e, n.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: 'none', background: 'none',
                    color: 'var(--text-tertiary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>

                {menuId === n.id && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setMenuId(null)} />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 70,
                      overflow: 'hidden',
                      minWidth: 160,
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); n.read ? markUnread(n.id) : markRead(n.id); setMenuId(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '10px 14px',
                          border: 'none', background: 'none',
                          color: 'var(--text-primary)', fontSize: '0.8rem',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {n.read ? <EyeOff size={14} /> : <Check size={14} />}
                        {n.read ? 'Mark as unread' : 'Mark as read'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); setMenuId(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '10px 14px',
                          border: 'none', background: 'none',
                          color: 'var(--error)', fontSize: '0.8rem',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <Link
          href={role === 'admin' ? '/admin/notifications' : '/notifications'}
          onClick={onClose}
          style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
        >
          View all notifications
        </Link>
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[role="dialog"][aria-label="Notifications"] {
            position: fixed !important;
            right: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 75dvh !important;
            max-height: 75dvh !important;
            border-radius: 18px 18px 0 0 !important;
            border-bottom: none !important;
            animation: notif-sheet-up 0.25s var(--ease-out-expo, ease);
          }
          @keyframes notif-sheet-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  )
}
