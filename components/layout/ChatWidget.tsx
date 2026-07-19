'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { MessageSquare, X, Send, ArrowLeft, Search } from 'lucide-react'

interface Conversation {
  other_user: { user_id: number; name: string; profile_image: string | null; role: string }
  last_message: string
  last_message_at: string
  unread: number
}

interface Message {
  message_id: number
  sender_id: number
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
}

interface PopMessage {
  message_id: number
  sender_id: number
  sender_name: string
  sender_image: string | null
  content: string
}

export function ChatWidget() {
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)
  const myId = profile?.user_id ?? 0

  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [pop, setPop] = useState<PopMessage | null>(null)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchConvRef = useRef<() => void>(() => {})

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!myId) return
    try {
      const res = await fetch('/api/messages')
      if (!res.ok) return
      const data = await res.json()
      const convos = data.conversations || []
      setConversations(convos)
      setUnreadTotal(convos.reduce((s: number, c: Conversation) => s + (c.unread || 0), 0))
    } catch {}
  }, [myId])

  fetchConvRef.current = fetchConversations

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (otherUserId: number) => {
    if (!myId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/messages/${otherUserId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {} finally {
      setLoading(false)
    }
  }, [myId])

  // Refs so the realtime subscription can read the latest state without resubscribing
  const activeConvoRef = useRef<Conversation | null>(null)
  const fetchUsersMap = useRef<Record<number, { name: string; profile_image: string | null }>>({})
  useEffect(() => { activeConvoRef.current = activeConvo }, [activeConvo])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!activeConvo || !newMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeConvo.other_user.user_id, content: newMsg.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages(prev => [...prev, data.message])
          setConversations(prev => prev.map(c =>
            c.other_user.user_id === activeConvo.other_user.user_id
              ? { ...c, last_message: newMsg.trim(), last_message_at: new Date().toISOString() }
              : c
          ))
        }
        setNewMsg('')
      }
    } catch {} finally {
      setSending(false)
    }
  }, [activeConvo, newMsg, sending])

  // Open conversation
  const openConversation = useCallback(async (convo: Conversation) => {
    setActiveConvo(convo)
    setConversations(prev => prev.map(c =>
      c.other_user.user_id === convo.other_user.user_id ? { ...c, unread: 0 } : c
    ))
    setUnreadTotal(t => Math.max(0, t - (convo.unread || 0)))
    await fetchMessages(convo.other_user.user_id)
  }, [fetchMessages])

  const showPop = useCallback((msg: PopMessage) => {
    setPop(msg)
    if (popTimer.current) clearTimeout(popTimer.current)
    popTimer.current = setTimeout(() => setPop(null), 8000)
  }, [])

  const dismissPop = useCallback(() => {
    setPop(null)
    if (popTimer.current) clearTimeout(popTimer.current)
  }, [])

  const openFromPop = useCallback((senderId: number) => {
    dismissPop()
    setOpen(true)
    const existing = conversations.find(c => c.other_user.user_id === senderId)
    if (existing) {
      openConversation(existing)
    } else {
      fetchConversations()
    }
  }, [conversations, dismissPop, openConversation, fetchConversations])

  // Initial load
  useEffect(() => { fetchConversations() }, [fetchConversations])

  // Poll for new conversations
  useEffect(() => {
    if (!myId) return
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations, myId])

  // Realtime for new messages.
  // The channel topic is UNIQUE per effect run so Supabase never returns a
  // cached, already-subscribed channel (which would make .on() throw
  // "cannot add postgres_changes callbacks ... after subscribe()"). This is
  // safe under React Strict Mode double-invocation because each run gets a
  // distinct topic and cleans up its own channel.
  useEffect(() => {
    if (!myId) return
    const topic = `chat-widget-${myId}-${Math.random().toString(36).slice(2, 10)}`
    const channel = supabase
      .channel(topic)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` }, async (payload) => {
        const msg = payload.new as Message
        fetchConvRef.current()
        if (msg.sender_id === myId) return
        // Look up sender display info
        let sender = fetchUsersMap.current[msg.sender_id]
        if (!sender) {
          const { data } = await supabase.from('users').select('name, profile_image').eq('user_id', msg.sender_id).single()
          sender = (data as { name: string; profile_image: string | null } | null) || { name: 'Someone', profile_image: null }
          fetchUsersMap.current[msg.sender_id] = sender
        }
        if (activeConvoRef.current && activeConvoRef.current.other_user.user_id === msg.sender_id) {
          setMessages(prev => [...prev, msg])
        } else {
          showPop({
            message_id: msg.message_id,
            sender_id: msg.sender_id,
            sender_name: sender.name,
            sender_image: sender.profile_image,
            content: msg.content,
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, supabase, showPop])

  // Scroll to bottom
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!myId) return null

  const filtered = conversations.filter(c =>
    !search || c.other_user.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* New-message popover — only appears on incoming message */}
      {pop && !open && (
        <div
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            width: 'min(320px, calc(100vw - 40px))',
            background: 'var(--bg-surface, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 14,
            boxShadow: '0 16px 50px rgba(0,0,0,0.22)',
            padding: 12,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'var(--primary-light, #eef2ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', fontSize: 14, fontWeight: 700, color: 'var(--primary, #6366f1)',
          }}>
            {pop.sender_image ? (
              <img src={pop.sender_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              pop.sender_name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary, #111)' }}>
              New message from {pop.sender_name}
            </p>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary, #4b5563)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pop.content}
            </p>
            <button
              onClick={() => openFromPop(pop.sender_id)}
              style={{
                marginTop: 8, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--primary, #6366f1)', color: '#fff', fontSize: 12, fontWeight: 600,
              }}
            >
              Open chat
            </button>
          </div>
          <button
            onClick={dismissPop}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary, #9ca3af)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating unread launcher — only visible when there are unread messages */}
      {!open && unreadTotal > 0 && (
        <button
          onClick={() => { setOpen(true); fetchConversations() }}
          style={{
            position: 'fixed', bottom: 20, left: 20, zIndex: 9998,
            height: 44, padding: '0 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--primary), var(--accent, #7c3aed))',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}
          aria-label="Open messages"
        >
          <MessageSquare size={18} />
          {unreadTotal > 0 && (
            <span style={{
              minWidth: 20, height: 20, padding: '0 5px', borderRadius: '50%', background: '#ef4444',
              color: '#fff', fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unreadTotal > 9 ? '9+' : unreadTotal}</span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9997,
          width: 'min(360px, calc(100vw - 40px))', maxHeight: 520,
          background: 'var(--bg-surface, #fff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent, #7c3aed))',
            color: '#fff',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {activeConvo && (
              <button onClick={() => { setActiveConvo(null); setMessages([]) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                {activeConvo ? activeConvo.other_user.name : 'Messages'}
              </p>
              {activeConvo && (
                <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>
                  {activeConvo.other_user.role}
                </p>
              )}
            </div>
            {!activeConvo && unreadTotal > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(255,255,255,0.2)',
              }}>{unreadTotal} new</span>
            )}
            <button onClick={() => { setOpen(false); setActiveConvo(null); setMessages([]) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {!activeConvo ? (
              <>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: 'var(--bg-muted, #f3f4f6)' }}>
                    <Search size={14} style={{ color: 'var(--text-tertiary, #9ca3af)', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search people..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary, #111)' }}
                    />
                  </div>
                </div>
                {filtered.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary, #9ca3af)' }}>
                    <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>No conversations yet</p>
                    <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.7 }}>Start a chat from a profile page</p>
                  </div>
                ) : (
                  filtered.map(c => (
                    <button
                      key={c.other_user.user_id}
                      onClick={() => openConversation(c)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', border: 'none', borderBottom: '1px solid var(--border, #e5e7eb)',
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted, #f3f4f6)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--primary-light, #eef2ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--primary, #6366f1)',
                        overflow: 'hidden',
                      }}>
                        {c.other_user.profile_image ? (
                          <img src={c.other_user.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          c.other_user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #111)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.other_user.name}
                          </span>
                          {c.unread > 0 && (
                            <span style={{
                              width: 18, height: 18, borderRadius: '50%', background: 'var(--primary, #6366f1)',
                              color: '#fff', fontSize: 10, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>{c.unread}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary, #9ca3af)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.last_message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary, #9ca3af)' }}>
                      <p style={{ fontSize: 12 }}>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary, #9ca3af)' }}>
                      <p style={{ fontSize: 12 }}>No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMine = m.sender_id === myId
                      return (
                        <div key={m.message_id} style={{
                          display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}>
                          <div style={{
                            maxWidth: '78%', padding: '8px 12px', borderRadius: 12,
                            background: isMine ? 'var(--primary, #6366f1)' : 'var(--bg-muted, #f3f4f6)',
                            color: isMine ? '#fff' : 'var(--text-primary, #111)',
                            fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word',
                            borderBottomRightRadius: isMine ? 4 : 12,
                            borderBottomLeftRadius: isMine ? 12 : 4,
                          }}>
                            {m.content}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEnd} />
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--border, #e5e7eb)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-surface, #fff)',
                }}>
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border, #e5e7eb)',
                      background: 'var(--bg-muted, #f3f4f6)', outline: 'none', fontSize: 13,
                      color: 'var(--text-primary, #111)',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMsg.trim() || sending}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: newMsg.trim() ? 'var(--primary, #6366f1)' : 'var(--bg-muted, #f3f4f6)',
                      color: newMsg.trim() ? '#fff' : 'var(--text-tertiary, #9ca3af)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
