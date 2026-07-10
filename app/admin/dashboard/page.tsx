'use client'

import { useEffect, useState, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminJournalistActions } from '@/components/admin/AdminJournalistActions'
import { LiveRegistrationsFeed } from '@/components/admin/LiveRegistrationsFeed'
import { RealtimeFeedFetcher } from '@/components/admin/RealtimeFeedFetcher'
import { AdminControlPanel } from '@/components/admin/AdminControlPanel'
import { AccountCreationDialog } from '@/components/admin/AccountCreationDialog'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'

type ArticleRow = {
  article_id: number; title: string; slug: string; status: string
  featured_image: string | null; views: number; earnings: number; created_at: string
  author: { name: string } | null
  category: { name: string } | null
}
type JournalistRow = {
  user_id: number; name: string; email: string
  profile_image: string | null; status: string
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [journalists, setJournalists] = useState<JournalistRow[]>([])
  const [totalArticlesCount, setTotalArticlesCount] = useState(0)
  const [journalistsCount, setJournalistsCount] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingPayout, setPendingPayout] = useState(0)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [admin, setAdmin] = useState<{ name: string; profile_image: string | null }>({ name: 'Admin', profile_image: null })
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'control-panel'>('dashboard')
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from('users').select('name, profile_image').eq('email', user.email ?? '').single() as { data: { name: string; profile_image: string | null } | null }
        if (adminData) {
          setAdmin({ name: adminData.name, profile_image: adminData.profile_image })
        } else {
          setAdmin({ name: user.email?.split('@')[0] || 'Admin', profile_image: null })
        }
      }

      const { data: rawArticles, count: articlesCount } = await supabase
        .from('articles')
        .select('article_id, title, slug, status, featured_image, views, earnings, created_at, author:users(name), category:categories(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20)
      setArticles((rawArticles ?? []) as ArticleRow[])
      setTotalArticlesCount(articlesCount ?? 0)

      const { data: rawJournalists, count: jCount } = await supabase
        .from('users')
        .select('user_id, name, email, profile_image, status', { count: 'exact' })
        .eq('role', 'journalist' as never)
        .order('created_at', { ascending: false })
        .limit(10) as any
      setJournalists((rawJournalists ?? []) as JournalistRow[])
      setJournalistsCount(jCount ?? 0)

      const { count: uCount } = await supabase.from('users').select('user_id', { count: 'exact', head: true })
      setTotalUsers(uCount ?? 0)

      const { data: rawRevenue } = await supabase.from('earnings').select('amount, payout_status') as any
      const revenueRows = rawRevenue ?? []
      const totalRev = revenueRows.reduce((s: number, r: any) => s + Number(r.amount), 0)
      const pendingPay = revenueRows.filter((r: any) => r.payout_status === 'pending').reduce((s: number, r: any) => s + Number(r.amount), 0)
      setTotalRevenue(totalRev)
      setPendingPayout(pendingPay)

      const { data: rawRecent } = await supabase.from('users').select('user_id, name, email, role, status, created_at').order('created_at', { ascending: false }).limit(10) as any
      setRecentUsers(rawRecent ?? [])

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    const articlesChannel = supabase.channel('admin-articles').on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setNotification({ type: 'success', message: `📰 New article: ${(payload.new as any).title?.substring(0, 40)}...` })
        setTimeout(() => setNotification(null), 5000)
      }
      fetchData()
    }).subscribe()

    const usersChannel = supabase.channel('admin-users').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
      setNotification({ type: 'info', message: `👤 New user: ${(payload.new as any).name || (payload.new as any).email}` })
      setTimeout(() => setNotification(null), 5000)
      fetchData()
    }).subscribe()

    return () => {
      supabase.removeChannel(articlesChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [fetchData, supabase])

  const pending = articles.filter(a => a.status === 'under_review')
  const published = articles.filter(a => a.status === 'published')

  return (
    <>
      {notification && (
        <div className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}

      <Topbar title="Admin Dashboard" user={admin} />

      <AccountCreationDialog isOpen={showCreateAccountDialog} onClose={() => setShowCreateAccountDialog(false)} />

      {/* Modern Tab Navigation */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'dashboard' ? 'bg-white dark:bg-gray-700 text-[#1a5c2a] dark:text-[#4caf28] shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">📊 Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('control-panel')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'control-panel' ? 'bg-white dark:bg-gray-700 text-[#1a5c2a] dark:text-[#4caf28] shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">⚙️ Control Panel</span>
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={() => setShowCreateAccountDialog(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white transition-all flex items-center gap-2 shadow-sm hover:shadow"
          >
            <span>➕ Create</span>
          </button>
        </div>
      </div>

      {activeView === 'control-panel' && <AdminControlPanel />}

      {activeView === 'dashboard' && (
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <RealtimeFeedFetcher initialArticlesCount={totalArticlesCount} />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="📰 Articles" value={totalArticlesCount.toLocaleString()} sub={`${published.length} published`} accent="kenya" icon="📰" />
                <StatCard label="⏳ Pending Review" value={pending.length} sub="Awaiting approval" accent="gold" icon="⏳" />
                <StatCard label="👥 Users" value={formatNumber(totalUsers)} sub={`${journalistsCount} authors`} accent="kenya" icon="👥" />
                <StatCard label="💵 Revenue" value={formatCurrency(totalRevenue)} sub={`${formatCurrency(pendingPayout)} pending`} accent="kenya" icon="💵" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Traffic Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">📈 Traffic Overview</h3>
                      <p className="text-sm text-gray-500">Monthly article views</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">Live</span>
                  </div>
                  <div className="p-6">
                    <BarChart data={[30, 45, 38, 55, 60, 50, 72, 80, 75, 90, 85, 100]} labels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']} height={100} />
                  </div>
                </div>

                {/* Active Authors */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">⭐ Active Authors</h3>
                      <p className="text-sm text-gray-500">Top performers this month</p>
                    </div>
                    <Link href="/admin/journalists" className="text-sm font-semibold text-[#1a5c2a] hover:underline">View All</Link>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {journalists.slice(0, 4).map(j => (
                      <div key={j.user_id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={44} height={44} className="rounded-full object-cover ring-2 ring-gray-100" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#1a5c2a] flex items-center justify-center text-white font-bold">{j.name.charAt(0)}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{j.name}</p>
                          <p className="text-sm text-gray-500">{j.email}</p>
                        </div>
                        <Badge status={j.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Articles Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">📋 Recent Articles</h3>
                      <p className="text-sm text-gray-500">Manage and review content</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Article</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Author</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Views</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {articles.slice(0, 8).map((a, i) => (
                          <tr key={a.article_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {a.featured_image && (
                                  <div className="relative w-12 h-10 rounded-lg overflow-hidden">
                                    <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{a.title}</p>
                                  <p className="text-xs text-gray-500">{a.category?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{a.author?.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">👁 {formatNumber(a.views)}</td>
                            <td className="px-6 py-4"><Badge status={a.status} /></td>
                            <td className="px-6 py-4"><AdminArticleActions articleId={a.article_id} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-5">
                  {/* Pending Reviews */}
                  {pending.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
                        <h3 className="font-bold text-amber-800">⏳ Pending Review</h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {pending.slice(0, 3).map(a => (
                          <div key={a.article_id} className="p-4 flex items-center gap-3">
                            {a.featured_image && (
                              <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                                <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm line-clamp-1">{a.title}</p>
                              <p className="text-xs text-gray-500">By {a.author?.name}</p>
                            </div>
                            <Link href={`/admin/review/${a.article_id}`} className="px-3 py-1.5 bg-[#1a5c2a] text-white text-xs font-semibold rounded-lg hover:bg-[#2d8a47] transition-colors">
                              Review
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Card */}
                  <div className="bg-gradient-to-br from-[#1a5c2a] to-[#2d8a47] rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-4">💰 Revenue Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Total Revenue</span>
                        <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Pending Payout</span>
                        <span className="font-semibold text-[#f5c518]">{formatCurrency(pendingPayout)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Active Authors</span>
                        <span className="font-bold">{journalistsCount}</span>
                      </div>
                    </div>
                    <Link href="/admin/earnings" className="mt-5 block w-full py-3 bg-white/20 hover:bg-white/30 text-center rounded-xl font-semibold text-sm transition-colors">
                      View Payment Report →
                    </Link>
                  </div>
                </div>
              </div>

              <LiveRegistrationsFeed initialUsers={recentUsers} />
            </>
          )}
        </div>
      )}
    </>
  )
}