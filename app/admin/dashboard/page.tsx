'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  source_name: string | null
}

const ARTICLE_SELECT = 'article_id, title, slug, status, featured_image, views, earnings, created_at, author:users(name), category:categories(name), source_name'
type JournalistRow = {
  user_id: number; name: string; email: string
  profile_image: string | null; status: string
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [inhouseArticles, setInhouseArticles] = useState<ArticleRow[]>([])
  const [sourcedArticles, setSourcedArticles] = useState<ArticleRow[]>([])
  const [journalists, setJournalists] = useState<JournalistRow[]>([])
  const [totalArticlesCount, setTotalArticlesCount] = useState(0)
  const [publishLimits, setPublishLimits] = useState<{ inhouse: number; sourced: number }>({ inhouse: 0, sourced: 0 })
  const [savingLimits, setSavingLimits] = useState(false)
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

      const [inhouseRes, sourcedRes, settingsRes] = await Promise.all([
        supabase
          .from('articles')
          .select(ARTICLE_SELECT, { count: 'exact' })
          .eq('is_aggregated', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('articles')
          .select(ARTICLE_SELECT, { count: 'exact' })
          .eq('is_aggregated', true)
          .order('created_at', { ascending: false })
          .limit(20),
        // site_settings is not yet in the generated supabase types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('site_settings') as any)
          .select('key, value')
          .eq('key', 'publish_limits')
          .maybeSingle(),
      ])
      setInhouseArticles((inhouseRes.data ?? []) as ArticleRow[])
      setSourcedArticles((sourcedRes.data ?? []) as ArticleRow[])
      setTotalArticlesCount((inhouseRes.count ?? 0) + (sourcedRes.count ?? 0))
      if (settingsRes.data?.value) {
        const v = settingsRes.data.value as { inhouse?: number; sourced?: number }
        setPublishLimits({
          inhouse: Number(v.inhouse ?? 0),
          sourced: Number(v.sourced ?? 0),
        })
      }

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

  const pending = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'under_review')
  const published = [...inhouseArticles, ...sourcedArticles].filter(a => a.status === 'published')

  const saveLimits = async () => {
    setSavingLimits(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('site_settings') as any)
      .upsert({ key: 'publish_limits', value: publishLimits, updated_at: new Date().toISOString() })
    if (error) {
      console.error('Failed to save publish limits:', error)
      setNotification({ type: 'info', message: 'Could not save publish limits.' })
    } else {
      setNotification({ type: 'success', message: 'Publish limits updated.' })
      setTimeout(() => setNotification(null), 4000)
    }
    setSavingLimits(false)
  }

  return (
    <>
      {notification && (
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in" style={{
          borderRadius: 16,
          ...(notification.type === 'success'
            ? { background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }
            : { background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)' })
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
                {/* Publish Limits + Article Library */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Publish Limits control */}
                  <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Publish Limits</h3>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Max published articles surfaced per source type (0 = unlimited)</p>
                      </div>
                      <button
                        onClick={saveLimits}
                        disabled={savingLimits}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                        style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}
                      >
                        {savingLimits ? 'Saving…' : 'Save Limits'}
                      </button>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>🏠 In-House (max published)</span>
                        <input
                          type="number" min={0} max={500}
                          value={publishLimits.inhouse}
                          onChange={(e) => setPublishLimits({ ...publishLimits, inhouse: Math.max(0, Number(e.target.value) || 0) })}
                          className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📡 Sourced / RSS (max published)</span>
                        <input
                          type="number" min={0} max={500}
                          value={publishLimits.sourced}
                          onChange={(e) => setPublishLimits({ ...publishLimits, sourced: Math.max(0, Number(e.target.value) || 0) })}
                          className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Article Library */}
                  <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>📋 Content Library</h3>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>In-house vs sourced publications</p>
                    </div>
                    <ArticleTable title="In-House Publications" icon="🏠" rows={inhouseArticles} limit={publishLimits.inhouse} />
                    <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
                    <ArticleTable title="Sourced (RSS) Articles" icon="📡" rows={sourcedArticles} limit={publishLimits.sourced} />
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

function ArticleTable({ title, icon, rows, limit }: { title: string; icon: string; rows: ArticleRow[]; limit: number }) {
  const published = rows.filter((r) => r.status === 'published')
  const unlimited = !limit || limit <= 0
  const shown = unlimited ? published : published.slice(0, limit)
  const extra = Math.max(0, published.length - shown.length)
  return (
    <div>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{icon}</div>
          <div>
            <h4 className="font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{title}</h4>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {published.length} published · {unlimited ? 'showing all' : `showing ${shown.length}`}
              {!unlimited && extra > 0 ? <span style={{ color: 'var(--warning)' }}> ({extra} beyond limit)</span> : ''}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>{shown.length}</span>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3 opacity-40">🗞️</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No published articles yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Published {title.toLowerCase()} will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {shown.map((a) => {
            const name = a.author?.name ?? a.source_name ?? '—'
            const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '—'
            const isSourced = !a.author?.name && !!a.source_name
            return (
              <li
                key={a.article_id}
                className="group flex items-center gap-4 px-6 py-4 transition-all"
                style={{ borderLeft: '3px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-muted)'
                  e.currentTarget.style.borderLeftColor = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderLeftColor = 'transparent'
                }}
              >
                {/* Thumbnail */}
                {a.featured_image ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: '0 0 0 1px var(--border-subtle)' }}>
                    <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📰</div>
                )}

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {a.category?.name && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{a.category.name}</span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(a.created_at)}</span>
                  </div>
                </div>

                {/* Author / source */}
                <div className="hidden md:flex items-center gap-2 w-44 shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: isSourced ? 'var(--info)' : 'var(--primary)', color: 'var(--text-inverse)' }}>{initials}</div>
                  <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{isSourced ? `📡 ${a.source_name}` : a.author?.name}</span>
                </div>

                {/* Views */}
                <div className="hidden lg:block shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>👁 {formatNumber(a.views)}</span>
                </div>

                {/* Status */}
                <div className="shrink-0"><Badge status={a.status} /></div>

                {/* Actions */}
                <div className="shrink-0"><AdminArticleActions articleId={a.article_id} /></div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  return `${w}w ago`
}
