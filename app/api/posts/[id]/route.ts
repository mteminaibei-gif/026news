import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/posts/[id] → single post with author + comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const postId = Number(id)
    if (!postId) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })

    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(user_id,name,profile_image,bio,role)')
      .eq('post_id', postId)
      .single()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: comments } = await supabase
      .from('post_comments')
      .select('*, author:users(user_id,name,profile_image)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    return NextResponse.json({ post: data, comments: comments ?? [] })
  } catch (err) {
    console.error('[GET /api/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 })
  }
}
