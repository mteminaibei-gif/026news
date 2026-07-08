import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { Badge } from '@/components/ui/Badge'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Platform Analytics — Admin Panel' }

type ArticleRow = {
  article_id: number; title: string; slug: string; views: number; earnings: number
  featured_image: string | null; created_at: string
  author: { name: string } | null; category: { name: string } | null
}
type EarnRow   = { amount: number; source: string; created_at: string }
type UserRow   = { user_id: number; created_at: string; role: string }

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase.from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  // Parallel queries
  const [
    { count: totalArticles },
    { count: totalUsers },
    { count: totalJournalists },
    { data: rawTopArticles },
    { data: rawEarnings },
    { data: rawNewUsers },
  ] = await Promise.all([
    supabase.from('articles').select('article_id', { count: 'exact', head: true }).eq('status', 'published' as never),
    supabase.from('users').select('user_id', { count: 'exact', head: true }),
    supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist' as never),
    supabase.from('articles')
      .select('article_id, title, slug, views, earnings, featured_image, created_at, author:users(name), category:categories(name)')
      .eq('status', 'published' as never)
      .order('views', { ascending: false })
      .limit(10),
    supabase.from('earnings').select('amount, source, created_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('users').select('user_id, created_at, role').order('created_at', { ascending: false }).limit(200),
  ])

  const topArticles = (rawTopArticles ?? []) as unknown as ArticleRow[]
  const earnings    = (rawEarnings    ?? []) as unknown as EarnRow[]
  const newUsers    = (rawNewUsers    ?? []) as unknown as UserRow[]

  // Total views across all published articles
  const totalViews = topArticles.reduce((s, a) => s + (a.views ?? 0), 0)

  // Revenue totals
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth    = new Date().toISOString().slice(0, 7)
  const monthRevenue = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  // Revenue by source
  const bySource: Record<string, number> = {}
  for (const e of earnings) {
    bySource[e.source] = (bySource[e.source] ?? 0) + Number(e.amount)
  }

  // Monthly revenue chart (last 6 months)
  const revenueData: number[]  = []
  const revenueLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    revenueLabels.push(d.toLocaleString('default', { month: 'short' }))
    revenueData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  // Monthly new users chart (last 6 months)
  const usersData: number[]   = []
  const usersLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    usersLabels.push(d.toLocaleString('default', { month: 'short' }))
    usersData.push(newUsers.filter(u => u.created_at.startsWith(ym)).length)
  }

  return (
    <>
      <Topbar title="Platform Analytics" user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }} />

      <div className="p-6 flex-1 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="📰 Published Articles" value={(totalArticles ?? 0).toLocaleString()} sub="All-time"            accent="blue" />
          <StatCard label="👥 Total Users"         value={(totalUsers ?? 0).toLocaleString()}   sub={`Journalists: ${totalJournalists ?? 0}`} accent="green" />
          <StatCard label="💰 Total Revenue"        value={formatCurrency(totalRevenue)}          sub={`This month: ${formatCurrency(monthRevenue)}`} accent="orange" />
          <StatCard label="👁 Total Views"          value={formatNumber(totalViews)}             sub="Across top articles"  accent="blue" />
        </div>

        {/* Revenue + Users charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">💰 Monthly Revenue</h2>
            </div>
            <div className="px-5 pb-4 pt-3">
              <BarChart data={revenueData} labels={revenueLabels} height={80} />
              <div className="flex gap-5 mt-3 text-xs text-gray-400 flex-wrap">
                {Object.entries(bySource).map(([src, amt]) => (
                  <span key={src}>{src}: <strong className="text-gray-700">{formatCurrency(amt)}</strong></span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">👥 New Users per Month</h2>
            </div>
            <div className="px-5 pb-4 pt-3">
              <BarChart data={usersData} labels={usersLabels} height={80} />
              <p className="text-xs text-gray-400 mt-3">Total registered: <strong className="text-gray-700">{(totalUsers ?? 0).toLocaleString()}</strong></p>
            </div>
          </div>
        </div>

        {/* Revenue by source breakdown */}
        {Object.keys(bySource).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">📊 Revenue by Source</h2>
            <div className="space-y-3">
              {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, amt]) => {
                const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0
                return (
                  <div key={src}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-semibold capitalize">{src}</span>
                      <span>{formatCurrency(amt)} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top articles by views */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">🔥 Top Articles by Views</h2>
            <Link href="/admin/articles" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left w-8">#</th>
                  <th className="px-4 py-2.5 text-left">Article</th>
                  <th className="px-4 py-2.5 text-left">Author</th>
                  <th className="px-4 py-2.5 text-right">Views</th>
                  <th className="px-4 py-2.5 text-right">Earnings</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topArticles.map((a, i) => (
                  <tr key={a.article_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-black text-gray-300 text-base">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.featured_image && (
                          <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <Link href={`/article/${a.slug}`} className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-1 max-w-[220px] block">
                            {a.title}
                          </Link>
                          <span className="text-xs text-orange-500 font-semibold">{a.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.author?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">{formatNumber(a.views)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(a.earnings)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
                {topArticles.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No published articles yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
