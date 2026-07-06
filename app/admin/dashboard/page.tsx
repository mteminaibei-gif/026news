import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import Image from 'next/image'
import Link from 'next/link'
import { MOCK_ARTICLES, MOCK_USERS, MOCK_CATEGORIES, MOCK_ADMIN_STATS } from '@/lib/mock-data'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminDashboard() {
  const admin = MOCK_USERS[1]
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')
  const pending = MOCK_ARTICLES.filter(a => a.status === 'under_review')
  const published = MOCK_ARTICLES.filter(a => a.status === 'published')
  const stats = MOCK_ADMIN_STATS

  return (
    <>
      <Topbar title="Admin Dashboard" user={{ name: admin.name, profile_image: admin.profile_image }} />

      <div className="p-6 flex-1">

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="📰 Total Articles" value={stats.totalArticles.toLocaleString()} sub={`Published: ${published.length} · Pending: ${pending.length}`} accent="blue" />
          <StatCard label="✍️ Freelance Submissions" value={`${pending.length} Pending`} sub="Awaiting your review" accent="orange" />
          <StatCard label="👥 Active Users" value={formatNumber(stats.activeUsers)} sub={`Journalists: ${journalists.length}`} accent="green" />
        </div>

        {/* Traffic + Contributors */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Traffic chart */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">📈 Traffic Overview</h2>
              <span className="text-xs text-gray-400">Last 12 months</span>
            </div>
            <div className="px-5 pb-4 pt-3">
              <BarChart
                data={[30, 45, 38, 55, 60, 50, 72, 80, 75, 90, 85, 100]}
                labels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
                height={80}
              />
              <div className="flex gap-5 mt-4 text-xs text-gray-400 flex-wrap">
                <span>Monthly Visitors: <strong className="text-gray-900">{formatNumber(stats.monthlyVisitors)}</strong></span>
                <span>Avg. Session: <strong className="text-gray-900">4.2 min</strong></span>
                <span>Bounce Rate: <strong className="text-red-500">38%</strong></span>
              </div>
            </div>
          </div>

          {/* Active contributors */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">⭐ Active Contributors</h2>
              <Link href="/admin/journalists" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">View All</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {journalists.slice(0, 4).map(j => {
                const jAny = j as typeof j & { articles?: number; earnings?: number }
                return (
                <div key={j.user_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <Image src={j.profile_image ?? ''} alt={j.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{j.name}</p>
                    <p className="text-xs text-gray-400">{jAny.articles ?? 0} articles · {formatCurrency(jAny.earnings ?? 0)}</p>
                  </div>
                  <Badge status="active" />
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(jAny.earnings ?? 0)}</span>
                </div>
                )
              })}
            </div>
            {pending.length > 0 && (
              <>
                <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Submissions</p>
                </div>
                {pending.slice(0, 2).map(a => (
                  <div key={a.article_id} className="flex items-center gap-3 px-5 py-3 border-t border-gray-50">
                    <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                      <Image src={a.featured_image ?? ''} alt={a.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">By {a.author?.name}</p>
                    </div>
                    <Link href={`/admin/review/${a.article_id}`} className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                      Review
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Manage Articles table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">📋 Manage Articles</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {['All Articles', 'Pending Review', 'Published'].map(tab => (
                  <button key={tab} className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${tab === 'All Articles' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔍</span>
                <input type="text" placeholder="Search articles..." className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none focus:border-blue-500 w-44" />
              </div>
              <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50 outline-none">
                <option>All Categories</option>
                {MOCK_CATEGORIES.map(c => <option key={c.category_id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left w-6">#</th>
                <th className="px-4 py-2.5 text-left">Title</th>
                <th className="px-4 py-2.5 text-left">Author</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Views</th>
                <th className="px-4 py-2.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_ARTICLES.map((a, i) => (
                <tr key={a.article_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-8 rounded overflow-hidden shrink-0">
                        <Image src={a.featured_image ?? ''} alt={a.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 truncate max-w-[180px]">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.category?.name} · {formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.author?.name}</td>
                  <td className="px-4 py-3"><Badge status={a.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">👁 {formatNumber(a.views)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <Link href={`/admin/review/${a.article_id}`} className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700">
                        Review
                      </Link>
                      <Link href={`/admin/review/${a.article_id}`} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200">
                        Edit
                      </Link>
                      <button className="text-xs font-semibold bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Journalist Management + Payout */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Journalist table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">👥 Journalist Management</h2>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {['All', 'Pending', 'Top Earners'].map(tab => (
                    <button key={tab} className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${tab === 'All' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Journalist</th>
                  <th className="px-3 py-2.5">Articles</th>
                  <th className="px-3 py-2.5">Earnings</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {journalists.map(j => {
                  const jx = j as typeof j & { articles?: number; earnings?: number }
                  return (
                  <tr key={j.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Image src={j.profile_image ?? ''} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{j.name}</p>
                          <p className="text-xs text-gray-400">{j.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm">{jx.articles ?? 0}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-600">{formatCurrency(jx.earnings ?? 0)}</td>
                    <td className="px-3 py-3 text-center"><Badge status={j.status} /></td>
                    <td className="px-3 py-3 text-center">
                      <button className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600">Reject</button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Payout Overview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">💵 Payout Overview</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { label: "This Month's Payout", value: formatCurrency(stats.thisMonthPayout), color: 'text-blue-600' },
                { label: 'Total Payouts (All Time)', value: formatCurrency(stats.totalRevenue), color: 'text-gray-900' },
                { label: 'Pending Payouts', value: formatCurrency(stats.pendingPayouts), color: 'text-orange-500' },
                { label: 'Active Journalists', value: journalists.length.toString(), color: 'text-gray-900' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                📊 Payment Report
              </button>
            </div>
          </div>
        </div>

        {/* Analytics row */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Content Performance */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">📊 Content Performance</h2>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 outline-none">
                <option>This Month</option>
                <option>This Week</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: 'Monthly Visitors', value: formatNumber(stats.monthlyVisitors) },
                { label: 'Top Source', value: 'BBC 18%' },
                { label: 'Revenue', value: formatCurrency(stats.totalRevenue) },
              ].map(item => (
                <div key={item.label} className="px-4 py-3 text-center">
                  <p className="font-extrabold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Article</th>
                  <th className="px-4 py-2.5">Views</th>
                  <th className="px-4 py-2.5">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {published.sort((a, b) => b.views - a.views).slice(0, 4).map(a => (
                  <tr key={a.article_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-7 rounded overflow-hidden shrink-0">
                          <Image src={a.featured_image ?? ''} alt={a.title} fill className="object-cover" />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{formatNumber(a.views)}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600">{formatCurrency(a.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trends & Insights */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">🔍 Trends &amp; Insights</h2>
            </div>
            <div className="p-5">
              {/* Revenue breakdown donut */}
              <div className="flex items-center gap-5 mb-5">
                <div
                  className="w-20 h-20 rounded-full shrink-0 shadow-inner"
                  style={{ background: 'conic-gradient(#0e9f6e 0% 50%, #1a56db 50% 75%, #e85d04 75% 90%, #e5e7eb 90% 100%)' }}
                />
                <div className="space-y-1.5 text-xs text-gray-600">
                  {[
                    { color: '#0e9f6e', label: 'Ads — 50%' },
                    { color: '#1a56db', label: 'Subscriptions — 25%' },
                    { color: '#e85d04', label: 'Sponsored — 15%' },
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
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>Revenue: <strong className="text-gray-900">$1,250</strong></span>
                <span>Sponsor views: <strong className="text-gray-900">9.9K</strong></span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
