import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/shares { article_id } -> increments share_count
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    let body: Record<string, unknown>
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const articleId = Number(body.article_id)
    const postId = Number(body.post_id)

    if (postId && !isNaN(postId)) {
      const { data, error } = await (supabase as any)
        .from('posts')
        .select('share_count')
        .eq('post_id', postId)
        .single()
      if (error) throw error
      const next = ((data?.share_count ?? 0) + 1)
      await (supabase as any).from('posts').update({ share_count: next }).eq('post_id', postId)
      return NextResponse.json({ count: next })
    }

    if (!articleId || isNaN(articleId)) {
      return NextResponse.json({ error: 'article_id or post_id required' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('increment_article_shares', { row_id: articleId } as never)

    if (error) throw error

    return NextResponse.json({ count: data })
  } catch (err) {
    console.error('[POST /api/shares]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
