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

type ArticleRow   = { article_id: number; title: string; slug: string; status: string; featured_image: string | null; views: number; earnings: number; created_at: string }
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
      profile = rawProfile as unknown as { user_id: number; name: string; profile_image: string | null; rank_score: number; badge_level: string | null; total_views: number } | null
    } catch { /* ignore */ }
  }
  if (!profile) {
    profile = { user_id: 3, name: user?.email?.split('@')[0] || 'Journalist', profile_image: null, rank_score: 95, badge_level: 'silver', total_views: 87500 }
  }

  let articles: ArticleRow[] = []
  try {
    const { data, error } = await supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at').eq('author_id', profile.user_id).order('created_at', { ascending: false }).limit(20) as any
    if (error) throw error
    articles = (data ?? []) as unknown as ArticleRow[]
  } catch {
    articles = MOCK_ARTICLES.filter(a => a.author_id === profile!.user_id || a.author_id === 3).map(a => ({ article_id: a.article_id, title: a.title, slug: a.slug, status: a.status, featured_image: a.featured_image, views: a.views, earnings: a.earnings, created_at: a.created_at }))
  }

  let earnings: EarningsRow[] = []
  try {
    const { data, error } = await supabase.from('earnings').select('amount, payout_status, created_at, source').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(50) as any
    if (error) throw error
    earnings = (data ?? []) as unknown as EarningsRow[]
  } catch {
    earnings = [{ amount: 50, payout_status: 'paid', created_at: new Date().toISOString(), source: 'ads' }, { amount: 120, payout_status: 'pending', created_at: new Date().toISOString(), source: 'subscriptions' }]
  }

  let badges: BadgeRow[] = []
  try {
    const { data, error } = await supabase.from('journalist_badges').select('badge_type, badge_label, awarded_at').eq('user_id', profile.user_id) as any
    if (error) throw error
    badges = (data ?? []) as unknown as BadgeRow[]
  } catch {
    badges = [{ badge_type: 'silver', badge_label: 'Star Contributor', awarded_at: new Date().toISOString() }]
  }

  let payouts: PayoutRow[] = []
  try {
    const { data, error } = await supabase.from('payout_requests').select('amount, journalist_cut, status, period_start, period_end, payment_method').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5) as any
    if (error) throw error
    payouts = (data ?? []) as unknown as PayoutRow[]
  } catch {
    payouts = [{ amount: 340, journalist_cut: 170, status: 'paid', period_start: '2024-03-01', period_end: '2024-03-31', payment_method: 'mpesa' }]
  }

  const totalViews    = articles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth     = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const published     = articles.filter(a => a.status === 'published')
  const drafts        = articles.filter(a => a.status === 'draft')
  const underReview   = articles.filter(a => a.status === 'under_review')
  const pendingAmount = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)

  const chartData: number[]   = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
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
        <Link href="/journalist/create"
          className="text-xs md:text-sm font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-3 md:px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
          ➕ New Article
        </Link>
      </Topbar>

      <div className="p-4 md:p-6 flex-1 space-y-4 md:space-y-6 overflow-y-auto">

        {/* Badges strip - Mobile responsive */}
        {badges.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-3 md:p-4 flex flex-wrap items-center gap-2 md:gap-3 overflow-x-auto">
            <span className="text-sm font-bold text-[#1a5c2a] whitespace-nowrap">🏅 Your Badges</span>
            {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
          </div>
        )}

        {/* Stats - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <StatCard label="Total Views"    value={formatNumber(totalViews)}      sub="👁 All published articles"                               accent="green" icon="👁" />
          <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} sub={`This month: ${formatCurrency(monthEarnings)}`}          accent="gold"  icon="💰" />
          <StatCard label="Articles"       value={published.length}              sub={`Drafts: ${drafts.length} · Review: ${underReview.length}`} accent="green" icon="📰" />
          <StatCard label="Ranking"        value={`#${rank}`}                   sub={`of ${totalJournalists} journalists`}                    accent="green" icon="🏆" />
        </div>

        {/* Articles + Earnings - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-3 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] flex items-center justify-between gap-2 bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">📰 Recent Articles</h2>
              <Link href="/journalist/create"
                className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-2 md:px-3 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap">
                ➕ New
              </Link>
            </div>
            <div className="divide-y divide-[#f0faf2] max-h-[300px] overflow-y-auto">
              {articles.length === 0 ? (
                <div className="p-4 md:p-6 text-center text-gray-400 text-sm">
                  No articles yet.{' '}
                  <Link href="/journalist/create" className="text-[#1a5c2a] font-semibold hover:underline">Create your first!</Link>
                </div>
              ) : articles.slice(0, 6).map(a => (
                <div key={a.article_id} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 hover:bg-[#f9fdf9] transition-all duration-300">
                  {a.featured_image ? (
                    <div className="relative w-10 md:w-12 h-8 md:h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 md:w-12 h-8 md:h-10 rounded-lg bg-[#f0faf2] shrink-0 flex items-center justify-center text-base md:text-lg">📰</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                  </div>
                  <Badge status={a.status} />
                  <span className="text-xs md:text-sm font-bold text-[#1a5c2a] shrink-0 whitespace-nowrap">{formatCurrency(a.earnings)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-3 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">💰 Earnings — Last 6 Months</h2>
            </div>
            <div className="px-3 md:px-5 pt-3 pb-4">
              <BarChart data={chartData} labels={chartLabels} height={80} />
              <hr className="my-3 md:my-4 border-[#f0faf2]" />
              <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                <div>
                  <p className="text-sm md:text-base font-extrabold text-[#1a5c2a]">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-sm md:text-base font-extrabold text-[#f5c518]">{formatCurrency(monthEarnings)}</p>
                  <p className="text-xs text-gray-400">This Month</p>
                </div>
                <div>
                  <p className="text-sm md:text-base font-extrabold text-[#1a5c2a]">{formatCurrency(pendingAmount)}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout history - Horizontal scroll on mobile */}
        {payouts.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-3 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">💸 Payout History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm min-w-max">
                <thead>
                  <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                    <th className="px-2 md:px-4 py-2.5 text-left">Period</th>
                    <th className="px-2 md:px-4 py-2.5 text-left">Your Cut (50%)</th>
                    <th className="px-2 md:px-4 py-2.5 text-left">Method</th>
                    <th className="px-2 md:px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0faf2]">
                  {payouts.map((p, i) => (
                    <tr key={i} className="hover:bg-[#f9fdf9] transition-all duration-300">
                      <td className="px-2 md:px-4 py-3 text-gray-600 text-xs md:text-sm">{p.period_start} → {p.period_end}</td>
                      <td className="px-2 md:px-4 py-3 font-bold text-[#1a5c2a] text-xs md:text-sm">{formatCurrency(Number(p.journalist_cut))}</td>
                      <td className="px-2 md:px-4 py-3 text-gray-500 capitalize text-xs md:text-sm">{p.payment_method}</td>
                      <td className="px-2 md:px-4 py-3"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA banner - Mobile responsive */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 shadow-md">
          <div>
            <h3 className="text-white font-bold text-sm md:text-base mb-1">Ready to publish your next story?</h3>
            <p className="text-white/70 text-xs md:text-sm">Create, submit, and start earning from your journalism today.</p>
          </div>
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <Link href="/journalist/create"
              className="bg-[#f5c518] hover:bg-[#e6b800] text-[#1a1a1a] font-bold px-3 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
              ✏️ New Article
            </Link>
            <Link href="/leaderboard"
              className="border border-white/40 text-white hover:bg-white/10 font-semibold px-3 md:px-5 py-2 md:py-3 rounded-xl text-xs md:text-sm transition-all duration-300 whitespace-nowrap">
              🏆 Leaderboard
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}
