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

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch current user
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

      // Fetch articles
      const { data: rawArticles, count: articlesCount } = await supabase
        .from('articles')
        .select('article_id, title, slug, status, featured_image, views, earnings, created_at, author:users(name), category:categories(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20)
      setArticles((rawArticles ?? []) as ArticleRow[])
      setTotalArticlesCount(articlesCount ?? 0)

      // Fetch journalists
      const { data: rawJournalists, count: jCount } = await supabase
        .from('users')
        .select('user_id, name, email, profile_image, status', { count: 'exact' })
        .eq('role', 'journalist' as never)
        .order('created_at', { ascending: false })
        .limit(10) as any
      setJournalists((rawJournalists ?? []) as JournalistRow[])
      setJournalistsCount(jCount ?? 0)

      // Fetch user count
      const { count: uCount } = await supabase
        .from('users').select('user_id', { count: 'exact', head: true })
      setTotalUsers(uCount ?? 0)

      // Fetch revenue
      const { data: rawRevenue } = await supabase.from('earnings').select('amount, payout_status') as any
      const revenueRows = rawRevenue ?? []
      const totalRev = revenueRows.reduce((s: number, r: any) => s + Number(r.amount), 0)
      const pendingPay = revenueRows
        .filter((r: any) => r.payout_status === 'pending')
        .reduce((s: number, r: any) => s + Number(r.amount), 0)
      setTotalRevenue(totalRev)
      setPendingPayout(pendingPay)

      // Fetch recent users
      const { data: rawRecent } = await supabase
        .from('users')
        .select('user_id, name, email, role, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10) as any
      setRecentUsers(rawRecent ?? [])

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch + setup realtime subscription
  useEffect(() => {
    fetchData()

    // Subscribe to articles table for real-time updates
    const articlesChannel = supabase
      .channel('admin-articles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotification({
            type: 'success',
            message: `📰 New article published: ${(payload.new as any).title?.substring(0, 50)}...`
          })
          setTimeout(() => setNotification(null), 5000)
        }
        fetchData()
      })
      .subscribe()

    // Subscribe to users table for real-time registration notifications
    const usersChannel = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        setNotification({
          type: 'info',
          message: `👤 New user registered: ${(payload.new as any).name || (payload.new as any).email}`
        })
        setTimeout(() => setNotification(null), 5000)
        fetchData()
      })
      .subscribe()

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
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}

      <Topbar title="Admin Dashboard" user={admin} />

      {/* Account Creation Dialog */}
      <AccountCreationDialog
        isOpen={showCreateAccountDialog}
        onClose={() => setShowCreateAccountDialog(false)}
      />

      {/* View Toggle - Mobile Responsive */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveView('control-panel')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === 'control-panel'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            ⚙️ Control Panel
          </button>
          <button
            onClick={() => setShowCreateAccountDialog(true)}
            className="ml-auto px-3 md:px-4 py-2 text-sm md:text-base rounded-lg font-medium bg-[#1a5c2a] hover:bg-[#2d8a47] text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
          >
            ➕ Create
          </button>
        </div>
      </div>

      {/* Control Panel View */}
      {activeView === 'control-panel' && (
        <AdminControlPanel />
      )}

      {/* Dashboard View - Mobile Responsive */}
      {activeView === 'dashboard' && (
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <RealtimeFeedFetcher initialArticlesCount={totalArticlesCount} />
              </div>

              {/* Overview stats - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
                <StatCard
                  label="📰 Total Articles"
                  value={totalArticlesCount.toLocaleString()}
                  sub={`Published: ${published.length} · Pending: ${pending.length}`}
                  accent="green"
                />
                <StatCard
                  label="✍️ Pending Review"
                  value={`${pending.length} Articles`}
                  sub="Awaiting your approval"
                  accent="gold"
                />
                <StatCard
                  label="👥 Registered Users"
                  value={formatNumber(totalUsers)}
                  sub={`Authors: ${journalistsCount}`}
                  accent="green"
                />
              </div>

              {/* Traffic + Contributors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6">
                {/* Traffic chart */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-[#f0faf2] to-white">
                    <h2 className="text-sm font-bold text-[#1a5c2a]">📈 Traffic Overview</h2>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Last 12 months</span>
                  </div>
                  <div className="px-4 md:px-5 pb-4 md:pb-4 pt-3">
                    <BarChart
                      data={[30, 45, 38, 55, 60, 50, 72, 80, 75, 90, 85, 100]}
                      labels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
                      height={80}
                    />
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-5 mt-4 text-xs text-gray-500">
                      <span>Total Revenue: <strong className="text-[#1a5c2a]">{formatCurrency(totalRevenue)}</strong></span>
                      <span>Pending Payout: <strong className="text-[#f5c518]">{formatCurrency(pendingPayout)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Active contributors */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] flex items-center justify-between gap-2 bg-gradient-to-r from-[#f0faf2] to-white">
                    <h2 className="text-sm font-bold text-[#1a5c2a]">⭐ Active Authors</h2>
                    <Link href="/admin/journalists" className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-2 md:px-3 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap">View All</Link>
                  </div>
                  <div className="divide-y divide-[#f0faf2] max-h-[300px] overflow-y-auto">
                    {journalists.slice(0, 4).map(j => (
                      <div key={j.user_id} className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-3 hover:bg-[#f9fdf9] transition-all duration-300">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#e8f5ea] flex items-center justify-center text-sm font-bold text-[#1a5c2a] shrink-0">
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{j.name}</p>
                          <p className="text-xs text-gray-500 truncate">{j.email}</p>
                        </div>
                        <Badge status={j.status} />
                      </div>
                    ))}
                  </div>

                  {pending.length > 0 && (
                    <>
                      <div className="px-4 md:px-5 py-2 bg-[#f0faf2] border-t border-[#e8f5ea]">
                        <p className="text-xs font-bold text-[#1a5c2a]/70 uppercase tracking-wider">Latest Submissions</p>
                      </div>
                      {pending.slice(0, 2).map(a => (
                        <div key={a.article_id} className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-3 border-t border-[#f0faf2]">
                          {a.featured_image && (
                            <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                              <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                            <p className="text-xs text-gray-500">By {a.author?.name}</p>
                          </div>
                          <Link href={`/admin/review/${a.article_id}`} className="text-xs font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-2 md:px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
                            Review
                          </Link>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Manage Articles table - Horizontal scroll on mobile */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
                <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#f0faf2] to-white">
                  <h2 className="text-sm font-bold text-[#1a5c2a]">📋 Manage Articles</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm min-w-max">
                    <thead>
                      <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                        <th className="px-2 md:px-4 py-2.5 text-left w-6">#</th>
                        <th className="px-2 md:px-4 py-2.5 text-left">Title</th>
                        <th className="px-2 md:px-4 py-2.5 text-left hidden sm:table-cell">Author</th>
                        <th className="px-2 md:px-4 py-2.5 text-left hidden md:table-cell">Status</th>
                        <th className="px-2 md:px-4 py-2.5 text-left hidden lg:table-cell">Views</th>
                        <th className="px-2 md:px-4 py-2.5 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0faf2]">
                      {articles.slice(0, 8).map((a, i) => (
                        <tr key={a.article_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                          <td className="px-2 md:px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                          <td className="px-2 md:px-4 py-3">
                            <div className="flex items-center gap-2">
                              {a.featured_image && (
                                <div className="relative w-8 h-6 rounded overflow-hidden shrink-0 hidden sm:block">
                                  <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-xs md:text-sm max-w-[120px] md:max-w-[200px]">{a.title}</p>
                                <p className="text-xs text-gray-500 hidden sm:block">{a.category?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-600 hidden sm:table-cell">{a.author?.name}</td>
                          <td className="px-2 md:px-4 py-3 hidden md:table-cell"><Badge status={a.status} /></td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm text-gray-600 hidden lg:table-cell">👁 {formatNumber(a.views)}</td>
                          <td className="px-2 md:px-4 py-3">
                            <AdminArticleActions articleId={a.article_id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Journalist Management + Payout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6">
                {/* Journalist table */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
                    <h2 className="text-sm font-bold text-[#1a5c2a]">👥 Author Management</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm min-w-max">
                      <thead>
                        <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                          <th className="px-2 md:px-4 py-2.5 text-left">Author</th>
                          <th className="px-2 md:px-3 py-2.5 text-center hidden sm:table-cell">Status</th>
                          <th className="px-2 md:px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0faf2]">
                        {journalists.slice(0, 8).map(j => (
                          <tr key={j.user_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                            <td className="px-2 md:px-4 py-3">
                              <div className="flex items-center gap-2">
                                {j.profile_image ? (
                                  <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#e8f5ea] flex items-center justify-center text-xs font-bold text-[#1a5c2a] shrink-0">
                                    {j.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{j.name}</p>
                                  <p className="text-xs text-gray-500 truncate hidden sm:block">{j.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 md:px-3 py-3 text-center hidden sm:table-cell"><Badge status={j.status} /></td>
                            <td className="px-2 md:px-3 py-3 text-center">
                              <AdminJournalistActions userId={j.user_id} currentStatus={j.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payout Overview */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
                    <h2 className="text-sm font-bold text-[#1a5c2a]">💵 Payout Overview</h2>
                  </div>
                  <div className="divide-y divide-[#e8f5ea]">
                    {[
                      { label: 'Total Revenue (All Time)', value: formatCurrency(totalRevenue), color: 'text-[#1a5c2a]' },
                      { label: 'Pending Payouts', value: formatCurrency(pendingPayout), color: 'text-[#f5c518]' },
                      { label: 'Active Authors', value: journalistsCount.toString(), color: 'text-[#1a5c2a]' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-4 md:px-5 py-3 hover:bg-[#f9fdf9] transition-all duration-300">
                        <span className="text-xs md:text-sm text-gray-600">{row.label}</span>
                        <span className={`text-xs md:text-sm font-bold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 md:px-5 py-4">
                    <Link href="/admin/earnings" className="block w-full text-center bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold py-2 md:py-2.5 rounded-xl text-xs md:text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      📊 View Payment Report
                    </Link>
                  </div>
                </div>
              </div>

              {/* Trends & Insights */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
                  <h2 className="text-sm font-bold text-[#1a5c2a]">🔍 Trends & Insights</h2>
                </div>
                <div className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 mb-5">
                    <div
                      className="w-20 h-20 rounded-full shrink-0 shadow-inner"
                      style={{ background: 'conic-gradient(#1a5c2a 0% 50%, #f5c518 50% 75%, #c8102e 75% 90%, #e5e7eb 90% 100%)' }}
                    />
                    <div className="space-y-1.5 text-xs text-gray-600">
                      {[
                        { color: '#1a5c2a', label: 'Ads — 50%' },
                        { color: '#f5c518', label: 'Subscriptions — 25%' },
                        { color: '#c8102e', label: 'Sponsored — 15%' },
                        { color: '#e5e7eb', label: 'Other — 10%' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <BarChart
                    data={[45, 60, 52, 75, 68, 85, 100]}
                    labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
                    height={60}
                  />
                </div>
              </div>

              {/* Live Registrations Feed */}
              <div className="mb-6">
                <LiveRegistrationsFeed initialUsers={recentUsers} />
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
