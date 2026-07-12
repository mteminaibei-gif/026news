'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, X, MessageSquare, User, Loader2, Paperclip } from 'lucide-react'

interface Message {
  message_id: number
  sender_id: number
  receiver_id: number
  message: string
  created_at: string
  sender: { name: string; profile_image: string | null }
  is_read: boolean
}

interface ChatWidgetProps {
  receiverId: number
  receiverName: string
  receiverImage: string | null
  onSendMessage?: (message: string) => void
}

export function ChatWidget({ receiverId, receiverName, receiverImage }: ChatWidgetProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [receiverId])

  async function fetchMessages() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single() as { data: { user_id: number } | null }

      if (!profile) return

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users(name, profile_image)')
        .or(`and(sender_id.eq.${profile.user_id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${profile.user_id})`)
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
    if (!newMessage.trim()) return

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single() as { data: { user_id: number } | null }

      if (!profile) return

      setSending(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.user_id,
          receiver_id: receiverId,
          message: newMessage.trim(),
        } as never)

      if (error) throw error

      setNewMessage('')
      await fetchMessages()
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  // Real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages_${receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${receiverId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [receiverId])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Header */}
      <div className={`mb-4 transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 md:w-96 max-h-[600px] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-4 flex items-center gap-3" style={{ background: 'var(--primary)' }}>
            {receiverImage ? (
              <div className="relative">
                <img
                  src={receiverImage}
                  alt={receiverName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">{receiverName.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-white font-semibold">{receiverName}</h3>
              <p className="text-white/70 text-xs">Online now</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Say hello to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === messages.find(m => m === msg)?.sender_id
                return (
                  <div
                    key={msg.message_id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'text-white rounded-br-none'
                          : 'bg-white dark:bg-gray-700 dark:text-white text-gray-900 rounded-bl-none'
                      }`}
                      style={isMe ? { background: 'var(--primary)' } : undefined}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
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
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 items-center">
              <button className="p-2 text-gray-400 rounded-lg transition-colors" style={{ '--tw-hover-bg': 'var(--primary-light)' } as React.CSSProperties}>
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none transition-all"
                style={{ outlineColor: 'var(--primary)' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="p-2 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ background: 'var(--primary)' }}
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110"
        style={{ background: 'var(--primary)' }}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  )
}
