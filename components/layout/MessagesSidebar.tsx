'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { MessageSquare, X, Send, Search } from 'lucide-react'

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

function timeShort(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export function MessagesSidebar() {
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const { onlineUsers } = useRealtime()
  const myId = profile?.user_id ?? 0

  const [expanded, setExpanded] = useState(false)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [active, setActive] = useState<Follower | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [draft, setDraft] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [unreadByUser, setUnreadByUser] = useState<Record<number, number>>({})
  const endRef = useRef<HTMLDivElement>(null)

  const onlineIds = new Set(onlineUsers.map(o => o.user_id))
  const onlineFollowers = followers.filter(f => onlineIds.has(f.user_id))

  const loadFollowers = useCallback(async () => {
    if (!myId) return
    const res = await fetch('/api/follow?mode=followers')
    if (res.ok) {
      const { followers: f } = await res.json()
      setFollowers(f ?? [])
    }
  }, [myId])

  useEffect(() => { loadFollowers() }, [loadFollowers])

  // Realtime: refresh follower online state is handled by onlineUsers;
  // also poll every 20s in case presence churns.
  useEffect(() => {
    if (!myId) return
    const t = setInterval(loadFollowers, 20000)
    return () => clearInterval(t)
  }, [loadFollowers, myId])

  const loadThread = useCallback(async (other: Follower) => {
    if (!myId) return
    setLoadingMsgs(true)
    setActive(other)
    setExpanded(true)
    try {
      const res = await fetch(`/api/messages/${other.user_id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
      await fetch(`/api/messages/${other.user_id}`, { method: 'PATCH' })
      setUnreadByUser(prev => ({ ...prev, [other.user_id]: 0 }))
    } finally { setLoadingMsgs(false) }
  }, [myId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, active])

  // Track unread counts per conversation from the messages list endpoint.
  useEffect(() => {
    if (!myId || followers.length === 0) return
    let cancelled = false
    ;(async () => {
      const map: Record<number, number> = {}
      await Promise.all(followers.map(async (f) => {
        try {
          const res = await fetch(`/api/messages/${f.user_id}`)
          if (res.ok) {
            const data = await res.json()
            const msgs: MsgRow[] = data.messages ?? []
            map[f.user_id] = msgs.filter(m => m.sender_id === f.user_id && !m.is_read).length
          }
        } catch {}
      }))
      if (!cancelled) setUnreadByUser(map)
    })()
    return () => { cancelled = true }
  }, [myId, followers])

  const handleSend = useCallback(async () => {
    if (!draft.trim() || !active || !myId) return
    const content = draft.trim()
    setDraft('')
    // optimistic
    const temp: MsgRow = {
      message_id: -Date.now(), sender_id: myId, receiver_id: active.user_id,
      content, is_read: true, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, temp])
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: active.user_id, content }),
      })
    } catch {}
  }, [draft, active, myId])

  if (!user || !profile) return null

  const filtered = followers.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = Object.values(unreadByUser).reduce((a, b) => a + b, 0)

  return (
    <div className="hidden lg:flex" style={{ position: 'fixed', right: 0, top: 72, bottom: 0, zIndex: 45, alignItems: 'flex-end' }}>
      {/* Collapsed rail — online follower avatars */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Open messages"
          className="hover-lift"
          style={{
            position: 'absolute', right: 12, top: 12,
            width: 48, height: 48, borderRadius: 14,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', cursor: 'pointer', boxShadow: 'var(--card-shadow)',
          }}
        >
          <MessageSquare size={20} />
          {totalUnread > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--error)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--bg-surface)' }}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Online followers mini-rail (visible even when collapsed) */}
      {!expanded && onlineFollowers.length > 0 && (
        <div style={{ position: 'absolute', right: 12, top: 72, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onlineFollowers.slice(0, 8).map(f => (
            <button
              key={f.user_id}
              onClick={() => loadThread(f)}
              title={`${f.name} · online`}
              style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--success)', cursor: 'pointer', background: 'var(--bg-surface)', padding: 0 }}
            >
              {f.profile_image
                ? <img src={f.profile_image} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 700, color: 'var(--text-primary)' }}>{f.name.charAt(0).toUpperCase()}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div
          style={{
            position: 'absolute', right: 12, top: 12, bottom: 12, width: 'min(340px, calc(100vw - 32px))',
            background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Messages</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                {onlineFollowers.length} follower{onlineFollowers.length === 1 ? '' : 's'} online
              </p>
            </div>
            <button onClick={() => { setExpanded(false); setActive(null) }} aria-label="Collapse" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-muted)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          {!active ? (
            <>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-muted)', borderRadius: 10, padding: '2px 8px' }}>
                  <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search followers" style={{ flex: 1, border: 'none', background: 'transparent', padding: '8px 4px', fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: 24 }}>No followers to message yet.</p>
                ) : (
                  filtered.map(f => (
                    <button
                      key={f.user_id}
                      onClick={() => loadThread(f)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-muted)' }}>
                        {f.profile_image
                          ? <img src={f.profile_image} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 700, color: 'var(--text-primary)' }}>{f.name.charAt(0).toUpperCase()}</span>}
                        {onlineIds.has(f.user_id) && (
                          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{f.name}</p>
                        <p style={{ fontSize: '0.7rem', color: onlineIds.has(f.user_id) ? 'var(--success)' : 'var(--text-tertiary)' }}>
                          {onlineIds.has(f.user_id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      {unreadByUser[f.user_id] > 0 && (
                        <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--error)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                          {unreadByUser[f.user_id]}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Thread header */}
              <button onClick={() => setActive(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-muted)' }}>
                  {active.profile_image
                    ? <img src={active.profile_image} alt={active.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 700, color: 'var(--text-primary)' }}>{active.name.charAt(0).toUpperCase()}</span>}
                  {onlineIds.has(active.user_id) && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">{active.name}</p>
                  <p style={{ fontSize: '0.7rem', color: onlineIds.has(active.user_id) ? 'var(--success)' : 'var(--text-tertiary)' }}>{onlineIds.has(active.user_id) ? 'Online' : 'Offline'}</p>
                </div>
              </button>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Loading…</p>
                ) : messages.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Say hi to {active.name} 👋</p>
                ) : (
                  messages.map(m => {
                    const mine = m.sender_id === myId
                    return (
                      <div key={m.message_id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '78%', padding: '8px 12px', borderRadius: 14,
                          fontSize: '0.8rem', lineHeight: 1.4,
                          color: mine ? '#fff' : 'var(--text-primary)',
                          background: mine ? 'var(--primary)' : 'var(--bg-muted)',
                          borderBottomRightRadius: mine ? 4 : 14,
                          borderBottomLeftRadius: mine ? 14 : 4,
                        }}>
                          {m.content}
                          <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: 2, textAlign: 'right' }}>{timeShort(m.created_at)}</div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--border-subtle)' }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                  placeholder={`Message ${active.name.split(' ')[0]}…`}
                  style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: '0.82rem', color: 'var(--text-primary)', background: 'var(--bg-base)', outline: 'none' }}
                />
                <button onClick={handleSend} disabled={!draft.trim()} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: draft.trim() ? 1 : 0.5 }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
