'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/ui/StatCard'
import { CountUpNumber } from '@/components/ui/CountUpNumber'
import { BarChart } from '@/components/ui/BarChart'
import Image from 'next/image'
import Link from 'next/link'
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

type ArticleRow = {
  article_id: number; title: string; slug: string; views: number; earnings: number
  featured_image: string | null; created_at: string
  author: { name: string } | null; category: { name: string } | null
}
type EarnRow = { amount: number; source: string; created_at: string }
type UserRow = { user_id: number; created_at: string; role: string }

interface Props {
  initialTopArticles: ArticleRow[]
  initialEarnings: EarnRow[]
  initialNewUsers: UserRow[]
  initialTotalArticles: number
  initialTotalUsers: number
  initialTotalJournalists: number
  initialTotalViews: number
  initialTotalRevenue: number
  initialMonthRevenue: number
}

export function AnalyticsDashboard({
  initialTopArticles, initialEarnings, initialNewUsers,
  initialTotalArticles, initialTotalUsers, initialTotalJournalists,
  initialTotalViews, initialTotalRevenue, initialMonthRevenue,
}: Props) {
  const [topArticles, setTopArticles] = useState(initialTopArticles)
  const [earnings, setEarnings] = useState(initialEarnings)
  const [newUsers, setNewUsers] = useState(initialNewUsers)
  const [stats, setStats] = useState({
    totalArticles: initialTotalArticles,
    totalUsers: initialTotalUsers,
    totalJournalists: initialTotalJournalists,
    totalViews: initialTotalViews,
    totalRevenue: initialTotalRevenue,
    monthRevenue: initialMonthRevenue,
  })
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient()
      const [articlesRes, usersRes, journalistsRes, viewsRes, earningsRes, newUsersRes, topRes] = await Promise.all([
        supabase.from('articles').select('article_id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('users').select('user_id', { count: 'exact', head: true }),
        supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('role', 'journalist'),
        supabase.from('articles').select('views').eq('status', 'published'),
        supabase.from('earnings').select('amount, source, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('users').select('user_id, created_at, role').order('created_at', { ascending: false }).limit(200),
        supabase.from('articles').select('article_id, title, slug, views, earnings, featured_image, created_at, author:users(name), category:categories(name)').eq('status', 'published').order('views', { ascending: false }).limit(10),
      ])

      const allViews = (viewsRes.data ?? []) as { views: number | null }[]
      const totalViews = allViews.reduce((s, a) => s + (a.views ?? 0), 0)
      const rawEarnings = (earningsRes.data ?? []) as EarnRow[]
      const totalRevenue = rawEarnings.reduce((s, e) => s + Number(e.amount), 0)
      const thisMonth = new Date().toISOString().slice(0, 7)
      const monthRevenue = rawEarnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)

      setStats({
        totalArticles: articlesRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        totalJournalists: journalistsRes.count ?? 0,
        totalViews,
        totalRevenue,
        monthRevenue,
      })
      setEarnings(rawEarnings)
      setNewUsers((newUsersRes.data ?? []) as UserRow[])
      setTopArticles((topRes.data ?? []) as unknown as ArticleRow[])
      setLastUpdate(new Date())
    } catch {}
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-analytics-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'earnings' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refresh())
      .subscribe()

    const interval = setInterval(refresh, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [refresh])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

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
    <div className="p-3 sm:p-6 flex-1 space-y-6 w-full overflow-x-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Live indicator + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--success)' }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live — updated {lastUpdate.toLocaleTimeString()}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="animate-fade-in-up"><StatCard label="📰 Published Articles" value={<CountUpNumber value={stats.totalArticles} duration={1500} />} sub="All-time" accent="green" /></div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}><StatCard label="👥 Total Users" value={<CountUpNumber value={stats.totalUsers} duration={1500} />} sub={`Authors: ${stats.totalJournalists}`} accent="cyan" /></div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}><StatCard label="💰 Total Revenue" value={formatCurrency(stats.totalRevenue)} sub={`This month: ${formatCurrency(stats.monthRevenue)}`} accent="gold" /></div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}><StatCard label="👁 Total Views" value={<CountUpNumber value={stats.totalViews} duration={1500} />} sub="Across all articles" accent="purple" /></div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full">
        <div className="backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--primary)', color: 'var(--text-inverse)' }}><h2 className="text-sm sm:text-base font-bold flex items-center gap-2">💰 <span>Monthly Revenue</span></h2></div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-4 sm:pt-5 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
            <BarChart data={revenueData} labels={revenueLabels} height={80} />
            <div className="flex gap-3 sm:gap-5 mt-4 text-xs flex-wrap" style={{ color: 'var(--text-primary)' }}>
              {Object.entries(bySource).map(([src, amt], idx) => (
                <span key={src} className="animate-fade-in whitespace-nowrap font-semibold" style={{ animationDelay: `${0.3 + idx * 0.08}s` }}>
                  <span style={{ color: 'var(--info)' }}>{src}:</span> {formatCurrency(amt)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', animationDelay: '0.1s' }}>
          <div className="px-4 sm:px-6 py-4 sm:py-5" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--accent)', color: 'var(--text-inverse)' }}><h2 className="text-sm sm:text-base font-bold flex items-center gap-2">👥 <span>New Users per Month</span></h2></div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-4 sm:pt-5 animate-fade-in overflow-x-auto" style={{ animationDelay: '0.2s' }}>
            <BarChart data={usersData} labels={usersLabels} height={80} />
            <p className="text-xs sm:text-sm mt-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Total registered: <span style={{ color: 'var(--accent)' }}><CountUpNumber value={stats.totalUsers} /></span></p>
          </div>
        </div>
      </div>

      {/* Revenue by source */}
      {Object.keys(bySource).length > 0 && (
        <div className="backdrop-blur-sm rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 p-4 sm:p-6 animate-fade-in-up w-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--warning)' }}>📊 Revenue by Source</h2>
          <div className="space-y-4">
            {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, amt], idx) => {
              const pct = stats.totalRevenue > 0 ? Math.round((amt / stats.totalRevenue) * 100) : 0
              return (
                <div key={src} className="animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.05}s` }}>
                  <div className="flex justify-between text-xs sm:text-sm mb-2 gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <span className="capitalize flex-shrink-0" style={{ color: 'var(--warning)' }}>{src}</span>
                    <span className="text-right flex-shrink-0">{formatCurrency(amt)} <span style={{ color: 'var(--text-tertiary)' }}>({pct}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <div className="h-full rounded-full transition-all duration-700 shadow-lg" style={{ background: 'var(--warning)', width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top articles table */}
      <div className="backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up w-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', animationDelay: '0.3s' }}>
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--success)', color: 'var(--text-inverse)' }}>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">🔥 <span>Top Articles by Views</span></h2>
          <Link href="/admin/articles" className="text-xs font-bold px-3 py-2 rounded-lg transition-all hover:scale-105 flex-shrink-0 shadow-md" style={{ color: 'var(--success)', background: 'var(--bg-surface)' }}>View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <th className="px-2 sm:px-4 py-3 text-left w-6 sm:w-8">#</th>
                <th className="px-2 sm:px-4 py-3 text-left">Article</th>
                <th className="px-2 sm:px-4 py-3 text-left hidden sm:table-cell">Author</th>
                <th className="px-2 sm:px-4 py-3 text-right">Views</th>
                <th className="px-2 sm:px-4 py-3 text-right hidden sm:table-cell">Earnings</th>
                <th className="px-2 sm:px-4 py-3 text-left hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {topArticles.map((a, i) => (
                <tr key={a.article_id} className="transition-all duration-300 animate-fade-in group/row hover:[background:var(--bg-muted)]" style={{ borderColor: 'var(--border-subtle)', animationDelay: `${0.4 + i * 0.05}s` }}>
                  <td className="px-2 sm:px-4 py-3 font-black text-lg" style={{ color: 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {a.featured_image && (
                        <div className="relative w-8 sm:w-10 h-6 sm:h-8 rounded-lg overflow-hidden shrink-0 hover:scale-110 transition-transform duration-300 shadow-md group-hover/row:shadow-lg">
                          <Image src={a.featured_image} alt={a.title} fill className="object-cover"  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/article/${a.slug}`} className="font-bold line-clamp-1 max-w-[120px] sm:max-w-[220px] block transition-colors duration-300 text-xs sm:text-sm hover:text-[var(--success)]" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </Link>
                        <span className="text-[10px] sm:text-xs font-semibold" style={{ color: 'var(--warning)' }}>{a.category?.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 hidden sm:table-cell text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.author?.name ?? '—'}</td>
                  <td className="px-2 sm:px-4 py-3 text-right font-bold text-xs sm:text-sm" style={{ color: 'var(--success)' }}>{formatNumber(a.views)}</td>
                  <td className="px-2 sm:px-4 py-3 text-right font-bold hidden sm:table-cell text-xs sm:text-sm" style={{ color: 'var(--primary)' }}>{formatCurrency(a.earnings)}</td>
                  <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs hidden md:table-cell" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</td>
                </tr>
              ))}
              {topArticles.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center animate-fade-in font-semibold" style={{ color: 'var(--text-tertiary)' }}>📭 No published articles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
