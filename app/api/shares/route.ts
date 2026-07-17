import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/shares { article_id } -> increments share_count
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    let body: Record<string, unknown>
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const articleId = Number(body.article_id)
    if (!articleId || isNaN(articleId)) {
      return NextResponse.json({ error: 'article_id required' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('increment_article_shares', { row_id: articleId } as never)

    if (error) throw error

    return NextResponse.json({ count: data })
  } catch (err) {
    console.error('[POST /api/shares]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
