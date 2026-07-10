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

type ArticleRow = { article_id: number; title: string; slug: string; status: string; featured_image: string | null; views: number; earnings: number; created_at: string }
type EarningsRow = { amount: number; payout_status: string; created_at: string; source: string }
type BadgeRow = { badge_type: string; badge_label: string; awarded_at: string }
type PayoutRow = { amount: number; journalist_cut: number; status: string; period_start: string; period_end: string; payment_method: string }

export default async function JournalistDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { user_id: number; name: string; profile_image: string | null; rank_score: number; badge_level: string | null; total_views: number } | null = null
  if (user) {
    try {
      const { data: rawProfile } = await supabase.from('users').select('user_id, name, profile_image, bio, rank_score, badge_level, total_views').eq('email', user.email ?? '').single() as any
      profile = rawProfile
    } catch { /* ignore */ }
  }
  if (!profile) {
    profile = { user_id: 3, name: user?.email?.split('@')[0] || 'Journalist', profile_image: null, rank_score: 95, badge_level: 'silver', total_views: 87500 }
  }

  let articles: ArticleRow[] = []
  try {
    const { data, error } = await supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at').eq('author_id', profile.user_id).order('created_at', { ascending: false }).limit(20) as any
    if (error) throw error
    articles = data ?? []
  } catch {
    articles = MOCK_ARTICLES.filter(a => a.author_id === profile!.user_id || a.author_id === 3).map(a => ({ article_id: a.article_id, title: a.title, slug: a.slug, status: a.status, featured_image: a.featured_image, views: a.views, earnings: a.earnings, created_at: a.created_at }))
  }

  let earnings: EarningsRow[] = []
  try {
    const { data, error } = await supabase.from('earnings').select('amount, payout_status, created_at, source').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(50) as any
    if (error) throw error
    earnings = data ?? []
  } catch {
    earnings = [{ amount: 50, payout_status: 'paid', created_at: new Date().toISOString(), source: 'ads' }, { amount: 120, payout_status: 'pending', created_at: new Date().toISOString(), source: 'subscriptions' }]
  }

  let badges: BadgeRow[] = []
  try {
    const { data, error } = await supabase.from('journalist_badges').select('badge_type, badge_label, awarded_at').eq('user_id', profile.user_id) as any
    if (error) throw error
    badges = data ?? []
  } catch {
    badges = [{ badge_type: 'silver', badge_label: 'Star Contributor', awarded_at: new Date().toISOString() }]
  }

  let payouts: PayoutRow[] = []
  try {
    const { data, error } = await supabase.from('payout_requests').select('amount, journalist_cut, status, period_start, period_end, payment_method').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5) as any
    if (error) throw error
    payouts = data ?? []
  } catch {
    payouts = [{ amount: 340, journalist_cut: 170, status: 'paid', period_start: '2024-03-01', period_end: '2024-03-31', payment_method: 'mpesa' }]
  }

  const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const published = articles.filter(a => a.status === 'published')
  const drafts = articles.filter(a => a.status === 'draft')
  const underReview = articles.filter(a => a.status === 'under_review')
  const pendingAmount = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)

  const chartData: number[] = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  let totalJournalists = MOCK_USERS.filter(u => u.role === 'journalist').length
  let aboveCount = 1
  try {
    const { count: totJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
    const { count: abvJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never).gt('rank_score', profile.rank_score ?? 0)
    totalJournalists = totJ ?? totalJournalists
    aboveCount = abvJ ?? aboveCount
  } catch { /* ignore */ }
  const rank = aboveCount + 1

  return (
    <>
      <Topbar title="Journalist Dashboard" user={{ name: profile.name, profile_image: profile.profile_image }}>
        <Link href="/journalist/create" className="flex items-center gap-2 px-4 py-2.5 bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow">
          <span>➕</span> New Article
        </Link>
      </Topbar>

      <div className="p-6 space-y-6">
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
            <span className="font-bold text-[#1a5c2a] whitespace-nowrap">🏅 Badges</span>
            {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Views" value={formatNumber(totalViews)} sub="All time" accent="kenya" icon="👁" />
          <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} sub={`This month: ${formatCurrency(monthEarnings)}`} accent="kenya" icon="💰" />
          <StatCard label="Articles" value={published.length} sub={`${drafts.length} drafts`} accent="kenya" icon="📰" />
          <StatCard label="Ranking" value={`#${rank}`} sub={`of ${totalJournalists}`} accent="kenya" icon="🏆" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Articles */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">📰 Your Articles</h3>
                <p className="text-sm text-gray-500">Manage your content</p>
              </div>
              <Link href="/journalist/create" className="px-3 py-1.5 bg-[#1a5c2a] text-white text-sm font-semibold rounded-lg hover:bg-[#2d8a47] transition-colors">
                ➕ New
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
              {articles.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="mb-3">No articles yet</p>
                  <Link href="/journalist/create" className="inline-block px-4 py-2 bg-[#1a5c2a] text-white font-semibold rounded-lg hover:bg-[#2d8a47] transition-colors">
                    Create your first article
                  </Link>
                </div>
              ) : articles.slice(0, 6).map(a => (
                <div key={a.article_id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  {a.featured_image ? (
                    <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-xl">📰</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">{a.title}</p>
                    <p className="text-sm text-gray-500">{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={a.status} />
                    <p className="text-sm font-bold text-[#1a5c2a] mt-1">{formatCurrency(a.earnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">💰 Earnings Overview</h3>
              <p className="text-sm text-gray-500">Last 6 months performance</p>
            </div>
            <div className="p-6">
              <BarChart data={chartData} labels={chartLabels} height={100} />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#1a5c2a]">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#f5c518]">{formatCurrency(monthEarnings)}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#1a5c2a]">{formatCurrency(pendingAmount)}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History */}
        {payouts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">💸 Payout History</h3>
              <p className="text-sm text-gray-500">Your payment records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Your Cut (50%)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payouts.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{p.period_start} → {p.period_end}</td>
                      <td className="px-6 py-4 font-bold text-[#1a5c2a]">{formatCurrency(Number(p.journalist_cut))}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.payment_method}</td>
                      <td className="px-6 py-4"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Ready to publish your next story?</h3>
            <p className="text-white/70 text-sm">Create, submit, and start earning from your journalism today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/journalist/create" className="px-5 py-2.5 bg-[#f5c518] hover:bg-[#e6b800] text-[#1a1a1a] font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              ✏️ New Article
            </Link>
            <Link href="/leaderboard" className="px-5 py-2.5 border-2 border-white/40 text-white font-semibold rounded-xl transition-all hover:bg-white/10">
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}