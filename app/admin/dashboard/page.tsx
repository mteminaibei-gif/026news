import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'
import { AdminJournalistActions } from '@/components/admin/AdminJournalistActions'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { MOCK_ARTICLES, MOCK_USERS, MOCK_ADMIN_STATS } from '@/lib/mock-data'

export const metadata: Metadata = { title: 'Admin Dashboard' }

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

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch current admin user for topbar
  const { data: { user } } = await supabase.auth.getUser()
  let admin = null
  if (user) {
    try {
      const { data: rawAdmin } = await supabase
        .from('users').select('name, profile_image').eq('email', user.email ?? '').single()
      admin = rawAdmin as { name: string; profile_image: string | null } | null
    } catch {
      // ignore
    }
  }
  if (!admin) {
    admin = { name: user?.email?.split('@')[0] || 'Admin', profile_image: null }
  }

  // Fetch articles
  let articles: ArticleRow[] = []
  let totalArticlesCount = 0
  try {
    const { data: rawArticles, count, error } = await supabase
      .from('articles')
      .select('article_id, title, slug, status, featured_image, views, earnings, created_at, author:users(name), category:categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20) as any
    if (error) throw error
    articles = (rawArticles ?? [])
    totalArticlesCount = count ?? 0
  } catch (err) {
    console.warn('Dashboard articles query failed, falling back to mock data:', err)
    articles = MOCK_ARTICLES.map(a => ({
      article_id: a.article_id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      featured_image: a.featured_image,
      views: a.views,
      earnings: a.earnings,
      created_at: a.created_at,
      author: { name: a.author.name },
      category: { name: a.category.name }
    }))
    totalArticlesCount = MOCK_ARTICLES.length
  }
  const pending   = articles.filter(a => a.status === 'under_review')
  const published = articles.filter(a => a.status === 'published')

  // Fetch journalists
  let journalists: JournalistRow[] = []
  let journalistsCount = 0
  try {
    const { data: rawJournalists, count, error } = await supabase
      .from('users')
      .select('user_id, name, email, profile_image, status', { count: 'exact' })
      .eq('role', 'journalist' as never)
      .order('created_at', { ascending: false })
      .limit(10) as any
    if (error) throw error
    journalists = rawJournalists ?? []
    journalistsCount = count ?? 0
  } catch (err) {
    console.warn('Dashboard journalists query failed, falling back to mock data:', err)
    journalists = MOCK_USERS.filter(u => u.role === 'journalist').map(u => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      profile_image: u.profile_image,
      status: u.status
    }))
    journalistsCount = journalists.length
  }

  // Fetch revenue totals
  let totalRevenue = 0
  let pendingPayout = 0
  try {
    const { data: rawRevenue, error } = await supabase.from('earnings').select('amount, payout_status') as any
    if (error) throw error
    const revenueRows = rawRevenue ?? []
    totalRevenue = revenueRows.reduce((s: number, r: any) => s + Number(r.amount), 0)
    pendingPayout = revenueRows
      .filter((r: any) => r.payout_status === 'pending')
      .reduce((s: number, r: any) => s + Number(r.amount), 0)
  } catch (err) {
    console.warn('Dashboard earnings query failed, falling back to mock data:', err)
    totalRevenue = MOCK_ADMIN_STATS.totalRevenue
    pendingPayout = MOCK_ADMIN_STATS.pendingPayouts
  }

  // Fetch user count
  let totalUsers = 0
  try {
    const { count, error } = await supabase
      .from('users').select('user_id', { count: 'exact', head: true })
    if (error) throw error
    totalUsers = count ?? 0
  } catch {
    totalUsers = MOCK_USERS.length
  }

  return (
    <>
      <Topbar
        title="Admin Dashboard"
        user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }}
      />

      <div className="p-6 flex-1">

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="📰 Total Articles"
            value={(totalArticlesCount ?? 0).toLocaleString()}
            sub={`Published: ${published.length} · Pending: ${pending.length}`}
            accent="green"
          />
          <StatCard
            label="✍️ Freelance Submissions"
            value={`${pending.length} Pending`}
            sub="Awaiting your review"
            accent="gold"
          />
          <StatCard
            label="👥 Active Users"
            value={formatNumber(totalUsers ?? 0)}
            sub={`Journalists: ${journalistsCount ?? 0}`}
            accent="green"
          />
        </div>

        {/* Traffic + Contributors */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Traffic chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">📈 Traffic Overview</h2>
              <span className="text-xs text-gray-500">Last 12 months</span>
            </div>
            <div className="px-5 pb-4 pt-3">
              <BarChart
                data={[30, 45, 38, 55, 60, 50, 72, 80, 75, 90, 85, 100]}
                labels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
                height={80}
              />
              <div className="flex gap-5 mt-4 text-xs text-gray-500 flex-wrap">
                <span>Total Revenue: <strong className="text-[#1a5c2a]">{formatCurrency(totalRevenue)}</strong></span>
                <span>Pending Payout: <strong className="text-[#f5c518]">{formatCurrency(pendingPayout)}</strong></span>
              </div>
            </div>
          </div>

          {/* Active contributors */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">⭐ Active Contributors</h2>
              <Link href="/admin/journalists" className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-3 py-1.5 rounded-lg transition-all duration-300">View All</Link>
            </div>
            <div className="divide-y divide-[#f0faf2]">
              {journalists.slice(0, 4).map(j => (
                <div key={j.user_id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f9fdf9] transition-all duration-300">
                  {j.profile_image ? (
                    <Image src={j.profile_image} alt={j.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#e8f5ea] flex items-center justify-center text-sm font-bold text-[#1a5c2a] shrink-0">
                      {j.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{j.name}</p>
                    <p className="text-xs text-gray-500">{j.email}</p>
                  </div>
                  <Badge status={j.status} />
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <>
                <div className="px-5 py-2 bg-[#f0faf2] border-t border-[#e8f5ea]">
                  <p className="text-xs font-bold text-[#1a5c2a]/70 uppercase tracking-wider">Latest Submissions</p>
                </div>
                {pending.slice(0, 2).map(a => (
                  <div key={a.article_id} className="flex items-center gap-3 px-5 py-3 border-t border-[#f0faf2]">
                    {a.featured_image && (
                      <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                        <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">By {a.author?.name}</p>
                    </div>
                    <Link href={`/admin/review/${a.article_id}`} className="text-xs font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      Review
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Manage Articles table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="text-sm font-bold text-[#1a5c2a]">📋 Manage Articles</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left w-6">#</th>
                  <th className="px-4 py-2.5 text-left">Title</th>
                  <th className="px-4 py-2.5 text-left">Author</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Views</th>
                  <th className="px-4 py-2.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {articles.map((a, i) => (
                  <tr key={a.article_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {a.featured_image && (
                          <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                            <Image src={a.featured_image} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 truncate max-w-[180px]">{a.title}</p>
                          <p className="text-xs text-gray-500">{a.category?.name} · {formatDate(a.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.author?.name}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">👁 {formatNumber(a.views)}</td>
                    <td className="px-4 py-3">
                      {/* Client component handles all interactive actions */}
                      <AdminArticleActions articleId={a.article_id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Journalist Management + Payout */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Journalist table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">👥 Journalist Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Journalist</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0faf2]">
                  {journalists.map(j => (
                    <tr key={j.user_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {j.profile_image ? (
                            <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#e8f5ea] flex items-center justify-center text-xs font-bold text-[#1a5c2a] shrink-0">
                              {j.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{j.name}</p>
                            <p className="text-xs text-gray-500">{j.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center"><Badge status={j.status} /></td>
                      <td className="px-3 py-3 text-center">
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
            <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
              <h2 className="text-sm font-bold text-[#1a5c2a]">💵 Payout Overview</h2>
            </div>
            <div className="divide-y divide-[#e8f5ea]">
              {[
                { label: 'Total Revenue (All Time)', value: formatCurrency(totalRevenue),  color: 'text-[#1a5c2a]' },
                { label: 'Pending Payouts',          value: formatCurrency(pendingPayout), color: 'text-[#f5c518]' },
                { label: 'Active Journalists',        value: (journalistsCount ?? 0).toString(), color: 'text-[#1a5c2a]' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3 hover:bg-[#f9fdf9] transition-all duration-300">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4">
              <Link href="/admin/earnings" className="block w-full text-center bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                📊 View Payment Report
              </Link>
            </div>
          </div>
        </div>

        {/* Trends & Insights */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="text-sm font-bold text-[#1a5c2a]">🔍 Trends &amp; Insights</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-5 mb-5">
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

      </div>
    </>
  )
}
