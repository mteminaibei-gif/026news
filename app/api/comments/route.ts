import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── rate limiter: 20 comments/IP/min ──────────────────────
const limiter = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const e   = limiter.get(ip)
  if (!e || now > e.reset) { limiter.set(ip, { count: 1, reset: now + 60_000 }); return true }
  if (e.count >= 20) return false
  e.count++
  return true
}

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/** Strip HTML tags and control characters */
function sanitize(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .trim()
}

type Profile = { user_id: number }

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests — wait a minute.' }, {
      status: 429, headers: { 'Retry-After': '60' },
    })
  }

  // Require JSON content-type (CSRF guard)
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to comment.' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const article_id   = Number(body.article_id)
    const comment_text = sanitize(String(body.comment_text ?? '')).substring(0, 2000)

    if (!article_id || isNaN(article_id)) {
      return NextResponse.json({ error: 'article_id must be a valid number.' }, { status: 400 })
    }
    if (!comment_text) {
      return NextResponse.json({ error: 'comment_text is required.' }, { status: 400 })
    }
    if (comment_text.length < 2) {
      return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 })
    }

    // Resolve user_id
    const { data: rawProfile } = await supabase
      .from('users').select('user_id').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as Profile | null
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 403 })
    }

    // Verify article exists and is published
    const { data: rawArticle } = await supabase
      .from('articles').select('article_id, status').eq('article_id', article_id).single()
    const article = rawArticle as unknown as { article_id: number; status: string } | null
    if (!article) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
    }
    if (article.status !== 'published') {
      return NextResponse.json({ error: 'Cannot comment on unpublished article.' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        article_id,
        user_id:      profile.user_id,
        comment_text,
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const article_id = Number(searchParams.get('article_id'))
  if (!article_id) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('comments')
      .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
      .eq('article_id', article_id)
      .eq('status', 'visible' as never)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[GET /api/comments]', err)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// DELETE /api/comments?id=xxx - Delete own comment
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const commentId = Number(searchParams.get('id'))

  if (!commentId || isNaN(commentId)) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })
    }

    // Get user's profile
    const { data: rawProfile } = await supabase
      .from('users').select('user_id, role').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as { user_id: number; role: string } | null
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    // Check if comment exists and belongs to user (or user is admin)
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('comment_id', commentId)
      .single() as { data: { user_id: number } | null }

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only allow delete if user owns comment or is admin
    if (existingComment.user_id !== profile.user_id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', commentId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/comments]', err)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}

// PUT /api/comments?id=xxx - Update own comment
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const commentId = Number(searchParams.get('id'))

  if (!commentId || isNaN(commentId)) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
  }

  // Require JSON content-type
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const newCommentText = sanitize(String(body.comment_text ?? '')).substring(0, 2000)
    if (!newCommentText || newCommentText.length < 2) {
      return NextResponse.json({ error: 'Comment text is required and must be at least 2 characters' }, { status: 400 })
    }

    // Get user's profile
    const { data: rawProfile } = await supabase
      .from('users').select('user_id').eq('email', user.email ?? '').single()
    const profile = rawProfile as unknown as { user_id: number } | null
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    // Check if comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('comment_id', commentId)
      .single() as { data: { user_id: number } | null }

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.user_id !== profile.user_id) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ comment_text: newCommentText } as never)
      .eq('comment_id', commentId)
      .select('comment_id, comment_text, created_at, user:users(name,profile_image)')
      .single()

    if (error) throw error

    return NextResponse.json(comment)
  } catch (err) {
    console.error('[PUT /api/comments]', err)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
