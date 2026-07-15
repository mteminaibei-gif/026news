'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
import { ChatWidget } from '@/components/ui/ChatWidget'

interface UserProfile {
  user_id: number; name: string; role: string; profile_image: string | null
}
interface Conversation {
  other_user: UserProfile
  last_message: string
  last_message_at: string
  unread: number
}
interface Message {
  message_id: number; sender_id: number; receiver_id: number
  message: string; created_at: string; is_read: boolean
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resolveUser()
  }, [])

  useEffect(() => {
    if (currentUserId) loadConversations()
  }, [currentUserId])

  useEffect(() => {
    if (currentUserId && selectedConv) loadMessages()
  }, [selectedConv, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function resolveUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) { router.push('/login?redirect=/inbox'); setLoading(false); return }
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', authUser.id).single()
    if (data) setCurrentUserId((data as UserProfile).user_id)
    setLoading(false)
  }

  async function loadConversations() {
    if (!currentUserId) return
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, message, created_at, is_read')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!msgs?.length) { setConversations([]); return }

      const convMap = new Map<number, Conversation>()
      for (const msg of msgs as { sender_id: number; receiver_id: number; message: string; created_at: string; is_read: boolean }[]) {
        const otherId: number = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
        if (otherId === currentUserId) continue
        if (!convMap.has(otherId)) {
          const { data: u } = await supabase.from('users').select('user_id, name, role, profile_image').eq('user_id', otherId).single()
          const fallback = { user_id: otherId, name: 'Unknown', role: 'user', profile_image: null }
          convMap.set(otherId, {
            other_user: u ? (u as UserProfile) : fallback,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread: msg.sender_id !== currentUserId && !msg.is_read ? 1 : 0,
          })
        }
      }
      setConversations(Array.from(convMap.values()))
    } catch { setConversations([]) }
  }

  async function loadMessages() {
    if (!currentUserId || !selectedConv) return
    const otherId = selectedConv.other_user.user_id
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
      .limit(50)
    setMessages((data as Message[]) || [])

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true } as never)
      .eq('sender_id', otherId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
  }

  async function handleSend() {
    if (!newMessage.trim() || !currentUserId || !selectedConv) return
    setSending(true)
    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedConv.other_user.user_id,
          message: newMessage.trim(),
        } as never)
      setNewMessage('')
      loadMessages()
    } catch {}
    setSending(false)
  }

  // Real-time subscription
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel('inbox-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        loadConversations()
        if (selectedConv) loadMessages()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, selectedConv])

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        {selectedConv && (
          <button onClick={() => setSelectedConv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Newsreader', Georgia, serif" }}>
          {selectedConv ? selectedConv.other_user.name : 'Inbox'}
        </h1>
        {selectedConv && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{selectedConv.other_user.role}</span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversation List */}
        {!selectedConv && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <MessageSquare size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No conversations yet</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Start a conversation by messaging someone from their profile.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div key={conv.other_user.user_id}
                  onClick={() => setSelectedConv(conv)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s', background: 'var(--bg-surface)' }}>
                  {conv.other_user.profile_image ? (
                    <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={conv.other_user.profile_image} alt={conv.other_user.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{conv.other_user.name.charAt(0)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{conv.other_user.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Message Thread */}
        {selectedConv && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.message_id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4,
                      background: isMe ? 'var(--primary)' : 'var(--bg-surface)', color: isMe ? '#fff' : 'var(--text-primary)',
                      border: isMe ? 'none' : '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                      <p style={{ fontSize: '0.62rem', marginTop: 4, opacity: 0.6 }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
              <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sending || !newMessage.trim() ? 0.5 : 1 }}>
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
