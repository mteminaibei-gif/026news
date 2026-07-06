import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/skimmer
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const [{ count: usersCount }, { count: articlesCount }] = await Promise.all([
      supabase.from('users').select('user_id', { count: 'exact', head: true }),
      supabase.from('articles').select('article_id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      users: usersCount ?? 0,
      articles: articlesCount ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/admin/skimmer] error', err)
    return NextResponse.json({ error: 'Skimmer failed' }, { status: 500 })
  }
}
