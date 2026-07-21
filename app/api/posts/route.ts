import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// NOTE: `posts` / `post_likes` / `post_comments` are defined in
// supabase/migrations/0008_social.sql. The typed client here casts to `any`
// for these tables to avoid deep-instantiation issues with the large
// generated Database type.

// GET /api/posts?feed=home|following&limit=20&cursor=ISO
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const feed = searchParams.get('feed') ?? 'home'
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)
    const cursor = searchParams.get('cursor')

    const supabase = (await createClient()) as any
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    let followingIds: number[] = []
    let savedOnly = feed === 'saved'
    if ((feed === 'following' || savedOnly) && user) {
      const { data: me } = await supabase
        .from('users').select('user_id').eq('auth_id', user.id).single()
      if (me) {
        if (feed === 'following') {
          const { data: links } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', me.user_id)
          followingIds = (links ?? []).map((l: { following_id: number }) => l.following_id)
        }
      } else {
        savedOnly = false
      }
    }

    let query = supabase
      .from('posts')
      .select('*, author:users(user_id,name,profile_image,bio,role)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (feed === 'following' && followingIds.length) {
      query = query.in('user_id', followingIds)
    }
    if (savedOnly) {
      const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user!.id).single()
      const { data: saves } = await supabase.from('post_saves').select('post_id').eq('user_id', me.user_id)
      const ids = (saves ?? []).map((s: { post_id: number }) => s.post_id)
      query = ids.length ? query.in('post_id', ids) : query.eq('post_id', -1)
    }
    if (cursor && !savedOnly) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query
    if (error) throw error

    const posts = (data ?? []) as Array<{
      post_id: number; user_id: number; content: string; image_urls: string[] | null
      tags: string[] | null; like_count: number; comment_count: number; share_count: number
      created_at: string; author: { user_id: number; name: string; profile_image: string | null; bio: string | null; role: string } | null
    }>

    let likedSet = new Set<number>()
    let savedSet = new Set<number>()
    if (user && posts.length) {
      const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
      if (me) {
        const [{ data: likes }, { data: saves }] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', me.user_id)
            .in('post_id', posts.map(p => p.post_id)),
          supabase
            .from('post_saves')
            .select('post_id')
            .eq('user_id', me.user_id)
            .in('post_id', posts.map(p => p.post_id)),
        ])
        likedSet = new Set((likes ?? []).map((l: { post_id: number }) => l.post_id))
        savedSet = new Set((saves ?? []).map((s: { post_id: number }) => s.post_id))
      }
    }

    const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null

    return NextResponse.json({
      posts: posts.map(p => ({ ...p, liked: likedSet.has(p.post_id), saved: savedSet.has(p.post_id) })),
      nextCursor,
    })
  } catch (err) {
    console.error('[GET /api/posts]', err)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

// POST /api/posts  { content, image_urls?, tags? }
export async function POST(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('user_id, name').eq('auth_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const content = (body.content ?? '').toString().trim()
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: profile.user_id,
        content: content.slice(0, 2000),
        image_urls: Array.isArray(body.image_urls) ? body.image_urls.slice(0, 4) : null,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : null,
      })
      .select('*, author:users(user_id,name,profile_image,bio,role)')
      .single()

    if (error) throw error
    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts]', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
