import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { CountUpNumber } from '@/components/ui/CountUpNumber'
import { BarChart } from '@/components/ui/BarChart'
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
    supabase.from('articles').select('article_id, title, slug, views, earnings, featured_image, created_at, author:users(name), category:categories(name)').eq('status', 'published' as never).order('views', { ascending: false }).limit(10),
    supabase.from('earnings').select('amount, source, created_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('users').select('user_id, created_at, role').order('created_at', { ascending: false }).limit(200),
  ])

  const topArticles = (rawTopArticles ?? []) as unknown as ArticleRow[]
  const earnings = (rawEarnings ?? []) as unknown as EarnRow[]
  const newUsers = (rawNewUsers ?? []) as unknown as UserRow[]

  const totalViews = topArticles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthRevenue = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  const bySource: Record<string, number> = {}
  for (const e of earnings) {
    bySource[e.source] = (bySource[e.source] ?? 0) + Number(e.amount)
  }

  const revenueData: number[] = []
  const revenueLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    revenueLabels.push(d.toLocaleString('default', { month: 'short' }))
    revenueData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  const usersData: number[] = []
  const usersLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    usersLabels.push(d.toLocaleString('default', { month: 'short' }))
    usersData.push(newUsers.filter(u => u.created_at.startsWith(ym)).length)
  }

  return (
    <>
      <Topbar title="Platform Analytics" user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }} />
      <div className="p-3 sm:p-6 flex-1 space-y-6 w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div className="animate-fade-in-up"><StatCard label="📰 Published Articles" value={<CountUpNumber value={totalArticles ?? 0} duration={1500} />} sub="All-time" accent="green" /></div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}><StatCard label="👥 Total Users" value={<CountUpNumber value={totalUsers ?? 0} duration={1500} />} sub={`Journalists: ${totalJournalists ?? 0}`} accent="cyan" /></div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}><StatCard label="💰 Total Revenue" value={formatCurrency(totalRevenue)} sub={`This month: ${formatCurrency(monthRevenue)}`} accent="gold" /></div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}><StatCard label="👁 Total Views" value={<CountUpNumber value={totalViews} duration={1500} />} sub="Across top articles" accent="purple" /></div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-sm border border-blue-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700"><h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">💰 <span>Monthly Revenue</span></h2></div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-4 sm:pt-5 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
              <BarChart data={revenueData} labels={revenueLabels} height={80} />
              <div className="flex gap-3 sm:gap-5 mt-4 text-xs text-gray-700 flex-wrap">
                {Object.entries(bySource).map(([src, amt], idx) => (
                  <span key={src} className="animate-fade-in whitespace-nowrap font-semibold" style={{ animationDelay: `${0.3 + idx * 0.08}s` }}>
                    <span className="text-blue-600">{src}:</span> {formatCurrency(amt)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 backdrop-blur-sm border border-purple-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-violet-700"><h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">👥 <span>New Users per Month</span></h2></div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-4 sm:pt-5 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
              <BarChart data={usersData} labels={usersLabels} height={80} />
              <p className="text-xs sm:text-sm text-gray-700 mt-4 font-semibold">Total registered: <span className="text-purple-700"><CountUpNumber value={totalUsers ?? 0} /></span></p>
            </div>
          </div>
        </div>

        {/* Revenue by source */}
        {Object.keys(bySource).length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 backdrop-blur-sm border border-amber-200 rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 p-4 sm:p-6 animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">📊 Revenue by Source</h2>
            <div className="space-y-4">
              {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, amt], idx) => {
                const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0
                return (
                  <div key={src} className="animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.05}s` }}>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-700 mb-2 gap-2 font-semibold">
                      <span className="capitalize flex-shrink-0 text-amber-700">{src}</span>
                      <span className="text-right flex-shrink-0">{formatCurrency(amt)} <span className="text-gray-500">({pct}%)</span></span>
                    </div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top articles table */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 backdrop-blur-sm border border-emerald-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full" style={{ animationDelay: '0.3s' }}>
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-emerald-200 flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-600 to-green-700 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">🔥 <span>Top Articles by Views</span></h2>
            <Link href="/admin/articles" className="text-xs font-bold text-emerald-600 bg-white hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all hover:scale-105 flex-shrink-0 shadow-md">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-100 to-green-100 text-xs text-emerald-800 font-bold uppercase tracking-wider">
                  <th className="px-2 sm:px-4 py-3 text-left w-6 sm:w-8">#</th>
                  <th className="px-2 sm:px-4 py-3 text-left">Article</th>
                  <th className="px-2 sm:px-4 py-3 text-left hidden sm:table-cell">Author</th>
                  <th className="px-2 sm:px-4 py-3 text-right">Views</th>
                  <th className="px-2 sm:px-4 py-3 text-right hidden sm:table-cell">Earnings</th>
                  <th className="px-2 sm:px-4 py-3 text-left hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {topArticles.map((a, i) => (
                  <tr key={a.article_id} className="hover:bg-emerald-50 transition-all duration-300 animate-fade-in group/row" style={{ animationDelay: `${0.4 + i * 0.05}s` }}>
                    <td className="px-2 sm:px-4 py-3 font-black text-emerald-300 text-lg">{i + 1}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {a.featured_image && (
                          <div className="relative w-8 sm:w-10 h-6 sm:h-8 rounded-lg overflow-hidden shrink-0 hover:scale-110 transition-transform duration-300 shadow-md group-hover/row:shadow-lg">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/article/${a.slug}`} className="font-bold text-gray-900 hover:text-emerald-700 line-clamp-1 max-w-[120px] sm:max-w-[220px] block transition-colors duration-300 text-xs sm:text-sm">
                            {a.title}
                          </Link>
                          <span className="text-[10px] sm:text-xs text-amber-600 font-semibold">{a.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-gray-700 hidden sm:table-cell text-xs sm:text-sm font-medium">{a.author?.name ?? '—'}</td>
                    <td className="px-2 sm:px-4 py-3 text-right font-bold text-emerald-700 text-xs sm:text-sm">{formatNumber(a.views)}</td>
                    <td className="px-2 sm:px-4 py-3 text-right font-bold text-green-700 hidden sm:table-cell text-xs sm:text-sm">{formatCurrency(a.earnings)}</td>
                    <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs text-gray-600 hidden md:table-cell">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
                {topArticles.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 animate-fade-in font-semibold">📭 No published articles yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
