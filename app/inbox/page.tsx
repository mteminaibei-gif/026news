'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Send,
  Search,
  ArrowLeft,
  MessageSquare,
  Loader2,
  X,
  Check,
  CheckCheck,
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────
interface UserProfile {
  user_id: number
  name: string
  role: string
  profile_image: string | null
}

interface Conversation {
  other_user: UserProfile
  last_message: string
  last_message_at: string
  unread: number
}

interface Message {
  message_id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  is_read: boolean
}

interface SearchResult {
  user_id: number
  name: string
  profile_image: string | null
  role: string
  bio: string | null
}

// ── Helpers ────────────────────────────────────────────
function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Page Component ─────────────────────────────────────
export default function InboxPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showMobileThread, setShowMobileThread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // ── Auth & init ────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) {
        router.push('/login?redirect=/inbox')
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single()
      if (data) setCurrentUserId((data as { user_id: number }).user_id)
      setLoading(false)
    })()
  }, [router, supabase])

  // ── Load conversations ─────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return
    try {
      const res = await fetch('/api/messages')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations ?? [])
    } catch {
      setConversations([])
    }
  }, [currentUserId])

  useEffect(() => {
    if (currentUserId) loadConversations()
  }, [currentUserId, loadConversations])

  // ── Load messages for selected conversation ─────────
  const loadMessages = useCallback(async () => {
    if (!currentUserId || !selectedConv) return
    try {
      const res = await fetch(`/api/messages/${selectedConv.other_user.user_id}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])

      // Mark as read
      await fetch(`/api/messages/${selectedConv.other_user.user_id}`, {
        method: 'PATCH',
      })

      // Update conversation unread count locally
      setConversations(prev =>
        prev.map(c =>
          c.other_user.user_id === selectedConv.other_user.user_id
            ? { ...c, unread: 0 }
            : c
        )
      )
    } catch {
      setMessages([])
    }
  }, [currentUserId, selectedConv])

  useEffect(() => {
    if (currentUserId && selectedConv) loadMessages()
  }, [selectedConv, currentUserId, loadMessages])

  // ── Auto-scroll ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus search input when opened ─────────────────
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  // ── Focus message input when conversation selected ──
  useEffect(() => {
    if (selectedConv) messageInputRef.current?.focus()
  }, [selectedConv])

  // ── User search ────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `/api/messages/search?query=${encodeURIComponent(searchQuery.trim())}`
        )
        if (!res.ok) return
        const data = await res.json()
        setSearchResults(data.users ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Send message ───────────────────────────────────
  async function handleSend() {
    if (!newMessage.trim() || !currentUserId || !selectedConv || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic append
    const optimistic: Message = {
      message_id: Date.now(),
      sender_id: currentUserId,
      receiver_id: selectedConv.other_user.user_id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConv.other_user.user_id,
          content,
        }),
      })
      if (!res.ok) throw new Error('Failed')

      // Reload to get real ID
      loadMessages()
      loadConversations()
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.message_id !== optimistic.message_id))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  // ── Start conversation from search result ──────────
  function startConversation(user: SearchResult) {
    const conv: Conversation = {
      other_user: {
        user_id: user.user_id,
        name: user.name,
        profile_image: user.profile_image,
        role: user.role,
      },
      last_message: '',
      last_message_at: new Date().toISOString(),
      unread: 0,
    }
    setSelectedConv(conv)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setShowMobileThread(true)
  }

  // ── Select existing conversation ───────────────────
  function selectConversation(conv: Conversation) {
    setSelectedConv(conv)
    setShowMobileThread(true)
  }

  // ── Real-time subscription ─────────────────────────
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          // If in the active conversation, append to messages
          if (
            selectedConv &&
            msg.sender_id === selectedConv.other_user.user_id
          ) {
            setMessages(prev => {
              if (prev.some(m => m.message_id === msg.message_id)) return prev
              return [...prev, msg]
            })
            // Mark as read immediately
            fetch(`/api/messages/${msg.sender_id}`, { method: 'PATCH' })
          }
          // Refresh conversations list
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, selectedConv, supabase, loadConversations])

  // ── Keyboard shortcuts ─────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-base)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2
          className="animate-spin"
          size={32}
          style={{ color: 'var(--primary)' }}
        />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────
  return (
    <div
      style={{
        background: 'var(--bg-base)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          height: 'calc(100vh - 60px)',
          display: 'flex',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* ═══════ LEFT SIDEBAR ═══════ */}
        <div
          style={{
            width: 360,
            minWidth: 360,
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 60,
            }}
          >
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Chats
            </h1>
            <button
              onClick={() => setShowSearch(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--bg-inset)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                transition: 'background 0.2s',
              }}
              title="Search users"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Search overlay */}
          {showSearch && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 360,
                height: '100%',
                background: 'var(--bg-surface)',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                  }}
                >
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search people..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-inset)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSearchResults([])
                        searchInputRef.current?.focus()
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--bg-muted)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {searching && (
                  <div
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <Loader2
                      className="animate-spin"
                      size={24}
                      style={{ margin: '0 auto', display: 'block', color: 'var(--primary)' }}
                    />
                  </div>
                )}
                {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    No users found
                  </div>
                )}
                {searchResults.map(user => (
                  <div
                    key={user.user_id}
                    onClick={() => startConversation(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = 'var(--bg-inset)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    {user.profile_image ? (
                      <div
                        style={{
                          position: 'relative',
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={user.profile_image}
                          alt={user.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.role}
                      </div>
                    </div>
                  </div>
                ))}
                {!searching && searchQuery.length < 2 && (
                  <div
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '0.82rem',
                    }}
                  >
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '64px 24px',
                }}
              >
                <MessageSquare
                  size={48}
                  style={{
                    color: 'var(--text-tertiary)',
                    margin: '0 auto 16px',
                    display: 'block',
                    opacity: 0.3,
                  }}
                />
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  No conversations yet
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Tap the search icon to start chatting
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive =
                  selectedConv?.other_user.user_id === conv.other_user.user_id
                return (
                  <div
                    key={conv.other_user.user_id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: isActive
                        ? 'var(--primary-light)'
                        : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive)
                        e.currentTarget.style.background = 'var(--bg-inset)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive)
                        e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Avatar */}
                    {conv.other_user.profile_image ? (
                      <div
                        style={{
                          position: 'relative',
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={conv.other_user.profile_image}
                          alt={conv.other_user.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 1,
                            right: 1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: 'var(--success)',
                            border: '2px solid var(--bg-surface)',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: isActive
                            ? 'var(--primary)'
                            : 'var(--bg-inset)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(conv.other_user.name)}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: conv.unread > 0 ? 700 : 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.other_user.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color:
                              conv.unread > 0
                                ? 'var(--primary)'
                                : 'var(--text-muted)',
                            flexShrink: 0,
                            marginLeft: 8,
                            fontWeight: conv.unread > 0 ? 600 : 400,
                          }}
                        >
                          {conv.last_message_at
                            ? formatMessageTime(conv.last_message_at)
                            : ''}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color:
                              conv.unread > 0
                                ? 'var(--text-primary)'
                                : 'var(--text-tertiary)',
                            fontWeight: conv.unread > 0 ? 600 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {conv.last_message || 'Start a conversation'}
                        </p>
                        {conv.unread > 0 && (
                          <span
                            style={{
                              minWidth: 20,
                              height: 20,
                              borderRadius: 10,
                              background: 'var(--primary)',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 6px',
                              flexShrink: 0,
                            }}
                          >
                            {conv.unread > 99 ? '99+' : conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ═══════ RIGHT PANEL — Message Thread ═══════ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-base)',
            position: 'relative',
          }}
        >
          {!selectedConv ? (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={36} style={{ color: 'var(--primary)' }} />
              </div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Your Messages
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                Send private messages to a friend or journalist
              </p>
            </div>
          ) : (
            /* Active conversation */
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 60,
                }}
              >
                {/* Mobile back button */}
                <button
                  onClick={() => {
                    setSelectedConv(null)
                    setShowMobileThread(false)
                  }}
                  style={{
                    display: 'none', // shown via media query below
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: 4,
                  }}
                  className="inbox-back-btn"
                >
                  <ArrowLeft size={20} />
                </button>

                {selectedConv.other_user.profile_image ? (
                  <div
                    style={{
                      position: 'relative',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={selectedConv.other_user.profile_image}
                      alt={selectedConv.other_user.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(selectedConv.other_user.name)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedConv.other_user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {selectedConv.other_user.role}
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {selectedConv.other_user.profile_image ? (
                      <div
                        style={{
                          position: 'relative',
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          marginBottom: 4,
                        }}
                      >
                        <Image
                          src={selectedConv.other_user.profile_image}
                          alt={selectedConv.other_user.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: 4,
                        }}
                      >
                        {getInitials(selectedConv.other_user.name)}
                      </div>
                    )}
                    <p
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                      }}
                    >
                      {selectedConv.other_user.name}
                    </p>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-tertiary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedConv.other_user.role}
                    </p>
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        marginTop: 8,
                      }}
                    >
                      No messages yet. Say hello!
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUserId
                  const showTimestamp =
                    i === 0 ||
                    new Date(msg.created_at).getTime() -
                      new Date(messages[i - 1].created_at).getTime() >
                      300_000 // 5 min gap

                  return (
                    <div key={msg.message_id}>
                      {showTimestamp && (
                        <div
                          style={{
                            textAlign: 'center',
                            margin: '12px 0 8px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-surface)',
                              padding: '4px 10px',
                              borderRadius: 10,
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {new Date(msg.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          marginBottom: 2,
                        }}
                      >
                        <div
                          className="message-bubble-group"
                          style={{
                            maxWidth: '65%',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: 18,
                              borderBottomRightRadius: isMe ? 4 : 18,
                              borderBottomLeftRadius: isMe ? 18 : 4,
                              background: isMe
                                ? 'var(--primary)'
                                : 'var(--bg-surface)',
                              color: isMe ? '#fff' : 'var(--text-primary)',
                              border: isMe
                                ? 'none'
                                : '1px solid var(--border-subtle)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              wordBreak: 'break-word',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.85rem',
                                lineHeight: 1.45,
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                              }}
                            >
                              {msg.content}
                            </p>
                          </div>
                          {/* Timestamp on hover */}
                          <div
                            className="message-timestamp"
                            style={{
                              fontSize: '0.62rem',
                              color: 'var(--text-muted)',
                              marginTop: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                          >
                            {formatBubbleTime(msg.created_at)}
                            {isMe && (
                              msg.is_read ? (
                                <CheckCheck size={12} style={{ color: 'var(--primary)' }} />
                              ) : (
                                <Check size={12} style={{ color: 'var(--text-muted)' }} />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-end',
                }}
              >
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Aa"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e =>
                    (e.target.style.borderColor = 'var(--primary)')
                  }
                  onBlur={e =>
                    (e.target.style.borderColor = 'var(--border)')
                  }
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background:
                      newMessage.trim() && !sending
                        ? 'var(--primary)'
                        : 'var(--bg-inset)',
                    color:
                      newMessage.trim() && !sending
                        ? '#fff'
                        : 'var(--text-muted)',
                    border: 'none',
                    cursor:
                      newMessage.trim() && !sending
                        ? 'pointer'
                        : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════ Inline styles for hover effects ═══════ */}
      <style>{`
        .message-bubble-group:hover .message-timestamp {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .inbox-back-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
