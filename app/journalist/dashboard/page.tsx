import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import { BadgePill } from '@/components/ui/BadgePill'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = { title: 'Journalist Dashboard' }

type ArticleRow = {
  article_id: number; title: string; slug: string; status: string
  featured_image: string | null; views: number; earnings: number; created_at: string
}
type EarningsRow  = { amount: number; payout_status: string; created_at: string; source: string }
type BadgeRow     = { badge_type: string; badge_label: string; awarded_at: string }
type PayoutRow    = { amount: number; journalist_cut: number; status: string; period_start: string; period_end: string; payment_method: string }

export default async function JournalistDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    try {
      const { data: rawProfile } = await supabase
        .from('users')
        .select('user_id, name, profile_image, bio, rank_score, badge_level, total_views')
        .eq('email', user.email ?? '')
        .single()
      profile = rawProfile as unknown as {
        user_id: number; name: string; profile_image: string | null
        rank_score: number; badge_level: string | null; total_views: number
      } | null
    } catch {
      // ignore
    }
  }

  // Fallback if not found/error
  if (!profile) {
    profile = {
      user_id: 3, // fallback Sarah Mitchell
      name: user?.email?.split('@')[0] || 'Journalist',
      profile_image: null,
      rank_score: 95,
      badge_level: 'silver',
      total_views: 87500
    }
  }

  // Articles
  let articles: ArticleRow[] = []
  try {
    const { data: rawArticles, error } = await supabase
      .from('articles')
      .select('article_id, title, slug, status, featured_image, views, earnings, created_at')
      .eq('author_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(20) as any
    if (error) throw error
    articles = (rawArticles ?? []) as unknown as ArticleRow[]
  } catch (err) {
    console.warn('Dashboard articles query failed, falling back to mock data:', err)
    articles = MOCK_ARTICLES.filter(a => a.author_id === profile!.user_id || a.author_id === 3).map(a => ({
      article_id: a.article_id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      featured_image: a.featured_image,
      views: a.views,
      earnings: a.earnings,
      created_at: a.created_at
    }))
  }

  // Earnings
  let earnings: EarningsRow[] = []
  try {
    const { data: rawEarnings, error } = await supabase
      .from('earnings')
      .select('amount, payout_status, created_at, source')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(50) as any
    if (error) throw error
    earnings = (rawEarnings ?? []) as unknown as EarningsRow[]
  } catch (err) {
    console.warn('Dashboard earnings query failed, falling back to mock data:', err)
    earnings = [
      { amount: 50.00, payout_status: 'paid', created_at: new Date().toISOString(), source: 'ads' },
      { amount: 120.00, payout_status: 'pending', created_at: new Date().toISOString(), source: 'subscriptions' }
    ]
  }

  // Badges
  let badges: BadgeRow[] = []
  try {
    const { data: rawBadges, error } = await supabase
      .from('journalist_badges')
      .select('badge_type, badge_label, awarded_at')
      .eq('user_id', profile.user_id) as any
    if (error) throw error
    badges = (rawBadges ?? []) as unknown as BadgeRow[]
  } catch (err) {
    console.warn('Dashboard badges query failed, falling back to mock data:', err)
    badges = [
      { badge_type: 'silver', badge_label: 'Star Contributor', awarded_at: new Date().toISOString() }
    ]
  }

  // Payout history
  let payouts: PayoutRow[] = []
  try {
    const { data: rawPayouts, error } = await supabase
      .from('payout_requests')
      .select('amount, journalist_cut, status, period_start, period_end, payment_method')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(5) as any
    if (error) throw error
    payouts = (rawPayouts ?? []) as unknown as PayoutRow[]
  } catch (err) {
    console.warn('Dashboard payouts query failed, falling back to mock data:', err)
    payouts = [
      { amount: 340.00, journalist_cut: 170.00, status: 'paid', period_start: '2024-03-01', period_end: '2024-03-31', payment_method: 'mpesa' }
    ]
  }

  // Compute stats
  const totalViews    = articles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth     = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const published     = articles.filter(a => a.status === 'published')
  const drafts        = articles.filter(a => a.status === 'draft')
  const underReview   = articles.filter(a => a.status === 'under_review')

  // Monthly earnings chart (last 6 months)
  const chartData: number[] = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  // Journalist rank (position by rank_score)
  let totalJournalists = 0
  let aboveCount = 0
  try {
    const { count: totJ, error: errJ } = await supabase
      .from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
    const { count: abvJ, error: errAbv } = await supabase
      .from('users').select('user_id', { count: 'exact', head: true })
      .eq('role', 'journalist' as never)
      .gt('rank_score', profile.rank_score ?? 0)
    if (errJ || errAbv) throw errJ || errAbv
    totalJournalists = totJ ?? 0
    aboveCount = abvJ ?? 0
  } catch {
    totalJournalists = MOCK_USERS.filter(u => u.role === 'journalist').length
    aboveCount = 1
  }
  const rank = (aboveCount ?? 0) + 1

  return (
    <>
      <Topbar title="Journalist Dashboard" user={{ name: profile.name, profile_image: profile.profile_image }}>
        <Link href="/journalist/create" className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          + New Article
        </Link>
      </Topbar>

      <div className="p-6 flex-1 space-y-6">

        {/* Badges strip */}
        {badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">🏅 Your Badges</span>
            {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Total Views"       value={formatNumber(totalViews)}       sub="👁 All published articles"    accent="blue"   icon="👁" />
          <StatCard label="Total Earnings"    value={formatCurrency(totalEarnings)}  sub={`This month: ${formatCurrency(monthEarnings)}`} accent="orange" icon="💰" />
          <StatCard label="Articles"          value={published.length}              sub={`Drafts: ${drafts.length} · Review: ${underReview.length}`} accent="green"  icon="📰" />
          <StatCard label="Ranking"           value={`#${rank}`}                    sub={`of ${totalJournalists ?? '?'} journalists`}   accent="blue"   icon="🏆" />
        </div>

        {/* Articles + Earnings chart */}
        <div className="grid lg:grid-cols-2 gap-5">

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">📰 Recent Articles</h2>
              <Link href="/journalist/create" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                + New
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {articles.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No articles yet. <Link href="/journalist/create" className="text-blue-600">Create your first!</Link>
                </div>
              ) : articles.slice(0, 6).map(a => (
                <div key={a.article_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  {a.featured_image ? (
                    <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-10 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                  </div>
                  <Badge status={a.status} />
                  <span className="text-sm font-bold text-emerald-600 shrink-0">{formatCurrency(a.earnings)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">💰 Earnings — Last 6 Months</h2>
            </div>
            <div className="px-5 pt-3 pb-4">
              <BarChart data={chartData} labels={chartLabels} height={80} />
              <hr className="my-4 border-gray-100" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-base font-extrabold text-gray-900">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-orange-500">{formatCurrency(monthEarnings)}</p>
                  <p className="text-xs text-gray-400">This Month</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-emerald-600">
                    {formatCurrency(earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0))}
                  </p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout history */}
        {payouts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">💸 Payout History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Period</th>
                    <th className="px-4 py-2.5 text-left">Your Cut (50%)</th>
                    <th className="px-4 py-2.5 text-left">Method</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payouts.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{p.period_start} → {p.period_end}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(Number(p.journalist_cut))}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method}</td>
                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-base mb-1">Ready to publish your next story?</h3>
            <p className="text-white/60 text-sm">Create, submit, and start earning from your journalism today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/journalist/create" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shrink-0">
              ✏️ New Article
            </Link>
            <Link href="/leaderboard" className="border border-white/30 text-white hover:bg-white/10 font-semibold px-5 py-3 rounded-xl text-sm transition-colors shrink-0">
              🏆 Leaderboard
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}
