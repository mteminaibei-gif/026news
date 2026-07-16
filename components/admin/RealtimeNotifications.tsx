'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import {
  Bell, AlertTriangle, CheckCircle, Info, XCircle,
  FileText, MessageSquare, DollarSign, Settings,
  UserPlus, TrendingUp, Shield, Clock
} from 'lucide-react'

interface Notification {
  notification_id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  article_approved: <CheckCircle className="w-4 h-4" />,
  article_rejected: <XCircle className="w-4 h-4" />,
  article_published: <FileText className="w-4 h-4" />,
  article_submitted: <FileText className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  earnings: <DollarSign className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  user_joined: <UserPlus className="w-4 h-4" />,
  milestone: <TrendingUp className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  default: <Bell className="w-4 h-4" />,
}

const NOTIFICATION_COLORS: Record<string, { bg: string; fg: string }> = {
  article_approved: { bg: 'var(--success-light)', fg: 'var(--success)' },
  article_rejected: { bg: 'var(--error-light)', fg: 'var(--error)' },
  article_published: { bg: 'var(--primary-light)', fg: 'var(--primary)' },
  earnings: { bg: 'var(--success-light)', fg: 'var(--success)' },
  alert: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
  warning: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
  security: { bg: 'var(--error-light)', fg: 'var(--error)' },
}

function getNotificationStyle(type: string) {
  return NOTIFICATION_COLORS[type] ?? { bg: 'var(--primary-light)', fg: 'var(--primary)' }
}

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] ?? NOTIFICATION_ICONS.default
}

export function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single()

      if (data) {
        const d = data as { user_id: number }
        setUserId(d.user_id)
        fetchNotifications(d.user_id)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (userId === null) return

    const supabase = createClient()
    const channel = supabase
      .channel('admin:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notif = payload.new as Notification
          if (notif.user_id === userId) {
            setNotifications(prev => [notif, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications(uid: number) {
    try {
      const res = await fetch(`/api/admin/notifications?user_id=${uid}`)
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } catch {
      setNotifications([])
    }
  }

  async function markAsRead(id: number) {
    setNotifications(prev =>
      prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
    )
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      })
    } catch {
      setNotifications(prev =>
        prev.map(n => n.notification_id === id ? { ...n, is_read: false } : n)
      )
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-all duration-200"
        style={{ background: isOpen ? 'var(--primary-light)' : 'transparent', color: 'var(--text-primary)' }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
            style={{ background: 'var(--error)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, var(--primary-light), var(--bg-surface))' }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.is_read) markAsRead(n.notification_id)
                  })
                }}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'var(--primary)', background: 'var(--border-subtle)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = getNotificationStyle(notif.type)
                return (
                  <button
                    key={notif.notification_id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.notification_id)
                    }}
                    className="w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-200"
                    style={{
                      background: notif.is_read ? 'transparent' : 'var(--primary-light)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = notif.is_read ? 'transparent' : 'var(--primary-light)')}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: style.bg, color: style.fg }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
                        )}
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
