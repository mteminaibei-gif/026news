'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, X, MessageSquare, Loader2 } from 'lucide-react'

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

export function ChatWidget({ receiverId, receiverName, receiverImage }: ChatWidgetProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
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
        .select('*, sender:users(name, profile_image)')
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
      // Optimistic append handled by real-time subscription
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel(`chat:${currentUserId}:${receiverId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id === receiverId) {
          setMessages(prev => {
            if (prev.some(m => m.message_id === msg.message_id)) return prev
            return [...prev, msg]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, receiverId])

  return (
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
      >
        <MessageSquare size={26} />
      </button>
    </div>
  )
}
