'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, X, Send, Loader2, Search } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface OtherUser {
  user_id: number
  name: string
  profile_image: string | null
  role: string
}

interface Conversation {
  other_user: OtherUser
  last_message: string
  last_message_at: string
  unread: number
}

interface MsgRow {
  message_id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  is_read: boolean
}

export function MessageWidget({ userId, role }: { userId: number | null; role?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<OtherUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())
  const [typingUserId, setTypingUserId] = useState<number | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConvRef = useRef<Conversation | null>(null)

  const loadConversations = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = (await res.json()).conversations ?? []
        setConversations(data)
        setUnreadTotal(data.reduce((sum: number, c: Conversation) => sum + (c.unread || 0), 0))
      }
    } catch { /* noop */ }
  }, [userId])

  useEffect(() => { if (userId) { loadConversations().finally(() => setLoading(false)) } }, [userId, loadConversations])

  // Realtime: new messages + typing + presence (scoped to current user only)
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`msg-widget:${userId}`, { config: { presence: { key: String(userId) } } })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        (payload) => {
          const msg = payload.new as MsgRow
          setUnreadTotal(t => t + 1)
          if (activeConvRef.current && msg.sender_id === activeConvRef.current.other_user.user_id) {
            fetch(`/api/messages/${msg.sender_id}`, { method: 'PATCH' })
            setMessages(prev => prev.some(m => m.message_id === msg.message_id) ? prev : [...prev, msg])
          }
          loadConversations()
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        () => loadConversations())
      .on('broadcast', { event: 'typing' }, (payload) => {
        const p = payload.payload as { userId: number; isTyping: boolean }
        if (p.userId === activeConvRef.current?.other_user.user_id) {
          setTypingUserId(p.isTyping ? p.userId : null)
          if (typingTimer.current) clearTimeout(typingTimer.current)
          if (p.isTyping) typingTimer.current = setTimeout(() => setTypingUserId(null), 4000)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const ids = new Set<number>()
        for (const key of Object.keys(state)) {
          const meta = (state[key][0] as { userId?: number }) ?? {}
          if (meta.userId) ids.add(meta.userId)
        }
        setOnlineUsers(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, online_at: new Date().toISOString() })
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, loadConversations])

  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv)
    activeConvRef.current = conv
    setMessages([])
    setSearch('')
    setSearchResults([])
    const res = await fetch(`/api/messages/${conv.other_user.user_id}`)
    if (res.ok) {
      const data = (await res.json())
      setMessages(data.messages ?? [])
      setUnreadTotal(t => Math.max(0, t - (conv.unread || 0)))
    }
    fetch(`/api/messages/${conv.other_user.user_id}`, { method: 'PATCH' })
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!draft.trim() || !activeConv || !userId) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeConv.other_user.user_id, content: draft.trim() }),
      })
      if (res.ok) {
        setDraft('')
        const data = (await res.json())
        if (data.message) setMessages(prev => [...prev, data.message as MsgRow])
      }
    } catch { /* noop */ }
    finally { setSending(false) }
  }, [draft, activeConv, userId])

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setSearchResults([]); return }
    const res = await fetch(`/api/messages/search?query=${encodeURIComponent(q.trim())}`)
    if (res.ok) setSearchResults((await res.json()).users ?? [])
  }, [])

  const startNew = useCallback((user: OtherUser) => {
    const conv: Conversation = {
      other_user: user,
      last_message: '', last_message_at: new Date().toISOString(), unread: 0,
    }
    openConversation(conv)
  }, [openConversation])

  if (!userId) return null

  const filtered = conversations.filter(c =>
    c.other_user.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Messages${unreadTotal > 0 ? `, ${unreadTotal} unread` : ''}`}
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer', transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        <MessageSquare size={16} />
        {unreadTotal > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8,
            background: 'var(--primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            border: '2px solid var(--bg-surface)',
          }}>
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Messages"
            style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              width: 'min(360px, calc(100vw - 32px))',
              height: 'min(520px, calc(100dvh - 80px))',
              background: 'var(--bg-elevated)', borderRadius: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border)',
              zIndex: 50, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Messages{unreadTotal > 0 ? ` · ${unreadTotal}` : ''}
              </h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { setActiveConv(null); setSearch(''); setSearchResults([]) }}
                  title={activeConv ? 'Back to chats' : 'New message'}
                  style={{ padding: 6, borderRadius: 8, border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
                >
                  {activeConv ? <MessageSquare size={16} /> : <MessageSquare size={16} />}
                </button>
                <button onClick={() => setOpen(false)} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat thread view */}
            {activeConv ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  {activeConv.other_user.profile_image ? (
                    <img src={activeConv.other_user.profile_image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                      {activeConv.other_user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeConv.other_user.name}
                      {onlineUsers.has(activeConv.other_user.user_id) && (
                        <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--success)' }}>● online</span>
                      )}
                    </p>
                    {typingUserId === activeConv.other_user.user_id && (
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>typing…</p>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
                      <MessageSquare size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '0.8rem' }}>No messages yet — say hello!</p>
                    </div>
                  ) : messages.map((m) => {
                    const isMe = m.sender_id === userId
                    return (
                      <div key={m.message_id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                          fontSize: '0.82rem', lineHeight: 1.4,
                          background: isMe ? 'var(--primary)' : 'var(--bg-surface)',
                          color: isMe ? '#fff' : 'var(--text-primary)',
                          border: isMe ? 'none' : '1px solid var(--border-subtle)',
                          borderBottomRightRadius: isMe ? 2 : 12,
                          borderBottomLeftRadius: isMe ? 12 : 2,
                        }}>
                          <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
                          <p style={{ fontSize: '0.6rem', marginTop: 3, opacity: 0.7, textAlign: 'right' }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: 10, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: 8 }}>
                  <input
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value)
                      supabase.channel(`msg-widget:${userId}`).send({
                        type: 'broadcast', event: 'typing',
                        payload: { userId, isTyping: e.target.value.length > 0 },
                      })
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message…"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: '0.82rem', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button onClick={handleSend} disabled={sending || !draft.trim()} style={{ padding: '0 12px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Search / new */}
                <div style={{ padding: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-base)', borderRadius: 10, padding: '0 10px', border: '1px solid var(--border)' }}>
                    <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search or start new chat…"
                      style={{ flex: 1, padding: '9px 0', fontSize: '0.82rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  {searchResults.map((u) => (
                    <button key={u.user_id} onClick={() => startNew(u)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px', marginTop: 6, borderRadius: 8, border: 'none', background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{u.name}</span>
                    </button>
                  ))}
                </div>

                {/* Conversation list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 className="animate-spin" size={22} style={{ color: 'var(--primary)' }} />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 1rem' }}>
                      <MessageSquare size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '0.8rem' }}>No conversations yet</p>
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.other_user.user_id}
                        onClick={() => openConversation(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ position: 'relative' }}>
                          {c.other_user.profile_image ? (
                            <img src={c.other_user.profile_image} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{c.other_user.name.charAt(0).toUpperCase()}</div>
                          )}
                          {onlineUsers.has(c.other_user.user_id) && (
                            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-elevated)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.other_user.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.last_message || 'No messages yet'}
                          </p>
                        </div>
                        {c.unread > 0 && (
                          <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: 'var(--primary)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{c.unread}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <button onClick={() => router.push('/inbox')} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Open full inbox
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
