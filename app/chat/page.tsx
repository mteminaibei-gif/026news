'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type Tab = 'news' | 'my'

interface ChatItem {
  id: string
  title: string
  preview: string
  time: string
  unread: number
}

interface Message {
  id: string
  author: string
  initials: string
  avatarBg: string
  time: string
  content: string
  reactions: { heart: number; thumbsUp: number; thumbsDown: number; flag: number }
}

const MOCK_CHATS: ChatItem[] = [
  { id: '1', title: 'Breaking News Kenya', preview: 'Election results are coming in...', time: '2m', unread: 3 },
  { id: '2', title: 'Tech Desk', preview: 'AI regulation update from parliament', time: '15m', unread: 0 },
  { id: '3', title: 'Sports Roundup', preview: 'Kenya qualifies for World Cup qualifiers', time: '1h', unread: 1 },
  { id: '4', title: 'Climate Watch', preview: 'New drought relief measures announced', time: '3h', unread: 0 },
  { id: '5', title: 'Business Daily', preview: 'NSE hits record high amid foreign inflows', time: '5h', unread: 0 },
  { id: '6', title: 'Opinion Desk', preview: 'Columnist: Why devolution matters', time: '1d', unread: 0 },
]

const MOCK_MESSAGES: Message[] = [
  { id: '1', author: 'Sarah Kimani', initials: 'SK', avatarBg: 'var(--primary)', time: '10:32 AM', content: 'The latest developments in the election coverage are really shaping up. We should discuss the editorial angle for tonight\'s broadcast.', reactions: { heart: 4, thumbsUp: 7, thumbsDown: 0, flag: 0 } },
  { id: '2', author: 'James Odhiambo', initials: 'JO', avatarBg: 'var(--accent)', time: '10:35 AM', content: 'Agreed. I have field reports from three counties ready. The turnout numbers are significant.', reactions: { heart: 2, thumbsUp: 5, thumbsDown: 1, flag: 0 } },
  { id: '3', author: 'Amina Hassan', initials: 'AH', avatarBg: 'var(--success)', time: '10:41 AM', content: 'I can provide the data visualizations we prepared earlier. The demographic breakdowns are quite revealing.', reactions: { heart: 6, thumbsUp: 3, thumbsDown: 0, flag: 0 } },
  { id: '4', author: 'Peter Mwangi', initials: 'PM', avatarBg: 'var(--warning)', time: '10:48 AM', content: 'Let me coordinate with the graphics team. We should have the animated maps ready by 2 PM.', reactions: { heart: 1, thumbsUp: 8, thumbsDown: 0, flag: 0 } },
  { id: '5', author: 'Grace Wanjiku', initials: 'GW', avatarBg: 'var(--error)', time: '11:02 AM', content: 'Security clearance for the polling station live feed has been confirmed. We are good to go.', reactions: { heart: 3, thumbsUp: 12, thumbsDown: 0, flag: 0 } },
]

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<Tab>('news')
  const [activeChat, setActiveChat] = useState('1')
  const [messageInput, setMessageInput] = useState('')
  const [toggle, setToggle] = useState<'latest' | 'relevant' | 'favourites'>('latest')

  const activeChatData = MOCK_CHATS.find(c => c.id === activeChat)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      <main className="flex-1 flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside
          className="flex flex-col"
          style={{
            width: '300px',
            minWidth: '300px',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          {/* Search */}
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              type="text"
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-inset)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {([['news', 'News Feed'], ['my', 'My Feed']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex-1 font-semibold"
                style={{
                  padding: '0.75rem',
                  fontSize: '0.82rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === key ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {MOCK_CHATS.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className="w-full text-left"
                style={{
                  padding: '0.875rem var(--space-md)',
                  background: activeChat === chat.id ? 'var(--primary-light)' : 'transparent',
                  borderLeft: activeChat === chat.id ? '3px solid var(--primary)' : '3px solid transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: '0.85rem',
                        color: activeChat === chat.id ? 'var(--primary)' : 'var(--text-primary)',
                      }}
                    >
                      {chat.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {chat.time}
                    </span>
                  </div>
                  <p
                    className="truncate"
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {chat.preview}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <span
                    className="flex items-center justify-center font-semibold"
                    style={{
                      minWidth: '20px',
                      height: '20px',
                      paddingInline: '6px',
                      borderRadius: '9999px',
                      background: 'var(--primary)',
                      color: 'var(--bg-elevated)',
                      fontSize: '0.7rem',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '0.875rem var(--space-lg)',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            <div>
              <h2 className="font-semibold" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {activeChatData?.title ?? 'Select a chat'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                5 participants
              </p>
            </div>
            <div className="flex gap-1">
              {(['latest', 'relevant', 'favourites'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setToggle(key)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: toggle === key ? 'var(--primary)' : 'var(--border)',
                    background: toggle === key ? 'var(--primary)' : 'transparent',
                    color: toggle === key ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-lg)', background: 'var(--bg-base)' }}>
            <div className="flex flex-col gap-4">
              {MOCK_MESSAGES.map(msg => (
                <div
                  key={msg.id}
                  className="flex gap-3"
                  style={{
                    padding: 'var(--space-md)',
                    borderRadius: '12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 font-semibold"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '9999px',
                      background: msg.avatarBg,
                      color: 'var(--bg-elevated)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {msg.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {msg.author}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {msg.time}
                      </span>
                    </div>

                    {/* Content */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {msg.content}
                    </p>

                    {/* Reactions */}
                    <div className="flex items-center gap-3" style={{ marginTop: '0.6rem' }}>
                      {[
                        { key: 'heart', icon: '\u2764', count: msg.reactions.heart },
                        { key: 'thumbsUp', icon: '\uD83D\uDC4D', count: msg.reactions.thumbsUp },
                        { key: 'thumbsDown', icon: '\uD83D\uDC4E', count: msg.reactions.thumbsDown },
                        { key: 'flag', icon: '\uD83D\uDEA9', count: msg.reactions.flag },
                      ].map(r => (
                        <button
                          key={r.key}
                          className="flex items-center gap-1"
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-inset)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>{r.icon}</span>
                          <span style={{ fontSize: '0.72rem' }}>{r.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="flex gap-3 items-end">
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                rows={1}
                className="flex-1"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-inset)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                className="flex items-center justify-center"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--bg-elevated)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                {'\u27A4'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
