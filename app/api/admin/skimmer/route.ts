import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type Profile = { role: string }

// GET /api/admin/skimmer — admin-only platform counts
export async function GET(req: NextRequest) {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email ?? '')
      .single()
    const profile = rawProfile as unknown as Profile | null

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

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
