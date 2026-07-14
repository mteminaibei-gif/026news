import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/analytics/view — increment article view count
export async function POST(req: NextRequest) {
  try {
    const { article_id } = await req.json()
    if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

    const supabase = await createClient()
    await supabase.rpc('increment_article_views' as never, { p_article_id: article_id } as never)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
