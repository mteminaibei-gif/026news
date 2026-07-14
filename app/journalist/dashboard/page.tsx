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

export const metadata: Metadata = { title: 'Author Dashboard' }

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
    profile = { user_id: 3, name: user?.email?.split('@')[0] || 'Author', profile_image: null, rank_score: 95, badge_level: 'silver', total_views: 87500 }
  }

  let articles: ArticleRow[] = []
  try {
    const { data, error } = await supabase.from('articles').select('article_id, title, slug, status, featured_image, views, earnings, created_at').eq('author_id', profile.user_id).order('created_at', { ascending: false }).limit(20) as any
    if (error) throw error
    articles = data ?? []
  } catch {
    articles = []
  }

  let earnings: EarningsRow[] = []
  try {
    const { data, error } = await supabase.from('earnings').select('amount, payout_status, created_at, source').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(50) as any
    if (error) throw error
    earnings = data ?? []
  } catch {
    earnings = []
  }

  let badges: BadgeRow[] = []
  try {
    const { data, error } = await supabase.from('journalist_badges').select('badge_type, badge_label, awarded_at').eq('user_id', profile.user_id) as any
    if (error) throw error
    badges = data ?? []
  } catch {
    badges = []
  }

  let payouts: PayoutRow[] = []
  try {
    const { data, error } = await supabase.from('payout_requests').select('amount, journalist_cut, status, period_start, period_end, payment_method').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5) as any
    if (error) throw error
    payouts = data ?? []
  } catch {
    payouts = []
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

  let totalJournalists = 0
  let aboveCount = 0
  try {
    const { count: totJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never)
    const { count: abvJ } = await supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never).gt('rank_score', profile.rank_score ?? 0)
    totalJournalists = totJ ?? 0
    aboveCount = abvJ ?? 0
  } catch { /* ignore */ }
  const rank = aboveCount + 1

  return (
    <>
      <Topbar title="Author Dashboard" user={{ name: profile.name, profile_image: profile.profile_image }}>
        <Link href="/journalist/create" className="flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl transition-all shadow-sm hover:shadow" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
          <span>➕</span> New Article
        </Link>
      </Topbar>

      <div className="p-6 space-y-6">
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl shadow-sm overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <span className="font-bold whitespace-nowrap" style={{ color: 'var(--primary)' }}>🏅 Badges</span>
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
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📰 Your Articles</h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Manage your content</p>
              </div>
              <Link href="/journalist/create" className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                ➕ New
              </Link>
            </div>
            <div className="max-h-[320px] overflow-y-auto" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {articles.length === 0 ? (
                <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  <p className="mb-3">No articles yet</p>
                  <Link href="/journalist/create" className="inline-block px-4 py-2 font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                    Create your first article
                  </Link>
                </div>
              ) : articles.slice(0, 6).map(a => (
                <div key={a.article_id} className="px-6 py-4 flex items-center gap-4 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {a.featured_image ? (
                    <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-11 rounded-lg flex items-center justify-center text-xl" style={{ background: 'var(--bg-muted)' }}>📰</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={a.status} />
                    <p className="text-sm font-bold mt-1" style={{ color: 'var(--primary)' }}>{formatCurrency(a.earnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>💰 Earnings Overview</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Last 6 months performance</p>
            </div>
            <div className="p-6">
              <BarChart data={chartData} labels={chartLabels} height={100} />
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{formatCurrency(monthEarnings)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(pendingAmount)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History */}
        {payouts.length > 0 && (
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>💸 Payout History</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Your payment records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--bg-muted)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Your Cut (50%)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, i) => (
                    <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.period_start} → {p.period_end}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(p.journalist_cut))}</td>
                      <td className="px-6 py-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</td>
                      <td className="px-6 py-4"><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}>
          <div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-inverse)' }}>Ready to publish your next story?</h3>
            <p className="text-sm" style={{ color: 'var(--text-inverse)', opacity: 0.7 }}>Create, submit, and start earning from your writing today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/journalist/create" className="px-5 py-2.5 font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}>
              ✏️ New Article
            </Link>
            <Link href="/leaderboard" className="px-5 py-2.5 font-semibold rounded-xl transition-all hover:bg-white/10" style={{ border: '2px solid rgba(255,255,255,0.4)', color: 'var(--text-inverse)' }}>
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
