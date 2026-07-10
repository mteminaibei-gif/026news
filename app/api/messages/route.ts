import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages - Get conversation history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('userId')

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number } | null }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(name, profile_image)')
      .or(`and(sender_id.eq.${profile.user_id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${profile.user_id})`)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[GET /api/messages]', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/messages - Send a message
export async function POST(req: NextRequest) {
  try {
    const { receiverId, message } = await req.json()

    if (!receiverId || !message) {
      return NextResponse.json({ error: 'receiverId and message are required' }, { status: 400 })
    }

    if (!message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single() as { data: { user_id: number } | null }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.user_id,
        receiver_id: receiverId,
        message: message.trim(),
      } as never)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/messages]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
