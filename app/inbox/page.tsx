'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MessageSquare } from 'lucide-react'
import { ConversationList } from '@/components/inbox/ConversationList'
import { MessageThread } from '@/components/inbox/MessageThread'

interface UserProfile {
  user_id: number; name: string; role: string; profile_image: string | null
}

interface Conversation {
  other_user: UserProfile; last_message: string; last_message_at: string; unread: number
}

export default function InboxPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [showMobileThread, setShowMobileThread] = useState(false)
  const [typingUserId, setTypingUserId] = useState<number | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())

  const selectedConvRef = useRef<Conversation | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auth & init
  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) { router.push('/login?redirect=/inbox'); setLoading(false); return }
      const { data } = await supabase.from('users').select('user_id').eq('auth_id', authUser.id).single()
      if (data) setCurrentUserId((data as { user_id: number }).user_id)
      setLoading(false)
    })()
  }, [router, supabase])

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return
    try {
      const res = await fetch('/api/messages')
      if (res.ok) setConversations((await res.json()).conversations ?? [])
    } catch { setConversations([]) }
  }, [currentUserId])

  useEffect(() => { if (currentUserId) loadConversations() }, [currentUserId, loadConversations])

  // Real-time subscription + presence + typing
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel('inbox-realtime', { config: { presence: { key: String(currentUserId) } } })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` },
        (payload) => {
          const msg = payload.new as { message_id: number; sender_id: number; content: string; created_at: string }
          const conv = selectedConvRef.current
          if (conv && msg.sender_id === conv.other_user.user_id) {
            fetch(`/api/messages/${msg.sender_id}`, { method: 'PATCH' })
          }
          loadConversations()
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUserId}` },
        () => loadConversations()
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const p = payload.payload as { userId: number; isTyping: boolean }
        if (p.userId === selectedConvRef.current?.other_user.user_id) {
          setTypingUserId(p.isTyping ? p.userId : null)
          if (typingTimer.current) clearTimeout(typingTimer.current)
          if (p.isTyping) {
            typingTimer.current = setTimeout(() => setTypingUserId(null), 4000)
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const ids = new Set<number>()
        for (const key of Object.keys(state)) {
          const meta = (state[key][0] as { userId?: number }) ?? {}
          if (meta.userId) ids.add(meta.userId)
        }
        setOnlineUsers(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: currentUserId, online_at: new Date().toISOString() })
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, supabase, loadConversations])

  function selectConversation(conv: Conversation) {
    setSelectedConv(conv)
    selectedConvRef.current = conv
    setShowMobileThread(true)
  }

  function handleStartConversation(user: { user_id: number; name: string; profile_image: string | null; role: string }) {
    const conv: Conversation = {
      other_user: { user_id: user.user_id, name: user.name, profile_image: user.profile_image, role: user.role },
      last_message: '', last_message_at: new Date().toISOString(), unread: 0,
    }
    setSelectedConv(conv)
    selectedConvRef.current = conv
    setShowMobileThread(true)
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1100, height: 'calc(100vh - 60px)', display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {/* Left sidebar — hidden on mobile when thread is open */}
        <div style={{ display: showMobileThread ? 'none' : 'flex', ...mobileSidebarStyle }}>
          <ConversationList
            conversations={conversations}
            selectedConv={selectedConv}
            onlineUsers={onlineUsers}
            onSelectConversation={selectConversation}
            onStartConversation={handleStartConversation}
          />
        </div>

        {/* Right panel */}
        {selectedConv && currentUserId ? (
          <div style={{ display: showMobileThread ? 'flex' : 'none', ...mobileThreadStyle }}>
            <MessageThread
              conversation={selectedConv}
              currentUserId={currentUserId}
              isOnline={onlineUsers.has(selectedConv.other_user.user_id)}
              isTyping={typingUserId === selectedConv.other_user.user_id}
              onBack={() => { setSelectedConv(null); selectedConvRef.current = null; setShowMobileThread(false) }}
              onTyping={(isTyping) => {
                supabase.channel('inbox-realtime').send({
                  type: 'broadcast',
                  event: 'typing',
                  payload: { userId: currentUserId, isTyping },
                })
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg-base)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={36} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Your Messages</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 280 }}>
              Send private messages to a friend or journalist
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) { .inbox-back-btn { display: flex !important; } }
      `}</style>
    </div>
  )
}

const mobileSidebarStyle: React.CSSProperties = { width: '100%', maxWidth: 360 }
const mobileThreadStyle: React.CSSProperties = { width: '100%', flex: 1 }
