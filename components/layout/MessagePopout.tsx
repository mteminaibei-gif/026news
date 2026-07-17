'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { MessageSquare, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface MessageNotification {
  id: number
  sender_id: number
  sender_name: string
  sender_image: string | null
  content: string
  created_at: string
}

export function MessagePopout() {
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const { onlineUsers } = useRealtime()
  const [notifications, setNotifications] = useState<MessageNotification[]>([])
  const [lastChecked, setLastChecked] = useState<number>(Date.now())
  const supabase = createClient()

  const myId = profile?.user_id ?? 0

  // Check for new messages from users who messaged me
  const checkNewMessages = useCallback(async () => {
    if (!myId) return

    try {
      // Get messages received since last check
      interface MessageWithSender {
        message_id: number
        sender_id: number
        receiver_id: number
        content: string
        created_at: string
        sender: { user_id: number; name: string; profile_image: string | null } | null
      }
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          message_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          sender:users!messages_sender_id_fkey(user_id, name, profile_image)
        `)
        .eq('receiver_id', myId)
        .gt('created_at', new Date(lastChecked).toISOString())
        .order('created_at', { ascending: false })
        .limit(5) as { data: MessageWithSender[] | null; error: any }

      if (messages && messages.length > 0) {
        const newNotifications: MessageNotification[] = messages.map(m => ({
          id: m.message_id,
          sender_id: m.sender_id,
          sender_name: (m.sender as any)?.name || 'Unknown',
          sender_image: (m.sender as any)?.profile_image || null,
          content: m.content,
          created_at: m.created_at,
        }))

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 5))
      }
    } catch (e) {
      console.error('Failed to check new messages:', e)
    } finally {
      setLastChecked(Date.now())
    }
  }, [myId, lastChecked, supabase])

  // Initial load
  useEffect(() => {
    if (!myId) return
    checkNewMessages()
  }, [checkNewMessages, myId])

  // Poll for new messages (every 10 seconds)
  useEffect(() => {
    if (!myId) return
    const interval = setInterval(checkNewMessages, 10000)
    return () => clearInterval(interval)
  }, [checkNewMessages, myId])

  // Also listen to realtime for instant notifications
  useEffect(() => {
    if (!myId) return

    const channel = supabase
      .channel(`message-notifications-${myId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          const msg = payload.new as any
          if (msg.sender_id !== myId) {
            // Fetch sender details
            supabase
              .from('users')
              .select('user_id, name, profile_image')
              .eq('user_id', msg.sender_id)
              .single()
              .then(({ data: sender }) => {
                const s = sender as { name: string; profile_image: string | null } | null
                const notification: MessageNotification = {
                  id: msg.message_id,
                  sender_id: msg.sender_id,
                  sender_name: s?.name || 'Unknown',
                  sender_image: s?.profile_image || null,
                  content: msg.content,
                  created_at: msg.created_at,
                }
                setNotifications(prev => [notification, ...prev].slice(0, 5))
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [myId, supabase])

  const dismiss = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  if (!myId || notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" role="region" aria-label="Message notifications">
      {notifications.slice(0, 3).map((n, index) => (
        <div
          key={n.id}
          className="animate-slide-in"
          style={{
            minWidth: 320,
            maxWidth: 420,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#fff',
          }}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/20">
              {n.sender_image ? (
                <img src={n.sender_image} alt={n.sender_name} className="w-full h-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {n.sender_name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[var(--primary)] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{n.sender_name}</p>
              <p className="text-xs opacity-90 truncate">{n.content}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          <Link
            href={`/inbox?conversation=${n.sender_id}`}
            className="block p-4 bg-[var(--bg-base)] border-t border-[var(--border-subtle)] hover:bg-[var(--bg-inset)] transition-colors text-decoration-none"
            onClick={() => dismiss(n.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Open conversation</span>
              <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
            </div>
          </Link>
        </div>
      ))}
      {notifications.length > 3 && (
        <button
          onClick={dismissAll}
          className="self-end px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          Dismiss all ({notifications.length})
        </button>
      )}
      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-slide-in { animation: slide-in 0.3s var(--ease-out-expo) forwards; }
      `}</style>
    </div>
  )
}