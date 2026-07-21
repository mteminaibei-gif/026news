import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/posts/[id]/like  → toggle like
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

    const { data: existing } = await supabase
      .from('post_likes').select('like_id').eq('post_id', postId).eq('user_id', userId).maybeSingle()

    let liked: boolean
    if (existing) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
      liked = false
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
      liked = true

      const { data: post } = await supabase.from('posts').select('user_id, content').eq('post_id', postId).single()
      const ownerId = post?.user_id
      if (ownerId && ownerId !== userId) {
        const { data: me } = await supabase.from('users').select('name').eq('user_id', userId).single()
        await supabase.from('notifications').insert({
          user_id: ownerId,
          type: 'post_like',
          title: 'New Like',
          message: `${me?.name ?? 'Someone'} liked your post: "${(post?.content ?? '').slice(0, 60)}${(post?.content ?? '').length > 60 ? '…' : ''}"`,
          actor_name: me?.name ?? null,
          actor_id: userId,
          link: `/social?post=${postId}`,
        } as never)
      }
    }

    const { data: post } = await supabase.from('posts').select('like_count').eq('post_id', postId).single()
    return NextResponse.json({ liked, like_count: post?.like_count ?? 0 })
  } catch (err) {
    console.error('[POST /api/posts/[id]/like]', err)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}
