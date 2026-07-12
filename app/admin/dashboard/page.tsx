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
    const articlesChannel = supabase.channel('admin-articles').on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotification({ type: 'success', message: `New article: ${payload.new.title?.substring(0, 40)}...` })
        setTimeout(() => setNotification(null), 5000)
      }
      fetchData()
    }).subscribe()

    const usersChannel = supabase.channel('admin-users').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload: any) => {
      setNotification({ type: 'info', message: `New user: ${payload.new.name || payload.new.email}` })
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
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in" style={{
          borderRadius: 16,
          ...(notification.type === 'success'
            ? { background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }
            : { background: 'var(--info)', border: '1px solid var(--info)', color: 'var(--text-inverse)' })
        }}>
          {notification.message}
        </div>
      )}

      <Topbar title="Admin Dashboard" user={admin} />

      <AccountCreationDialog isOpen={showCreateAccountDialog} onClose={() => setShowCreateAccountDialog(false)} />

      {/* Tab Navigation */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-muted)' }}>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
              ...(activeView === 'dashboard'
                ? { background: 'var(--primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                : { background: 'transparent', color: 'var(--text-secondary)' })
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveView('control-panel')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
              ...(activeView === 'control-panel'
                ? { background: 'var(--primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                : { background: 'transparent', color: 'var(--text-secondary)' })
            }}
          >
            ⚙️ Control Panel
          </button>
          <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />
          <button
            onClick={() => setShowCreateAccountDialog(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--text-inverse)', borderRadius: 10 }}
          >
            <span>➕ Create</span>
          </button>
        </div>
      </div>

      {activeView === 'control-panel' && <AdminControlPanel />}

      {activeView === 'dashboard' && (
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
              <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              <RealtimeFeedFetcher initialArticlesCount={totalArticlesCount} />

              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 20 }}>📰</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Articles</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{totalArticlesCount.toLocaleString()}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{published.length} published</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: 20 }}>⏳</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{pending.length}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>Awaiting approval</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--info)', color: 'var(--text-inverse)', fontSize: 20 }}>👥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{formatNumber(totalUsers)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{journalistsCount} authors</p>
                  </div>
                </div>
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-light)', color: 'var(--success)', fontSize: 20 }}>💵</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{formatCurrency(totalRevenue)}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatCurrency(pendingPayout)} pending</p>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {/* Traffic Chart */}
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📈 Traffic Overview</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Monthly article views</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--success-light)', color: 'var(--success)' }}>Live</span>
                  </div>
                  <div className="p-6">
                    <BarChart data={[30, 45, 38, 55, 60, 50, 72, 80, 75, 90, 85, 100]} labels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']} height={100} />
                  </div>
                </div>

                {/* Active Authors */}
                <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>⭐ Active Authors</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Top performers this month</p>
                    </div>
                    <Link href="/admin/journalists" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>View All</Link>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {journalists.slice(0, 4).map(j => (
                      <div key={j.user_id} className="px-6 py-4 flex items-center gap-4 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={44} height={44} className="rounded-full object-cover" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} />
                        ) : (
                          <div className="rounded-full flex items-center justify-center font-bold" style={{ width: 44, height: 44, background: 'var(--primary)', color: 'var(--text-inverse)' }}>{j.name.charAt(0)}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{j.email}</p>
                        </div>
                        <Badge status={j.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {/* Articles Table */}
                <div className="lg:col-span-2" style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📋 Recent Articles</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Manage and review content</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: 'var(--bg-muted)' }}>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>#</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Article</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Author</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>Views</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {articles.slice(0, 8).map((a, i) => (
                          <tr key={a.article_id} className="transition-colors" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>{i + 1}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {a.featured_image && (
                                  <div className="relative w-12 h-10 rounded-lg overflow-hidden">
                                    <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium line-clamp-1" style={{ color: 'var(--text-primary)', maxWidth: 200 }}>{a.title}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.category?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm hidden md:table-cell" style={{ color: 'var(--text-primary)' }}>{a.author?.name}</td>
                            <td className="px-6 py-4 text-sm hidden lg:table-cell" style={{ color: 'var(--text-primary)' }}>👁 {formatNumber(a.views)}</td>
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
                    <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                      <div className="px-5 py-4" style={{ background: 'var(--warning-light)', borderBottom: '1px solid var(--warning)' }}>
                        <h3 className="font-bold" style={{ color: 'var(--warning)' }}>⏳ Pending Review</h3>
                      </div>
                      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {pending.slice(0, 3).map(a => (
                          <div key={a.article_id} className="p-4 flex items-center gap-3">
                            {a.featured_image && (
                              <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                                <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>By {a.author?.name}</p>
                            </div>
                            <Link href={`/admin/review/${a.article_id}`} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                              Review
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue Card */}
                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}>
                    <h3 className="font-bold text-lg mb-4">💰 Revenue Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Total Revenue</span>
                        <span className="font-bold text-lg">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Pending Payout</span>
                        <span className="font-semibold" style={{ color: 'var(--warning)' }}>{formatCurrency(pendingPayout)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ opacity: 0.8 }}>Active Authors</span>
                        <span className="font-bold">{journalistsCount}</span>
                      </div>
                    </div>
                    <Link href="/admin/earnings" className="mt-5 block w-full py-3 text-center rounded-xl font-semibold text-sm transition-colors" style={{ background: 'rgba(255,255,255,0.2)' }}>
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

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </>
  )
}
