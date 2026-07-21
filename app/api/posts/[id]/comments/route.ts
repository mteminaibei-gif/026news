import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/posts/[id]/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const postId = Number(id)
    if (!postId) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })

    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, author:users(user_id,name,profile_image)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) throw error

    return NextResponse.json({ comments: data ?? [] })
  } catch (err) {
    console.error('[GET /api/posts/[id]/comments]', err)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

// POST /api/posts/[id]/comments  { comment_text, parent_comment_id? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const postId = Number(id)
    if (!postId) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })

    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const userId = profile.user_id

    const body = await req.json().catch(() => ({}))
    const text = (body.comment_text ?? '').toString().trim()
    if (!text) return NextResponse.json({ error: 'Comment is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        comment_text: text.slice(0, 1000),
        parent_comment_id: body.parent_comment_id ? Number(body.parent_comment_id) : null,
      })
      .select('*, author:users(user_id,name,profile_image)')
      .single()
    if (error) throw error

    const { data: post } = await supabase.from('posts').select('user_id, content').eq('post_id', postId).single()
    const ownerId = post?.user_id
    if (ownerId && ownerId !== userId) {
      const { data: me } = await supabase.from('users').select('name').eq('user_id', userId).single()
      await supabase.from('notifications').insert({
        user_id: ownerId,
        type: 'post_comment',
        title: 'New Comment',
        message: `${me?.name ?? 'Someone'} commented on your post: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
        actor_name: me?.name ?? null,
        actor_id: userId,
        link: `/social?post=${postId}`,
      } as never)
    }

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts/[id]/comments]', err)
    return NextResponse.json({ error: 'Failed to comment' }, { status: 500 })
  }
}
