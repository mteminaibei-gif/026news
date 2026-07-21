'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications, type AppNotification, type NotificationType } from '@/lib/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'
import { Check, CheckCheck, Trash2, EyeOff, MoreHorizontal, Bell } from 'lucide-react'

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
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(calc(var(--glass-blur) + 4px)) saturate(160%)',
        WebkitBackdropFilter: 'blur(calc(var(--glass-blur) + 4px)) saturate(160%)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--glow-soft), 0 0 0 1px var(--glass-border)',
        border: '1px solid var(--glass-border)',
        zIndex: 50,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'notif-fade-in 0.18s var(--ease-out-expo)',
      }}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
      }}>
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
              style={{
                padding: 6, borderRadius: 'var(--radius-xs)', border: 'none',
                background: 'transparent', color: 'var(--primary)', cursor: 'pointer',
                display: 'flex', transition: 'all var(--dur-fast) var(--ease-out-expo)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <CheckCheck size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '48px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={24} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>No notifications yet</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>You&apos;re all caught up!</p>
            </div>
          </div>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex', gap: 12, padding: '12px 16px 12px 20px',
                cursor: 'pointer',
                background: !n.read ? 'var(--primary-muted)' : 'transparent',
                borderBottom: '1px solid var(--glass-border)',
                transition: 'all 0.15s var(--ease-out-expo)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = !n.read ? 'var(--primary-light)' : 'var(--glass-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !n.read ? 'var(--primary-muted)' : 'transparent'
              }}
            >
              {/* Unread dot */}
              {!n.read && (
                <span style={{
                  position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 6px var(--primary)',
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-xs)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0,
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
                    width: 28, height: 28, borderRadius: 'var(--radius-xs)',
                    border: 'none', background: 'none',
                    color: 'var(--text-tertiary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--dur-fast) var(--ease-out-expo)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  <MoreHorizontal size={14} />
                </button>

                {menuId === n.id && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setMenuId(null)} />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%',
                      background: 'var(--glass-bg-strong)',
                      backdropFilter: 'blur(calc(var(--glass-blur) + 4px))',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-xs)',
                      boxShadow: 'var(--glow-soft)',
                      zIndex: 70,
                      overflow: 'hidden',
                      minWidth: 160,
                      animation: 'notif-fade-in 0.12s var(--ease-out-expo)',
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); n.read ? markUnread(n.id) : markRead(n.id); setMenuId(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '10px 14px',
                          border: 'none', background: 'none',
                          color: 'var(--text-primary)', fontSize: '0.78rem',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all var(--dur-fast) var(--ease-out-expo)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                      >
                        {n.read ? <EyeOff size={14} /> : <Check size={14} />}
                        {n.read ? 'Mark as unread' : 'Mark as read'}
                      </button>
                      <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 8px' }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); setMenuId(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '10px 14px',
                          border: 'none', background: 'none',
                          color: 'var(--error)', fontSize: '0.78rem',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all var(--dur-fast) var(--ease-out-expo)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
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
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--glass-border)',
        textAlign: 'center', background: 'var(--glass-bg)',
      }}>
        <Link
          href={role === 'admin' ? '/admin/notifications' : '/notifications'}
          onClick={onClose}
          style={{
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)',
            textDecoration: 'none', transition: 'all var(--dur-fast) var(--ease-out-expo)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          View all notifications
        </Link>
      </div>

      <style>{`
        @keyframes notif-fade-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 640px) {
          div[role="dialog"][aria-label="Notifications"] {
            position: fixed !important;
            right: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 75dvh !important;
            max-height: 75dvh !important;
            border-radius: 18px 18px 0 0 !important;
            border-bottom: none !important;
            z-index: 9999 !important;
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
