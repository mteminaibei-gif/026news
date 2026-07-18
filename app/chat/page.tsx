'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Plus, Users, ArrowLeft } from 'lucide-react'

type Tab = 'news' | 'my'

interface ChatRoom {
  room_id: number
  name: string
  description: string | null
  created_by: number
  is_public: boolean
  created_at: string
  member_count?: number
  last_message?: string
  last_message_at?: string
}

interface ChatMessage {
  message_id: number
  room_id: number
  sender_id: number
  content: string
  is_deleted: boolean
  created_at: string
  sender_name?: string
  sender_image?: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('news')
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Auth ────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        router.push('/login?redirect=/chat')
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single()
      if (data) setCurrentUserId((data as { user_id: number }).user_id)
      setLoading(false)
    })()
  }, [router, supabase])

  // ── Load rooms ──────────────────────────────────────
  const loadRooms = useCallback(async () => {
    if (!currentUserId) return
    try {
      // Public rooms, plus rooms the user is a member of.
      const { data } = await supabase
        .from('chat_rooms')
        .select(`
          room_id, name, description, created_by, is_public, created_at,
          chat_room_members ( user_id ),
          chat_messages ( content, created_at )
        `)
        .or(`is_public.eq.true,room_id.in.(select room_id from chat_room_members where user_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false })

      const list = (data ?? []) as unknown as Array<{
        room_id: number; name: string; description: string | null;
        created_by: number; is_public: boolean; created_at: string;
        chat_room_members: { user_id: number }[];
        chat_messages: { content: string; created_at: string }[];
      }>

      const roomsMapped: ChatRoom[] = list.map(r => {
        const msgs = r.chat_messages ?? []
        const last = msgs.length ? msgs[msgs.length - 1] : null
        return {
          room_id: r.room_id,
          name: r.name,
          description: r.description,
          created_by: r.created_by,
          is_public: r.is_public,
          created_at: r.created_at,
          member_count: (r.chat_room_members ?? []).length || 1,
          last_message: last?.content ?? undefined,
          last_message_at: last?.created_at ?? undefined,
        }
      })

      // Filter by tab
      const filtered = activeTab === 'my'
        ? roomsMapped.filter(r => (r as any).chat_room_members?.some((m: any) => m.user_id === currentUserId))
        : roomsMapped

      setRooms(filtered)
      if (!activeRoom && filtered.length > 0) setActiveRoom(filtered[0].room_id)
    } catch {
      setRooms([])
    }
  }, [currentUserId, activeTab, activeRoom, supabase])

  useEffect(() => {
    if (currentUserId) loadRooms()
  }, [currentUserId, loadRooms])

  // ── Load + subscribe to messages for active room ────
  useEffect(() => {
    if (!activeRoom) return
    ;(async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('message_id, room_id, sender_id, content, is_deleted, created_at, sender:users!chat_messages_sender_id_fkey(name, profile_image)')
        .eq('room_id', activeRoom)
        .order('created_at', { ascending: true })
        .limit(100)
      const msgs = (data ?? []) as unknown as Array<{
        message_id: number; room_id: number; sender_id: number; content: string;
        is_deleted: boolean; created_at: string;
        sender: { name: string; profile_image: string | null } | null;
      }>
      setMessages(msgs.map(m => ({
        message_id: m.message_id,
        room_id: m.room_id,
        sender_id: m.sender_id,
        content: m.content,
        is_deleted: m.is_deleted,
        created_at: m.created_at,
        sender_name: m.sender?.name ?? 'Unknown',
        sender_image: m.sender?.profile_image ?? null,
      })))
    })()

    const channel = supabase
      .channel(`chat-room-${activeRoom}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${activeRoom}`,
      }, (payload) => {
        const m = payload.new as ChatMessage
        setMessages(prev => prev.some(x => x.message_id === m.message_id) ? prev : [...prev, m])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeRoom, supabase])

  // ── Auto-scroll ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Join a public room ──────────────────────────────
  async function joinRoom(roomId: number) {
    if (!currentUserId) return
    await supabase.from('chat_room_members').upsert({ room_id: roomId, user_id: currentUserId } as never)
    loadRooms()
  }

  // ── Create a room ───────────────────────────────────
  async function createRoom() {
    if (!currentUserId || !newRoomName.trim()) return
    const { data } = await supabase
      .from('chat_rooms')
      .insert({ name: newRoomName.trim(), description: newRoomDesc.trim() || null, created_by: currentUserId, is_public: true } as never)
      .select('room_id')
      .single()
    if (data) {
      const rid = (data as { room_id: number }).room_id
      await supabase.from('chat_room_members').upsert({ room_id: rid, user_id: currentUserId } as never)
      setNewRoomName(''); setNewRoomDesc(''); setShowCreate(false)
      setActiveRoom(rid)
      loadRooms()
    }
  }

  // ── Send message ────────────────────────────────────
  async function handleSend() {
    if (!messageInput.trim() || !activeRoom || !currentUserId || sending) return
    setSending(true)
    const content = messageInput.trim()
    setMessageInput('')
    try {
      await supabase
        .from('chat_messages')
        .insert({ room_id: activeRoom, sender_id: currentUserId, content } as never)
    } catch {
      // failed silently; realtime will not deliver, user can retry
    } finally {
      setSending(false)
    }
  }

  const activeRoomData = rooms.find(r => r.room_id === activeRoom)
  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading chat…</div>
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main className="flex-1 flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside
          className={`${activeRoom ? 'hidden lg:flex' : 'flex'} flex-col`}
          style={{
            width: '300px',
            minWidth: '300px',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          {/* Search / create */}
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Search rooms..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'var(--bg-inset)',
                color: 'var(--text-primary)', fontSize: '0.85rem',
              }}
            />
            <button
              onClick={() => setShowCreate(v => !v)}
              title="Create room"
              style={{ width: 42, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--primary)', color: 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={18} />
            </button>
          </div>

          {showCreate && (
            <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="Room name"
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
              />
              <input
                value={newRoomDesc}
                onChange={e => setNewRoomDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
              />
              <button
                onClick={createRoom}
                style={{ padding: '9px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--bg-elevated)', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Create Room
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {([['news', 'Public Rooms'], ['my', 'My Rooms']] as const).map(([key, label]) => (
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

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 && (
              <p style={{ padding: '1.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No rooms yet. Create one to start the conversation.
              </p>
            )}
            {rooms.map(room => (
              <button
                key={room.room_id}
                onClick={() => setActiveRoom(room.room_id)}
                className="w-full text-left"
                style={{
                  padding: '0.875rem var(--space-md)',
                  background: activeRoom === room.room_id ? 'var(--primary-light)' : 'transparent',
                  borderLeft: activeRoom === room.room_id ? '3px solid var(--primary)' : '3px solid transparent',
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
                        color: activeRoom === room.room_id ? 'var(--primary)' : 'var(--text-primary)',
                      }}
                    >
                      {room.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Users size={11} /> {room.member_count}
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
                    {room.last_message ?? room.description ?? 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className={`${activeRoom ? 'flex' : 'hidden lg:flex'} flex-1 flex flex-col min-w-0`}>
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '0.875rem var(--space-lg)',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setActiveRoom(null)}
                aria-label="Back to rooms"
                className="lg:hidden flex items-center justify-center flex-shrink-0"
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
              <h2 className="font-semibold" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {activeRoomData?.name ?? 'Select a room'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                {activeRoomData ? `${activeRoomData.member_count} participant${activeRoomData.member_count === 1 ? '' : 's'}` : 'Newsroom group chat'}
              </p>
              </div>
            </div>
            {activeRoomData && !activeRoomData.is_public && (
              <button
                onClick={() => joinRoom(activeRoomData.room_id)}
                style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Join Room
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-lg)', background: 'var(--bg-base)' }}>
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem', marginTop: '2rem' }}>
                  No messages yet. Be the first to post!
                </p>
              )}
              {messages.map(msg => (
                <div
                  key={msg.message_id}
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
                      background: msg.sender_image ? 'transparent' : 'var(--primary)',
                      overflow: 'hidden',
                      color: 'var(--bg-elevated)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {msg.sender_image ? (
                      <img src={msg.sender_image} alt={msg.sender_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials(msg.sender_name ?? '?')
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {msg.sender_name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {msg.is_deleted ? <em style={{ color: 'var(--text-tertiary)' }}>Message deleted</em> : msg.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={activeRoom ? 'Type a message...' : 'Select a room to chat'}
                rows={1}
                disabled={!activeRoom}
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
                onClick={handleSend}
                disabled={!activeRoom || sending}
                className="flex items-center justify-center"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--bg-elevated)',
                  cursor: activeRoom && !sending ? 'pointer' : 'not-allowed',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                  opacity: activeRoom && !sending ? 1 : 0.5,
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
