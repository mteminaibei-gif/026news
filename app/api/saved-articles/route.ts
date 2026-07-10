import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/saved-articles
 * Fetch user's saved articles with pagination
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', user.email ?? '')
    .single()

  if (!userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  const userId = (userProfile as any).user_id

  // Get query params
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const offset = page * limit

  // Fetch saved articles count
  const { count } = await (supabase as any)
    .from('saved_articles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Fetch saved articles data with offset/limit
  const { data: savedArticles, error } = await (supabase as any)
    .from('saved_articles')
    .select('saved_id, saved_at, notes, article_id')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[GET /api/saved-articles] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: savedArticles,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      pages: Math.ceil((count ?? 0) / limit),
    },
  })
}

/**
 * POST /api/saved-articles
 * Save an article
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { article_id, notes } = await req.json()

  if (!article_id) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 })
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('user_id')
    .eq('email', user.email ?? '')
    .single()

  if (!userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  const userId = (userProfile as any).user_id

  // Save article
  const { data, error } = await (supabase as any)
    .from('saved_articles')
    .insert({
      user_id: userId,
      article_id,
      notes: notes || null,
    })
    .select()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Article already saved' }, { status: 409 })
    }
    console.error('[POST /api/saved-articles] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0] || {}, { status: 201 })
}

/**
 * DELETE /api/saved-articles
 * Remove a saved article
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { saved_id } = await req.json()

  if (!saved_id) {
    return NextResponse.json({ error: 'saved_id is required' }, { status: 400 })
  }

  // Delete saved article
  const { error } = await (supabase as any)
    .from('saved_articles')
    .delete()
    .eq('saved_id', saved_id)

  if (error) {
    console.error('[DELETE /api/saved-articles] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
