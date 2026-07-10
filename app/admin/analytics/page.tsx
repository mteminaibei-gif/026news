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

  const totalViews   = topArticles.reduce((s, a) => s + (a.views ?? 0), 0)
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth    = new Date().toISOString().slice(0, 7)
  const monthRevenue = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

  const bySource: Record<string, number> = {}
  for (const e of earnings) {
    bySource[e.source] = (bySource[e.source] ?? 0) + Number(e.amount)
  }

  const revenueData: number[]   = []
  const revenueLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    revenueLabels.push(d.toLocaleString('default', { month: 'short' }))
    revenueData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

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

      <div className="p-3 sm:p-6 flex-1 space-y-6 w-full overflow-x-hidden">

        {/* KPI cards - Responsive grid with counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div className="animate-fade-in-up w-full">
            <StatCard 
              label="📰 Published Articles" 
              value={<CountUpNumber value={totalArticles ?? 0} duration={1500} />}
              sub="All-time" 
              accent="green" 
            />
          </div>
          <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.1s' }}>
            <StatCard 
              label="👥 Total Users"         
              value={<CountUpNumber value={totalUsers ?? 0} duration={1500} />}
              sub={`Journalists: ${totalJournalists ?? 0}`} 
              accent="green" 
            />
          </div>
          <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
            <StatCard 
              label="💰 Total Revenue"        
              value={formatCurrency(totalRevenue)} 
              sub={`This month: ${formatCurrency(monthRevenue)}`} 
              accent="gold" 
            />
          </div>
          <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.3s' }}>
            <StatCard 
              label="👁 Total Views"          
              value={<CountUpNumber value={totalViews} duration={1500} />}
              sub="Across top articles" 
              accent="green" 
            />
          </div>
        </div>

        {/* Charts - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in-up w-full">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">💰 Monthly Revenue</h2>
            </div>
            <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-3 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
              <BarChart data={revenueData} labels={revenueLabels} height={80} />
              <div className="flex gap-3 sm:gap-5 mt-3 text-xs text-gray-500 flex-wrap">
                {Object.entries(bySource).map(([src, amt], idx) => (
                  <span key={src} className="animate-fade-in whitespace-nowrap" style={{ animationDelay: `${0.3 + idx * 0.08}s` }}>
                    {src}: <strong className="text-[#1a5c2a]">{formatCurrency(amt)}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in-up w-full" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">👥 New Users per Month</h2>
            </div>
            <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-3 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
              <BarChart data={usersData} labels={usersLabels} height={80} />
              <p className="text-xs text-gray-500 mt-3">Total registered: <strong className="text-[#1a5c2a]"><CountUpNumber value={totalUsers ?? 0} /></strong></p>
            </div>
          </div>
        </div>

        {/* Revenue by source - Responsive */}
        {Object.keys(bySource).length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-4 sm:p-5 transition-all duration-300 hover:shadow-lg animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm font-bold text-[#1a5c2a] mb-4">📊 Revenue by Source</h2>
            <div className="space-y-3">
              {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, amt], idx) => {
                const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0
                return (
                  <div key={src} className="animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.05}s` }}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1 gap-2">
                      <span className="font-semibold capitalize flex-shrink-0">{src}</span>
                      <span className="text-right flex-shrink-0">{formatCurrency(amt)} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-[#f0faf2] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(to right, #1a5c2a, #4caf28)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top articles table - Responsive */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in-up w-full" style={{ animationDelay: '0.3s' }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e8f5ea] flex items-center justify-between gap-2 bg-gradient-to-r from-[#f0faf2] to-white flex-wrap">
            <h2 className="text-sm font-bold text-[#1a5c2a]">🔥 Top Articles by Views</h2>
            <Link href="/admin/articles" className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-3 py-1.5 rounded-lg transition-all hover:scale-105 flex-shrink-0">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-2 sm:px-4 py-2.5 text-left w-6 sm:w-8">#</th>
                  <th className="px-2 sm:px-4 py-2.5 text-left">Article</th>
                  <th className="px-2 sm:px-4 py-2.5 text-left hidden sm:table-cell">Author</th>
                  <th className="px-2 sm:px-4 py-2.5 text-right">Views</th>
                  <th className="px-2 sm:px-4 py-2.5 text-right hidden sm:table-cell">Earnings</th>
                  <th className="px-2 sm:px-4 py-2.5 text-left hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {topArticles.map((a, i) => (
                  <tr key={a.article_id} className="hover:bg-[#f9fdf9] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.05}s` }}>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-black text-[#1a5c2a]/30">{i + 1}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {a.featured_image && (
                          <div className="relative w-8 sm:w-10 h-6 sm:h-8 rounded-lg overflow-hidden shrink-0 hover:scale-110 transition-transform duration-300">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/article/${a.slug}`} className="font-semibold text-gray-900 hover:text-[#1a5c2a] line-clamp-1 max-w-[120px] sm:max-w-[220px] block transition-colors duration-300 text-xs sm:text-sm">
                            {a.title}
                          </Link>
                          <span className="text-[10px] sm:text-xs text-[#f5c518] font-semibold">{a.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden sm:table-cell text-xs sm:text-sm">{a.author?.name ?? '—'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-gray-700 text-xs sm:text-sm">{formatNumber(a.views)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-[#1a5c2a] hidden sm:table-cell text-xs sm:text-sm">{formatCurrency(a.earnings)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-gray-500 hidden md:table-cell">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
                {topArticles.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 animate-fade-in">No published articles yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
