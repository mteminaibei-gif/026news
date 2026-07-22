import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type TrackBody = {
  type: 'pageview' | 'heartbeat' | 'leave' | 'ad_impression' | 'ad_click' | 'event'
  session_id?: string
  page?: string
  ad_id?: string
  slot?: string
  event?: string
  [key: string]: unknown
}

const PAGE_VIEWS: Record<string, { count: number; last: number }> = {}
const ACTIVE_SESSIONS: Map<string, { last: number; page: string }> = new Map()
const AD_STATS: Record<string, { impressions: number; clicks: number }> = {}

function cleanup() {
  const now = Date.now()
  for (const [k, v] of Object.entries(PAGE_VIEWS)) {
    if (now - v.last > 24 * 60 * 60 * 1000) delete PAGE_VIEWS[k]
  }
  for (const [k, v] of ACTIVE_SESSIONS) {
    if (now - v.last > 60_000) ACTIVE_SESSIONS.delete(k)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackBody = await req.json()
    const { type, session_id } = body
    const now = Date.now()

    cleanup()

    if (session_id) {
      if (type === 'leave') {
        ACTIVE_SESSIONS.delete(session_id)
      } else {
        ACTIVE_SESSIONS.set(session_id, { last: now, page: body.page ?? '/' })
      }
    }

    switch (type) {
      case 'pageview': {
        const page = body.page ?? '/'
        PAGE_VIEWS[page] = { count: (PAGE_VIEWS[page]?.count ?? 0) + 1, last: now }
        break
      }
      case 'ad_impression': {
        const key = body.ad_id ?? 'unknown'
        if (!AD_STATS[key]) AD_STATS[key] = { impressions: 0, clicks: 0 }
        AD_STATS[key].impressions++
        break
      }
      case 'ad_click': {
        const key = body.ad_id ?? 'unknown'
        if (!AD_STATS[key]) AD_STATS[key] = { impressions: 0, clicks: 0 }
        AD_STATS[key].clicks++
        break
      }
    }

    // Persist to Supabase page_views table (best-effort)
    if (type === 'pageview' && body.page) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let userId: number | null = null
        if (user) {
          const { data: profile } = await (supabase.from('users') as any)
            .select('user_id').eq('auth_id', user.id).maybeSingle()
          userId = profile?.user_id ?? null
        }
        const client = supabase as any
        await client.from('page_views').insert({
          page_path: body.page,
          user_id: userId,
          session_id: session_id ?? null,
        })
      } catch { /* best-effort */ }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  cleanup()

  const activeCount = ACTIVE_SESSIONS.size
  const pageViewEntries = Object.entries(PAGE_VIEWS)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 50)
    .map(([page, { count }]) => ({ page, count }))

  const totalViews = Object.values(PAGE_VIEWS).reduce((s, v) => s + v.count, 0)

  return NextResponse.json({
    activeUsers: activeCount,
    totalViews,
    pageViews: pageViewEntries,
    adStats: AD_STATS,
  })
}
