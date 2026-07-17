'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { MessageSquare, X, Send, Search, Users } from 'lucide-react'
import Link from 'next/link'

interface Follower {
  user_id: number
  name: string
  profile_image: string | null
  role: string
}

interface MsgRow {
  message_id: number
  sender_id: number
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
}

export function MessagesProfileSidebar({ userId, profile }: { userId: number; profile: any }) {
  const { onlineUsers } = useRealtime()
  const supabase = createClient()

  const [followers, setFollowers] = useState<Follower[]>([])
  const [active, setActive] = useState<Follower | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [unreadByUser, setUnreadByUser] = useState<Record<number, number>>({})
  const [isSending, setIsSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const onlineIds = new Set(onlineUsers.map(o => o.user_id))
  const onlineFollowers = followers.filter(f => onlineIds.has(f.user_id))

  // Load followers only once
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', userId)
          .limit(200)
        if (!data) return
        const ids = data.map(d => (d as { follower_id: number }).follower_id)
        if (ids.length === 0) return
        const { data: u } = await supabase
          .from('users')
          .select('user_id, name, profile_image, role')
          .in('user_id', ids)
        setFollowers(u ?? [])
      } catch {}
    })()
  }, [userId])

  const loadThread = useCallback(async (other: Follower) => {
    if (!userId) return
    setLoading(true)
    setActive(other)
    try {
      const res = await fetch(`/api/messages/${other.user_id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
      await fetch(`/api/messages/${other.user_id}`, { method: 'PATCH' })
      setUnreadByUser(prev => ({ ...prev, [other.user_id]: 0 }))
    } finally { setLoading(false) }
  }, [userId])

  const handleSend = useCallback(async () => {
    if (!draft.trim() || !active || !userId) return
    setIsSending(true)
    const content = draft.trim()
    setDraft('')

    const temp: MsgRow = {
      message_id: -Date.now(),
      sender_id: userId,
      receiver_id: active.user_id,
      content,
      is_read: true,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, temp])

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: active.user_id, content }),
      })
    } catch {}
    finally { setIsSending(false) }
  }, [draft, active, userId])

  const filtered = followers.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = Object.values(unreadByUser).reduce((a, b) => a + b, 0)

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
      {/* Profile header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name?.charAt(0) || 'U'}</div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.name}</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{profile?.role || 'Reader'}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{followers.length} followers</span>
          <span className="text-xs" style={{ color: 'var(--success)' }}>{onlineFollowers.length} online</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="relative">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search followers"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Followers list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No followers to message.</p>
        ) : (
          filtered.map(f => (
            <button
              key={f.user_id}
              onClick={() => loadThread(f)}
              className="w-full text-left p-3 border-b hover:bg-[var(--bg-inset)] transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-inset)]">
                  {f.profile_image
                    ? <img src={f.profile_image} alt={f.name} className="w-full h-full object-cover" />
                    : <span className="flex items-center justify-center h-full font-semibold text-xs">{f.name.charAt(0)}</span>
                  }
                  {onlineIds.has(f.user_id) && <span className="absolute bottom-0 right-0 w-2 h-2 bg-[var(--success)] border-2 border-[var(--bg-surface)] rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</p>
                  <p className="text-xs" style={{ color: onlineIds.has(f.user_id) ? 'var(--success)' : 'var(--text-tertiary)' }}>{onlineIds.has(f.user_id) ? 'Online' : 'Offline'}</p>
                </div>
                {unreadByUser[f.user_id] > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--error)] text-white">
                    {unreadByUser[f.user_id]}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Expanded thread */}
      {active && (
        <div className="absolute inset-0 bg-[var(--bg-surface)] flex flex-col">
          {/* Header */}
          <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <button onClick={() => setActive(null)} className="p-1 hover:bg-[var(--bg-inset)] rounded">←</button>
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-inset)] flex-shrink-0">
              {active.profile_image
                ? <img src={active.profile_image} alt={active.name} className="w-full h-full object-cover" />
                : <span className="flex items-center justify-center h-full font-semibold text-xs">{active.name.charAt(0)}</span>
              }
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{active.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{active.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (<p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>) : null}
            {messages.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>Say hi to {active.name} 👋</p>
            ) : messages.map(m => {
              const mine = m.sender_id === userId
              return (
                <div key={m.message_id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-2 px-3 rounded-lg text-xs ${mine ? 'rounded-br-sm' : 'rounded-bl-sm'} ${mine ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-inset)]'}`}>
                    {m.content}
                    <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-[var(--text-tertiary)]'} text-right`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder={`Message ${active.name}…`}
                className="flex-1 px-3 py-2 text-sm rounded-lg border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="p-2 px-4 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'var(--primary)', color: 'white', opacity: draft.trim() ? 1 : 0.5 }}
              >
                {isSending ? '…' : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
