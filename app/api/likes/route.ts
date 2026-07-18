import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/likes?article_id=123 -> { count, liked }
// Public: count is always returned; `liked` reflects the current user.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const articleId = Number(searchParams.get('article_id'))
  if (!articleId) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: art } = await supabase
      .from('articles')
      .select('like_count')
      .eq('article_id', articleId)
      .single()

    const count = (art as unknown as { like_count: number } | null)?.like_count ?? 0
    let liked = false

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single()
      if (prof) {
        const userId = (prof as unknown as { user_id: number }).user_id
        const { data: like } = await supabase
          .from('article_likes')
          .select('like_id')
          .eq('article_id', articleId)
          .eq('user_id', userId)
          .maybeSingle()
        liked = !!like
      }
    }

    return NextResponse.json({ count, liked }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[GET /api/likes]', err)
    return NextResponse.json({ error: 'Failed to fetch like state' }, { status: 500 })
  }
}

// POST /api/likes { article_id } -> toggles the current user's like.
// Requires authentication (401 otherwise).
export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to like.' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const articleId = Number(body.article_id)
    if (!articleId || isNaN(articleId)) {
      return NextResponse.json({ error: 'article_id must be a valid number.' }, { status: 400 })
    }

    const { data: prof } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single()
    if (!prof) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 403 })
    }
    const userId = (prof as unknown as { user_id: number }).user_id

    const { data: art } = await supabase
      .from('articles')
      .select('article_id, status')
      .eq('article_id', articleId)
      .single()
    if (!art) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
    }
    if ((art as unknown as { status: string }).status !== 'published') {
      return NextResponse.json({ error: 'Cannot like an unpublished article.' }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from('article_likes')
      .select('like_id')
      .eq('article_id', articleId)
      .eq('user_id', userId)
      .maybeSingle()

    let liked: boolean
    if (existing) {
      await supabase.from('article_likes').delete().eq('article_id', articleId).eq('user_id', userId)
      liked = false
    } else {
      await supabase.from('article_likes').insert({ article_id: articleId, user_id: userId } as never)
      liked = true
    }

    const { data: updated } = await supabase
      .from('articles')
      .select('like_count')
      .eq('article_id', articleId)
      .single()

    return NextResponse.json({
      liked,
      count: (updated as unknown as { like_count: number } | null)?.like_count ?? 0,
    })
  } catch (err) {
    console.error('[POST /api/likes]', err)
    return NextResponse.json({ error: 'Failed to update like.' }, { status: 500 })
  }
}
