import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { user_id: number }

// POST /api/comments — submit a comment on an article
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to comment.' }, { status: 401 })
    }

    const { article_id, comment_text } = await req.json()

    if (!article_id || !comment_text?.trim()) {
      return NextResponse.json({ error: 'article_id and comment_text are required.' }, { status: 400 })
    }
    if (comment_text.trim().length > 2000) {
      return NextResponse.json({ error: 'Comment must be under 2000 characters.' }, { status: 400 })
    }

    // Resolve user_id from email
    const { data: rawProfile } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email ?? '')
      .single()
    const profile = rawProfile as unknown as Profile | null

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        article_id:   Number(article_id),
        user_id:      profile.user_id,
        comment_text: comment_text.trim(),
        status:       'visible',
      } as never)
      .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
      .single()

    if (error) throw error

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('[POST /api/comments]', err)
    return NextResponse.json({ error: 'Failed to post comment.' }, { status: 500 })
  }
}
