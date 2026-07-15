import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/analytics/view — increment article view count
export async function POST(req: NextRequest) {
  try {
    let body: { article_id?: number }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { article_id } = body
    if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase.rpc('increment_article_views' as never, { p_article_id: article_id } as never)

    if (error) {
      console.error('[analytics/view]', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/analytics/view]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
