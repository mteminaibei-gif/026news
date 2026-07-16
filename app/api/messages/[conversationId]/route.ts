import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages/[conversationId] — Get messages in a conversation
// conversationId is the other user's user_id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const otherUserId = Number(conversationId)

    if (!otherUserId || isNaN(otherUserId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const before = searchParams.get('before') // cursor-based pagination
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100)

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

    let query = supabase
      .from('messages')
      .select('message_id, sender_id, receiver_id, content, is_read, created_at')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${uid})`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    // Return in chronological order
    const sorted = (messages ?? []).reverse()

    return NextResponse.json({ messages: sorted })
  } catch (err) {
    console.error('[GET /api/messages/[conversationId]]', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// PATCH /api/messages/[conversationId] — Mark conversation as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const otherUserId = Number(conversationId)

    if (!otherUserId || isNaN(otherUserId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 })
    }

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

    // Mark all messages from other user to current user as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true } as never)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', uid)
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/messages/[conversationId]]', err)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
