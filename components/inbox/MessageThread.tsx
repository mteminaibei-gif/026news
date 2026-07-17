'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Send, ArrowLeft, MessageSquare, Loader2, Check, CheckCheck, Copy, Trash2 } from 'lucide-react'

interface UserProfile {
  user_id: number; name: string; role: string; profile_image: string | null
}

interface Conversation {
  other_user: UserProfile; last_message: string; last_message_at: string; unread: number
}

interface Message {
  message_id: number; sender_id: number; receiver_id: number; content: string; created_at: string; is_read: boolean
}

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  conversation: Conversation
  currentUserId: number
  isOnline: boolean
  isTyping: boolean
  onBack: () => void
  onTyping?: (isTyping: boolean) => void
}

export function MessageThread({ conversation, currentUserId, isOnline, isTyping, onBack, onTyping }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const typingSentRef = useRef(false)
  const selectedUserId = conversation.other_user.user_id

  // Load messages
  useEffect(() => {
    setMessages([])
    ;(async () => {
      try {
        const res = await fetch(`/api/messages/${selectedUserId}`)
        if (res.ok) setMessages((await res.json()).messages ?? [])
      } catch { setMessages([]) }
    })()
  }, [selectedUserId])

  // Mark as read
  useEffect(() => {
    fetch(`/api/messages/${selectedUserId}`, { method: 'PATCH' })
  }, [selectedUserId])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input
  useEffect(() => {
    messageInputRef.current?.focus()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (!typingSentRef.current && e.target.value.trim()) {
      typingSentRef.current = true
      onTyping?.(true)
      setTimeout(() => { typingSentRef.current = false }, 2500)
    }
  }, [onTyping])

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    onTyping?.(false)
    typingSentRef.current = false

    const optimisticId = -(Date.now() + Math.random())
    const optimistic: Message = {
      message_id: optimisticId, sender_id: currentUserId, receiver_id: selectedUserId,
      content, created_at: new Date().toISOString(), is_read: false,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUserId, content }),
      })
      if (!res.ok) throw new Error('Failed')
      const reload = await fetch(`/api/messages/${selectedUserId}`)
      if (reload.ok) setMessages((await reload.json()).messages ?? [])
    } catch {
      setMessages(prev => prev.filter(m => m.message_id !== optimisticId))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: number) {
    if (id < 0) { setMessages(prev => prev.filter(m => m.message_id !== id)); return }
    setDeletingId(id)
    try {
      await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.message_id !== id))
    } catch {
      // keep message on failure
    } finally {
      setDeletingId(null)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const other = conversation.other_user

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative' }}>
      {/* Thread header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 60 }}>
        <button onClick={onBack} className="inbox-back-btn" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }} aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <div style={{ position: 'relative' }}>
          {other.profile_image ? (
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Image src={other.profile_image} alt={other.name} fill style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {getInitials(other.name)}
            </div>
          )}
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--text-muted)', border: '2px solid var(--bg-surface)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{other.name}</div>
          <div style={{ fontSize: '0.7rem', color: isOnline ? 'var(--success)' : 'var(--text-tertiary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isTyping ? <span style={{ color: 'var(--primary)' }} className="typing-dots">typing…</span> : isOnline ? 'Active now' : other.role}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && !isTyping && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {other.profile_image ? (
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', marginBottom: 4 }}>
                <Image src={other.profile_image} alt={other.name} fill style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {getInitials(other.name)}
              </div>
            )}
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{other.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{other.role}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const showTimestamp = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300_000
          const isOptimistic = msg.message_id < 0
          return (
            <div key={msg.message_id} className="msg-fade-in">
              {showTimestamp && (
                <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div
                style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2, position: 'relative' }}
                onMouseEnter={() => setHoveredId(msg.message_id)}
                onMouseLeave={() => setHoveredId(h => h === msg.message_id ? null : h)}
              >
                <div className="message-bubble-group" style={{ maxWidth: '65%', position: 'relative' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, background: isMe ? 'var(--primary)' : 'var(--bg-surface)', color: isMe ? '#fff' : 'var(--text-primary)', border: isMe ? 'none' : '1px solid var(--border-subtle)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', wordBreak: 'break-word', opacity: isOptimistic ? 0.6 : 1 }}>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                  </div>
                  <div className="message-timestamp" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start', opacity: hoveredId === msg.message_id ? 1 : 0, transition: 'opacity 0.2s' }}>
                    {formatBubbleTime(msg.created_at)}
                    {isMe && (msg.is_read ? <CheckCheck size={12} style={{ color: 'var(--primary)' }} /> : <Check size={12} style={{ color: 'var(--text-muted)' }} />)}
                  </div>

                  {/* Hover actions */}
                  {hoveredId === msg.message_id && !isOptimistic && (
                    <div style={{ position: 'absolute', top: -14, [isMe ? 'left' : 'right']: 0, display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                      <button onClick={() => handleCopy(msg.content)} aria-label="Copy message" style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Copy size={13} />
                      </button>
                      <button onClick={() => handleDelete(msg.message_id)} disabled={deletingId === msg.message_id} aria-label="Delete message" style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
                        {deletingId === msg.message_id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="msg-fade-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className="typing-dot" /><span className="typing-dot" style={{ animationDelay: '0.15s' }} /><span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <input ref={messageInputRef} type="text" value={newMessage} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Aa" aria-label="Type a message"
          style={{ flex: 1, padding: '12px 16px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        <button onClick={handleSend} disabled={sending || !newMessage.trim()}
          style={{ width: 42, height: 42, borderRadius: '50%', background: newMessage.trim() && !sending ? 'var(--primary)' : 'var(--bg-inset)', color: newMessage.trim() && !sending ? '#fff' : 'var(--text-muted)', border: 'none', cursor: newMessage.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
          aria-label="Send message">
          {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>

      <style>{`
        .message-bubble-group:hover .message-timestamp { opacity: 1 !important; }
        .msg-fade-in { animation: msgIn 0.28s ease-out; }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .typing-dot { width: 6px; height: 6px; borderRadius: 50%; background: var(--text-muted); animation: typingBounce 1.2s infinite ease-in-out; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
        .typing-dots::after { content: ''; }
        @media (max-width: 768px) { .inbox-back-btn { display: flex !important; } }
      `}</style>
    </div>
  )
}
