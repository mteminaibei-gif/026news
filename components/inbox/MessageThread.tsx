'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Send, ArrowLeft, Loader2, Check, CheckCheck, Copy, Trash2, Paperclip, Smile } from 'lucide-react'

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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const typingSentRef = useRef(false)
  const selectedUserId = conversation.other_user.user_id
  const isInitialLoad = useRef(true)

  // Load messages
  useEffect(() => {
    setMessages([])
    isInitialLoad.current = true
    ;(async () => {
      try {
        const res = await fetch(`/api/messages/${selectedUserId}`)
        if (res.ok) {
          const data = (await res.json()).messages ?? []
          setMessages(data)
          // Scroll to center of conversation
          requestAnimationFrame(() => {
            const el = messagesContainerRef.current
            if (el) {
              const center = (el.scrollHeight - el.clientHeight) / 2
              el.scrollTop = center > 0 ? center : 0
            }
            isInitialLoad.current = false
          })
        }
      } catch { setMessages([]) }
    })()
  }, [selectedUserId])

  // Mark as read
  useEffect(() => {
    fetch(`/api/messages/${selectedUserId}`, { method: 'PATCH' })
  }, [selectedUserId])

  // Track scroll position
  const handleScroll = useCallback(() => {}, [])

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
    <div className="msg-thread">
      {/* Thread header */}
      <div className="msg-thread-header">
        <button onClick={onBack} className="msg-back-btn" aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <div className="msg-header-avatar">
          {other.profile_image ? (
            <div className="inbox-avatar-wrap">
              <Image src={other.profile_image} alt={other.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" />
            </div>
          ) : (
            <div className="inbox-avatar initials header">
              {getInitials(other.name)}
            </div>
          )}
          {isOnline && <span className="inbox-online-dot" />}
        </div>
        <div className="msg-header-info">
          <div className="msg-header-name">{other.name}</div>
          <div className={`msg-header-status ${isOnline ? 'online' : ''}`}>
            {isTyping ? (
              <span className="typing-text">typing...</span>
            ) : isOnline ? (
              'Active now'
            ) : (
              other.role
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="msg-messages-area" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.length === 0 && !isTyping ? (
          <div className="msg-empty-state">
            {other.profile_image ? (
              <div className="inbox-avatar-wrap large">
                <Image src={other.profile_image} alt={other.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" />
              </div>
            ) : (
              <div className="inbox-avatar initials large">
                {getInitials(other.name)}
              </div>
            )}
            <p className="msg-empty-name">{other.name}</p>
            <p className="msg-empty-role">{other.role}</p>
            <p className="msg-empty-hint">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="msg-messages-list">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const showTimestamp = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300_000
              const isOptimistic = msg.message_id < 0
              return (
                <div key={msg.message_id} className="msg-fade-in">
                  {showTimestamp && (
                    <div className="msg-date-divider">
                      <span>{new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div
                    className={`msg-row ${isMe ? 'me' : 'them'}`}
                    onMouseEnter={() => setHoveredId(msg.message_id)}
                    onMouseLeave={() => setHoveredId(h => h === msg.message_id ? null : h)}
                  >
                    <div className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                      <div className={`msg-bubble ${isMe ? 'me' : 'them'} ${isOptimistic ? 'optimistic' : ''}`}>
                        <p className="msg-text">{msg.content}</p>
                        <span className="msg-meta">
                          <span className="msg-time">{formatBubbleTime(msg.created_at)}</span>
                          {isMe && (
                            msg.is_read
                              ? <CheckCheck size={14} className="msg-check read" />
                              : <Check size={14} className="msg-check" />
                          )}
                        </span>
                      </div>
                      {hoveredId === msg.message_id && !isOptimistic && (
                        <div className="msg-actions">
                          <button onClick={() => handleCopy(msg.content)} className="msg-action-btn" aria-label="Copy message">
                            <Copy size={13} />
                          </button>
                          {isMe && (
                            <button onClick={() => handleDelete(msg.message_id)} disabled={deletingId === msg.message_id} className="msg-action-btn danger" aria-label="Delete message">
                              {deletingId === msg.message_id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="msg-fade-in">
                <div className="msg-row them">
                  <div className="msg-bubble-wrap them">
                    <div className="msg-bubble them typing-bubble">
                      <div className="typing-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="msg-input-area">
        <div className="msg-input-container">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            aria-label="Type a message"
            className="msg-input"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className={`msg-send-btn ${newMessage.trim() && !sending ? 'active' : ''}`}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
