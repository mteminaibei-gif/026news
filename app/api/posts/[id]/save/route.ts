import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/posts/[id]/save → toggle bookmark
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
      .from('post_saves').select('save_id').eq('post_id', postId).eq('user_id', userId).maybeSingle()

    let saved: boolean
    if (existing) {
      await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId)
      saved = false
    } else {
      await supabase.from('post_saves').insert({ post_id: postId, user_id: userId })
      saved = true
    }

    return NextResponse.json({ saved })
  } catch (err) {
    console.error('[POST /api/posts/[id]/save]', err)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}
