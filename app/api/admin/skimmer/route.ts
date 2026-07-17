import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// GET /api/admin/skimmer — admin-only platform counts
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    // ── Queries (use admin client to bypass RLS for accurate counts) ─────────
    const adminClient = await createAdminClient()
    const [{ count: usersCount }, { count: articlesCount }] = await Promise.all([
      adminClient.from('users').select('user_id', { count: 'exact', head: true }),
      adminClient.from('articles').select('article_id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      users:     usersCount ?? 0,
      articles:  articlesCount ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/admin/skimmer] error', err)
    return NextResponse.json({ error: 'Skimmer failed' }, { status: 500 })
  }
}
