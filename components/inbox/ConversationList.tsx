'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, ArrowLeft, MessageSquare, Loader2, X, Plus } from 'lucide-react'
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
  onlineUsers: Set<number>
  onSelectConversation: (conv: Conversation) => void
  onStartConversation: (user: SearchResult) => void
}

export function ConversationList({ conversations, selectedConv, onSelectConversation, onStartConversation, onlineUsers }: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
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
    <div className="inbox-sidebar">
      {/* Header */}
      <div className="inbox-sidebar-header">
        <h1 className="inbox-sidebar-title">Chats</h1>
        <div className="inbox-sidebar-actions">
          <button
            onClick={() => setShowNewChat(true)}
            className="inbox-icon-btn primary"
            title="New chat"
            aria-label="New chat"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="inbox-icon-btn"
            title="Search users"
            aria-label="Search users"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="inbox-search-overlay">
          <div className="inbox-search-bar">
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
              className="inbox-back-btn-inline"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="inbox-search-input-wrap">
              <Search size={16} className="inbox-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                aria-label="Search people"
                className="inbox-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); searchInputRef.current?.focus() }}
                  className="inbox-search-clear"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="inbox-search-results">
            {searching && (
              <div className="inbox-search-loading">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="inbox-search-empty">No users found</div>
            )}
            {searchResults.map(user => (
              <div
                key={user.user_id}
                onClick={() => { onStartConversation(user); setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
                className="inbox-user-item"
              >
                {user.profile_image ? (
                  <div className="inbox-avatar-wrap">
                    <Image src={user.profile_image} alt={user.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" />
                  </div>
                ) : (
                  <div className="inbox-avatar initials">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="inbox-user-info">
                  <div className="inbox-user-name">{user.name}</div>
                  <div className="inbox-user-role">{user.role}</div>
                </div>
              </div>
            ))}
            {!searching && searchQuery.length < 2 && (
              <div className="inbox-search-hint">Type at least 2 characters to search</div>
            )}
          </div>
        </div>
      )}

      {/* New chat overlay */}
      {showNewChat && (
        <div className="inbox-search-overlay">
          <div className="inbox-search-bar">
            <button
              onClick={() => { setShowNewChat(false); setSearchQuery(''); setSearchResults([]) }}
              className="inbox-back-btn-inline"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="inbox-search-input-wrap">
              <Search size={16} className="inbox-search-icon" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find people to chat with..."
                aria-label="Search people"
                className="inbox-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                  className="inbox-search-clear"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="inbox-search-results">
            {searching && (
              <div className="inbox-search-loading">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="inbox-search-empty">No users found</div>
            )}
            {searchResults.map(user => (
              <div
                key={user.user_id}
                onClick={() => { onStartConversation(user); setShowNewChat(false); setSearchQuery(''); setSearchResults([]) }}
                className="inbox-user-item"
              >
                {user.profile_image ? (
                  <div className="inbox-avatar-wrap">
                    <Image src={user.profile_image} alt={user.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" />
                  </div>
                ) : (
                  <div className="inbox-avatar initials">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="inbox-user-info">
                  <div className="inbox-user-name">{user.name}</div>
                  <div className="inbox-user-role">{user.role}</div>
                </div>
              </div>
            ))}
            {!searching && searchQuery.length < 2 && (
              <div className="inbox-search-hint">Search for people to start a conversation</div>
            )}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="inbox-conversations">
        {conversations.length === 0 ? (
          <div className="inbox-empty">
            <MessageSquare size={48} />
            <p className="inbox-empty-title">No conversations yet</p>
            <p className="inbox-empty-sub">Tap the + button to start chatting</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = selectedConv?.other_user.user_id === conv.other_user.user_id
            const isOnline = onlineUsers.has(conv.other_user.user_id)
            return (
              <div
                key={conv.other_user.user_id}
                onClick={() => onSelectConversation(conv)}
                className={`inbox-conv-item ${isActive ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}`}
              >
                <div className="inbox-conv-avatar">
                  {conv.other_user.profile_image ? (
                    <>
                      <div className="inbox-avatar-wrap">
                        <Image src={conv.other_user.profile_image} alt={conv.other_user.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy" />
                      </div>
                      {isOnline && <span className="inbox-online-dot" />}
                    </>
                  ) : (
                    <>
                      <div className={`inbox-avatar initials ${isActive ? 'active' : ''}`}>
                        {getInitials(conv.other_user.name)}
                      </div>
                      {isOnline && <span className="inbox-online-dot" />}
                    </>
                  )}
                </div>
                <div className="inbox-conv-content">
                  <div className="inbox-conv-top">
                    <span className={`inbox-conv-name ${conv.unread > 0 ? 'bold' : ''}`}>
                      {conv.other_user.name}
                    </span>
                    <span className={`inbox-conv-time ${conv.unread > 0 ? 'unread' : ''}`}>
                      {conv.last_message_at ? formatMessageTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="inbox-conv-bottom">
                    <p className={`inbox-conv-preview ${conv.unread > 0 ? 'unread' : ''}`}>
                      {conv.last_message || 'Start a conversation'}
                    </p>
                    {conv.unread > 0 && (
                      <span className="inbox-unread-badge">
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
