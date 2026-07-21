'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, X, MessageSquare, Loader2, Bell, CheckCheck } from 'lucide-react'

interface Message {
  message_id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  sender: { name: string; profile_image: string | null }
  is_read: boolean
}

interface ChatWidgetProps {
  receiverId: number
  receiverName: string
  receiverImage: string | null
}

interface Notification {
  id: string
  senderId: number
  senderName: string
  senderImage: string | null
  content: string
  timestamp: Date
}

export function ChatWidget({ receiverId, receiverName, receiverImage }: ChatWidgetProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Keep latest receiverId in a ref so the realtime channel can be subscribed
  // exactly once per user (changing receiverId must not re-subscribe).
  const receiverIdRef = useRef(receiverId)
  useEffect(() => { receiverIdRef.current = receiverId }, [receiverId])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resolveUser()
  }, [])

  useEffect(() => {
    if (currentUserId) fetchMessages()
  }, [receiverId, currentUserId])

  async function resolveUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.id) return
    const { data: profile } = await supabase
      .from('users').select('user_id').eq('auth_id', authUser.id).single()
    if (profile) setCurrentUserId((profile as { user_id: number }).user_id)
  }

  async function fetchMessages() {
    if (!currentUserId) return
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users!sender_id(name, profile_image)')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data as Message[])
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for new messages globally for pop-out notifications — subscribe
  // once per user; read receiverId via ref to avoid re-subscribing on switch.
  // Reuse any existing channel of the same topic (Strict Mode double-invoke)
  // so we never call .on() on an already-subscribed channel.
  useEffect(() => {
    if (!currentUserId) return
    const topic = `global-messages:${currentUserId}`
    const existing = supabase.getChannels().find(c => c.topic === topic)
    const channel = existing ?? supabase
      .channel(topic)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, async (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id === receiverIdRef.current) {
          setMessages(prev => {
            if (prev.some(m => m.message_id === msg.message_id)) return prev
            return [...prev, msg]
          })
        }
        // Show pop-out notification for other conversations
        if (msg.sender_id !== receiverIdRef.current) {
          const { data: sender } = await supabase
            .from('users')
            .select('name, profile_image')
            .eq('user_id', msg.sender_id)
            .single()
          
          if (sender) {
            const newNotification: Notification = {
              id: `notif-${msg.message_id}`,
              senderId: msg.sender_id,
              senderName: (sender as { name: string }).name,
              senderImage: (sender as { profile_image: string | null }).profile_image,
              content: msg.content,
              timestamp: new Date(),
            }
            setNotifications(prev => [...prev.slice(-4), newNotification])
            // Auto-dismiss after 6 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
            }, 6000)
          }
        }
      })
      .subscribe()

    return () => { if (!existing) supabase.removeChannel(channel) }
  }, [currentUserId, supabase])

  async function handleSendMessage() {
    if (!newMessage.trim() || !currentUserId) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, content: newMessage.trim() }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  async function handleMarkAsRead(messageId: number) {
    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' })
    } catch {}
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const openConversationFromNotification = (senderId: number) => {
    // Navigate to inbox with selected conversation
    window.location.href = `/inbox?conversation=${senderId}`
  }

  if (!currentUserId) return null

  return (
    <>
      {/* Pop-out Notifications */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => openConversationFromNotification(notif.senderId)}
            className="pointer-events-auto animate-slide-in-right rounded-xl shadow-xl p-3 flex items-start gap-3 transition-all hover:shadow-2xl"
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              cursor: 'pointer'
            }}
          >
            {notif.senderImage ? (
              <img src={notif.senderImage} alt={notif.senderName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {notif.senderName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{notif.senderName}</p>
              <p className="text-sm text-text-secondary truncate mt-0.5">{notif.content}</p>
              <p className="text-xs text-text-tertiary mt-1">{notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
              className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-bg-inset transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {/* Chat Panel */}
        <div className={`mb-4 transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
          <div className="rounded-2xl shadow-2xl w-80 md:w-96 max-h-[600px] flex flex-col overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {/* Header */}
            <div className="p-4 flex items-center gap-3" style={{ background: 'var(--primary)' }}>
              {receiverImage ? (
                <div className="relative">
                  <img src={receiverImage} alt={receiverName} className="w-10 h-10 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold">{receiverName.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">{receiverName}</h3>
                <p className="text-white/70 text-xs">Start a conversation</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--bg-base)', maxHeight: 400 }}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
                        style={isMe
                          ? { background: 'var(--primary)', color: '#fff' }
                          : { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'opacity-60' : ''}`} style={{ color: isMe ? '#fff' : 'var(--text-tertiary)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 rounded-xl disabled:opacity-50 transition-colors"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'var(--primary)', color: '#fff' }}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          <MessageSquare size={26} />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}