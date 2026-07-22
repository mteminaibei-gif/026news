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

  function handleBack() {
    setSelectedConv(null)
    selectedConvRef.current = null
    setShowMobileThread(false)
  }

  function handleTyping(isTyping: boolean) {
    supabase.channel('inbox-realtime').send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping },
    })
  }

  if (loading) {
    return (
      <div className="inbox-loading">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="inbox-page">
      <div className="inbox-container">
        {/* Left Sidebar */}
        <div className={`inbox-sidebar-panel ${showMobileThread ? 'hide-mobile' : ''}`}>
          <ConversationList
            conversations={conversations}
            selectedConv={selectedConv}
            onlineUsers={onlineUsers}
            onSelectConversation={selectConversation}
            onStartConversation={handleStartConversation}
          />
        </div>

        {/* Right Panel */}
        <div className={`inbox-thread-panel ${showMobileThread ? 'show-mobile' : ''}`}>
          {selectedConv && currentUserId ? (
            <MessageThread
              conversation={selectedConv}
              currentUserId={currentUserId}
              isOnline={onlineUsers.has(selectedConv.other_user.user_id)}
              isTyping={typingUserId === selectedConv.other_user.user_id}
              onBack={handleBack}
              onTyping={handleTyping}
            />
          ) : (
            <div className="inbox-empty-state">
              <div className="inbox-empty-icon">
                <MessageSquare size={48} />
              </div>
              <h2 className="inbox-empty-title">Your Messages</h2>
              <p className="inbox-empty-sub">
                Send private messages to friends, journalists, and communities
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
