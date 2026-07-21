import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push-notifications'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

// GET /api/messages — List conversations for current user
// Returns each unique conversation partner with last message preview & unread count
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number } | null }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const uid = profile.user_id

    // Fetch all messages involving this user
    type MessageRow = { message_id: number; sender_id: number; receiver_id: number; content: string; is_read: boolean; created_at: string }
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('message_id, sender_id, receiver_id, content, is_read, created_at')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false })
      .limit(200) as { data: MessageRow[] | null; error: any }

    if (error) throw error

    // Group by conversation partner
    const convMap = new Map<number, {
      other_user_id: number
      last_message: string
      last_message_at: string
      unread: number
    }>()

    for (const msg of msgs ?? []) {
      const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id
      if (otherId === uid) continue

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          other_user_id: otherId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread: msg.sender_id !== uid && !msg.is_read ? 1 : 0,
        })
      } else {
        // If we already have this conversation and find an unread message from other user
        const existing = convMap.get(otherId)!
        if (msg.sender_id !== uid && !msg.is_read) {
          existing.unread++
        }
      }
    }

    const conversations = Array.from(convMap.values())

    // Fetch user profiles in bulk
    const userIds = conversations.map(c => c.other_user_id)
    type UserRow = { user_id: number; name: string; profile_image: string | null; role: string }
    const { data: users } = await supabase
      .from('users')
      .select('user_id, name, profile_image, role')
      .in('user_id', userIds) as { data: UserRow[] | null; error: any }

    const userMap = new Map<number, { name: string; profile_image: string | null; role: string }>()
    for (const u of users ?? []) {
      userMap.set(u.user_id, { name: u.name, profile_image: u.profile_image, role: u.role })
    }

    const result = conversations.map(c => ({
      other_user: {
        user_id: c.other_user_id,
        ...userMap.get(c.other_user_id) ?? { name: 'Unknown', profile_image: null, role: 'reader' },
      },
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      unread: c.unread,
    }))

    // Sort by last message time
    result.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

    return NextResponse.json({ conversations: result })
  } catch (err) {
    console.error('[GET /api/messages]', err)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// POST /api/messages — Send a new message
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rl = await checkRateLimit(`messages:${ip}`, RATE_LIMITS.PUBLIC_POST.limit, RATE_LIMITS.PUBLIC_POST.window)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } })
    }

    const body = await req.json()
    const { receiverId, content } = body

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('user_id, name')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number; name: string } | null }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Validate receiver exists
    const { data: receiver } = await supabase
      .from('users')
      .select('user_id, name')
      .eq('user_id', receiverId)
      .single()

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    if (profile.user_id === receiverId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 })
    }

    const trimmed = content.trim().substring(0, 5000)

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.user_id,
        receiver_id: receiverId,
        content: trimmed,
      } as never)
      .select('message_id, sender_id, receiver_id, content, is_read, created_at')
      .single() as { data: { message_id: number; sender_id: number; receiver_id: number; content: string; is_read: boolean; created_at: string } | null; error: any }

    if (error) throw error

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Create notification for receiver
    await supabase.from('notifications').insert({
      user_id: receiverId,
      actor_id: profile.user_id,
      type: 'message',
      title: 'New Message',
      message: `${profile.name} sent you a message`,
      metadata: { messageId: newMessage.message_id, senderId: profile.user_id },
    } as never)

    // Send push notification to receiver
    await sendPushNotification(receiverId, {
      title: `Message from ${profile.name}`,
      body: trimmed.length > 100 ? trimmed.substring(0, 100) + '…' : trimmed,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        type: 'message',
        conversationId: profile.user_id,
        senderName: profile.name,
      },
      tag: `message-${profile.user_id}`,
    })

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/messages]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// DELETE /api/messages?id=xxx — delete own message
export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'Message id required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('user_id').eq('auth_id', user.id).single() as { data: { user_id: number } | null }
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('message_id', id)
      .eq('sender_id', profile.user_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/messages]', err)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
