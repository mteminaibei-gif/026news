import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/communities/[id]/posts
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('thread_posts')
      .select('*, author:users(user_id,name,profile_image,bio,role)')
      .eq('thread_id', id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return NextResponse.json({ posts: data ?? [] })
  } catch (err) {
    console.error('[GET /api/communities/[id]/posts]', err)
    return NextResponse.json({ error: 'Failed to load community posts' }, { status: 500 })
  }
}

// POST /api/communities/[id]/posts  { content, image_urls? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Must be a member
    const { data: me } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single()
    if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const { data: member } = await supabase
      .from('thread_members').select('thread_id').eq('thread_id', id).eq('user_id', me.user_id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'Join the community first' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const content = (body.content ?? '').toString().trim()
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('thread_posts')
      .insert({
        thread_id: id,
        user_id: me.user_id,
        content: content.slice(0, 2000),
        image_urls: Array.isArray(body.image_urls) ? body.image_urls.slice(0, 4) : null,
      })
      .select('*, author:users(user_id,name,profile_image,bio,role)')
      .single()
    if (error) throw error
    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/communities/[id]/posts]', err)
    return NextResponse.json({ error: 'Failed to post' }, { status: 500 })
  }
}
