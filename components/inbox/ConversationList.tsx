'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, ArrowLeft, MessageSquare, Loader2, X } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface UserProfile {
  user_id: number; name: string; role: string; profile_image: string | null
}

interface Conversation {
  other_user: UserProfile; last_message: string; last_message_at: string; unread: number
}

interface SearchResult {
  user_id: number; name: string; profile_image: string | null; role: string; bio: string | null
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr); const now = new Date(); const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  conversations: Conversation[]
  selectedConv: Conversation | null
  currentUserId: number | null
  onlineUsers: Set<number>
  onSelectConversation: (conv: Conversation) => void
  onStartConversation: (user: SearchResult) => void
}

export function ConversationList({ conversations, selectedConv, onSelectConversation, onStartConversation, onlineUsers }: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/messages/search?query=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) setSearchResults((await res.json()).users ?? [])
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div style={{ width: 360, minWidth: 360, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Chats</h1>
        <button onClick={() => setShowSearch(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-inset)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }} title="Search users" aria-label="Search users">
          <Search size={18} />
        </button>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: 360, height: '100%', background: 'var(--bg-surface)', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex' }} aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search people..." aria-label="Search people" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus() }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-muted)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {searching && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', display: 'block', color: 'var(--primary)' }} />
              </div>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No users found</div>
            )}
            {searchResults.map(user => (
              <div key={user.user_id} onClick={() => { onStartConversation(user); setShowSearch(false); setSearchQuery(''); setSearchResults([]) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-inset)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {user.profile_image ? (
                  <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={user.profile_image} alt={user.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
            ))}
            {!searching && searchQuery.length < 2 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>Type at least 2 characters to search</div>
            )}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <MessageSquare size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No conversations yet</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Tap the search icon to start chatting</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = selectedConv?.other_user.user_id === conv.other_user.user_id
            return (
              <div key={conv.other_user.user_id} onClick={() => onSelectConversation(conv)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', transition: 'background 0.15s', background: isActive ? 'var(--primary-light)' : 'transparent', borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-inset)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                {conv.other_user.profile_image ? (
                  <div style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={conv.other_user.profile_image} alt={conv.other_user.name} fill style={{ objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: onlineUsers.has(conv.other_user.user_id) ? 'var(--success)' : 'var(--bg-inset)', border: '2px solid var(--bg-surface)' }} />
                  </div>
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: isActive ? 'var(--primary)' : 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                    {getInitials(conv.other_user.name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: conv.unread > 0 ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.other_user.name}</span>
                    <span style={{ fontSize: '0.65rem', color: conv.unread > 0 ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0, marginLeft: 8, fontWeight: conv.unread > 0 ? 600 : 400 }}>
                      {conv.last_message_at ? formatMessageTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <p style={{ fontSize: '0.78rem', color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: conv.unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {conv.last_message || 'Start a conversation'}
                    </p>
                    {conv.unread > 0 && (
                      <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0 }}>
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
  )
}
