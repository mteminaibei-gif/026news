import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ArticleRow   = { article_id: number; status: string; views: number; earnings: number; created_at: string }
type EarningRow   = { amount: number; payout_status: string; source: string; created_at: string }
type AnalyticsRow = { likes: number; shares: number; comments_count: number }
type RevenueRow   = { amount: number; payout_status: string }
type TopArticle   = { article_id: number; title: string; views: number; earnings: number; author: { name: string } | null }
type Profile      = { user_id: number; role: string }

// GET /api/analytics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authorId = searchParams.get('author_id')

  try {
    const supabase = await createClient()

    // ── Auth check ───────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfile } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('email', user.email ?? '')
      .single()
    const profile = rawProfile as unknown as Profile | null

    if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 403 })

    // Journalists can only request their own analytics
    if (profile.role === 'journalist') {
      if (!authorId || Number(authorId) !== profile.user_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Journalist analytics ─────────────────────────────────────────────────
    if (authorId) {
      const { data: rawArticles } = await supabase
        .from('articles')
        .select('article_id, status, views, earnings, created_at')
        .eq('author_id', Number(authorId))
      const articles = (rawArticles ?? []) as unknown as ArticleRow[]

      const { data: rawEarnings } = await supabase
        .from('earnings')
        .select('amount, payout_status, source, created_at')
        .eq('user_id', Number(authorId))
      const earningsRows = (rawEarnings ?? []) as unknown as EarningRow[]

      const articleIds = articles.map(a => a.article_id)
      let analyticsRows: AnalyticsRow[] = []
      if (articleIds.length > 0) {
        const { data: rawAn } = await supabase
          .from('analytics')
          .select('likes, shares, comments_count')
          .in('article_id', articleIds)
        analyticsRows = (rawAn ?? []) as unknown as AnalyticsRow[]
      }

      const totalViews    = articles.reduce((s, a) => s + (a.views ?? 0), 0)
      const totalEarnings = earningsRows.reduce((s, e) => s + Number(e.amount), 0)
      const thisMonth     = new Date().toISOString().slice(0, 7)
      const thisMonthEarnings = earningsRows
        .filter(e => e.created_at.startsWith(thisMonth))
        .reduce((s, e) => s + Number(e.amount), 0)

      return NextResponse.json({
        totalViews,
        totalEarnings,
        thisMonthEarnings,
        published:     articles.filter(a => a.status === 'published').length,
        drafts:        articles.filter(a => a.status === 'draft').length,
        underReview:   articles.filter(a => a.status === 'under_review').length,
        totalLikes:    analyticsRows.reduce((s, a) => s + (a.likes ?? 0), 0),
        totalShares:   analyticsRows.reduce((s, a) => s + (a.shares ?? 0), 0),
        totalComments: analyticsRows.reduce((s, a) => s + (a.comments_count ?? 0), 0),
      })
    }

    // ── Platform-wide analytics (admin only) ─────────────────────────────────
    const [
      { count: totalArticles },
      { count: totalUsers },
      { count: pendingArticles },
      { data: rawRevenue },
      { data: rawTopArticles },
    ] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'under_review' as never),
      supabase.from('earnings').select('amount, payout_status'),
      supabase.from('articles')
        .select('article_id, title, views, earnings, author:users(name)')
        .eq('status', 'published' as never)
        .order('views', { ascending: false })
        .limit(5),
    ])

    const revenueRows = (rawRevenue ?? []) as unknown as RevenueRow[]
    const topArticles = (rawTopArticles ?? []) as unknown as TopArticle[]

    const totalRevenue  = revenueRows.reduce((s, e) => s + Number(e.amount), 0)
    const pendingPayout = revenueRows
      .filter(e => e.payout_status === 'pending')
      .reduce((s, e) => s + Number(e.amount), 0)

    return NextResponse.json({
      totalArticles:   totalArticles ?? 0,
      totalUsers:      totalUsers ?? 0,
      pendingArticles: pendingArticles ?? 0,
      totalRevenue,
      pendingPayout,
      topArticles,
      traffic: {
        months:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        visitors: [30000,45000,38000,55000,60000,50000,72000,80000,75000,90000,85000,120000],
        earnings: [800,1200,950,1500,1400,1800,1650,2100,1900,2300,2100,2800],
      },
    })
  } catch (err) {
    console.error('[GET /api/analytics]', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
