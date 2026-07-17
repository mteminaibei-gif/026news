'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Send, ArrowLeft, MessageSquare, Loader2, Check, CheckCheck } from 'lucide-react'

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
  onBack: () => void
}

export function MessageThread({ conversation, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const selectedUserId = conversation.other_user.user_id

  // Load messages
  useEffect(() => {
    (async () => {
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
  }, [messages])

  // Focus input
  useEffect(() => {
    messageInputRef.current?.focus()
  }, [])

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

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
      // Reload to get real IDs
      const reload = await fetch(`/api/messages/${selectedUserId}`)
      if (reload.ok) setMessages((await reload.json()).messages ?? [])
    } catch {
      setMessages(prev => prev.filter(m => m.message_id !== optimisticId))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
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
        {other.profile_image ? (
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <Image src={other.profile_image} alt={other.name} fill style={{ objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {getInitials(other.name)}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{other.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{other.role}</div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
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
          return (
            <div key={msg.message_id}>
              {showTimestamp && (
                <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                <div className="message-bubble-group" style={{ maxWidth: '65%', position: 'relative' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, background: isMe ? 'var(--primary)' : 'var(--bg-surface)', color: isMe ? '#fff' : 'var(--text-primary)', border: isMe ? 'none' : '1px solid var(--border-subtle)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', wordBreak: 'break-word' }}>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                  </div>
                  <div className="message-timestamp" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start', opacity: 0, transition: 'opacity 0.2s' }}>
                    {formatBubbleTime(msg.created_at)}
                    {isMe && (msg.is_read ? <CheckCheck size={12} style={{ color: 'var(--primary)' }} /> : <Check size={12} style={{ color: 'var(--text-muted)' }} />)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <input ref={messageInputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Aa" aria-label="Type a message"
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
        @media (max-width: 768px) { .inbox-back-btn { display: flex !important; } }
      `}</style>
    </div>
  )
}
