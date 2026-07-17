'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications, type AppNotification, type NotificationType } from '@/lib/hooks/useNotifications'
import { timeAgo } from '@/lib/utils'
import { CheckCheck, Trash2, EyeOff, Check, MoreHorizontal } from 'lucide-react'

interface NotificationBellProps {
  userId: number
  role: 'admin' | 'journalist' | 'reader'
}

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
  system: '🔔',
}

export function NotificationBell({ userId, role }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const router = useRouter()
  const { notifications, unreadCount, markAllRead, markRead, markUnread, deleteNotification } = useNotifications(userId, role)

  // Auto-mark all read when dropdown opens
  useEffect(() => {
    if (open && unreadCount > 0) markAllRead()
  }, [open, unreadCount, markAllRead])

  function openNotification(n: AppNotification) {
    markRead(n.id)
    if (n.link) router.push(n.link)
    setOpen(false)
    setMenuId(null)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />

          <div
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            role="dialog"
            aria-label="Notifications panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] ?? '📬'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" aria-label="Unread" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <Link
                href="/notifications"
                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
