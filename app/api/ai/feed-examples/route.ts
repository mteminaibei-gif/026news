import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ai/feed-examples — top published articles (house-style exemplars)
export async function GET() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('articles')
      .select('title, excerpt, views')
      .eq('status', 'published')
      .not('excerpt', 'is', null)
      .order('views', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ examples: [] }, { status: 200 })
    }

    const rows = (data ?? []) as Array<{ title: string; excerpt: string | null }>
    const examples = rows
      .map((a) => ({
        title: a.title,
        excerpt: (a.excerpt ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280),
      }))
      .filter((a) => a.excerpt.length > 40)

    return NextResponse.json({ examples }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[GET /api/ai/feed-examples]', err)
    return NextResponse.json({ examples: [] }, { status: 200 })
  }
}
