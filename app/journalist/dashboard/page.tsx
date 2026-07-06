import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { BarChart } from '@/components/ui/BarChart'
import Image from 'next/image'
import Link from 'next/link'
import { MOCK_ARTICLES, MOCK_USERS, MOCK_JOURNALIST_STATS } from '@/lib/mock-data'
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Journalist Dashboard' }

export default function JournalistDashboard() {
  const user = MOCK_USERS[0]
  const myArticles = MOCK_ARTICLES.filter(a => a.author_id === user.user_id)
  const stats = MOCK_JOURNALIST_STATS

  return (
    <>
      <Topbar title="Journalist Dashboard" user={{ name: user.name, profile_image: user.profile_image }}>
        <Link href="/journalist/create" className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          + New Article
        </Link>
      </Topbar>

      <div className="p-6 flex-1">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Views" value={formatNumber(stats.totalViews)} sub="📈 +12% this month" accent="blue" icon="👁" />
          <StatCard label="Total Earnings" value={formatCurrency(stats.totalEarnings)} sub={`This month: ${formatCurrency(stats.thisMonthEarnings)}`} accent="orange" icon="💰" />
          <StatCard label="Articles Published" value={stats.articlesPublished} sub={`Drafts: ${stats.drafts} · Review: ${stats.underReview}`} accent="green" icon="📰" />
        </div>

        {/* Articles + Earnings row */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Recent Articles */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">📰 Recent Articles</h2>
              <Link href="/journalist/create" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                + New Article
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {myArticles.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No articles yet. <Link href="/journalist/create" className="text-blue-600">Create your first one!</Link>
                </div>
              ) : (
                myArticles.slice(0, 5).map(a => (
                  <div key={a.article_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={a.featured_image ?? ''} alt={a.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(a.created_at)} · 👁 {formatNumber(a.views)}</p>
                    </div>
                    <Badge status={a.status} />
                    <span className="text-sm font-bold text-emerald-600 shrink-0">{formatCurrency(a.earnings)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">💰 Earnings Overview</h2>
              <span className="text-xs text-gray-400">Last 9 months</span>
            </div>
            <div className="px-5 pb-4 pt-3">
              <BarChart
                data={[200, 280, 240, 350, 320, 410, 380, 460, 530]}
                labels={['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']}
                height={80}
              />
              <hr className="my-4 border-gray-100" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-base font-extrabold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-orange-500">{formatCurrency(stats.thisMonthEarnings)}</p>
                  <p className="text-xs text-gray-400">This Month</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-emerald-600">Pending</p>
                  <p className="text-xs text-gray-400">Payout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics + All Articles */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* Audience Insights */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">👥 Audience Insights</h2>
            </div>
            <div className="p-5">
              {/* Donut (CSS) */}
              <div className="flex items-center justify-center gap-6 mb-4">
                <div
                  className="w-24 h-24 rounded-full shrink-0 shadow-inner"
                  style={{ background: 'conic-gradient(#1a56db 0% 45%, #e85d04 45% 70%, #0e9f6e 70% 85%, #e5e7eb 85% 100%)' }}
                />
                <div className="space-y-1.5 text-sm">
                  {[
                    { color: '#1a56db', label: 'Tech', pct: '45%' },
                    { color: '#e85d04', label: 'Science', pct: '25%' },
                    { color: '#0e9f6e', label: 'Business', pct: '15%' },
                    { color: '#e5e7eb', label: 'Other', pct: '15%' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.label} — {item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="border-gray-100 my-3" />
              {[
                { icon: '👥', label: 'New Subscribers', value: formatNumber(stats.newSubscribers) },
                { icon: '💬', label: 'Total Comments', value: stats.totalComments.toLocaleString() },
                { icon: '🔁', label: 'Shares', value: stats.shares.toLocaleString() },
                { icon: '❤️', label: 'Avg. Engagement', value: `${stats.avgEngagement}%` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-lg w-7 text-center">{item.icon}</span>
                  <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Articles table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">📋 All Articles</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {['All', 'Published', 'Drafts', 'Review'].map(tab => (
                  <button key={tab} className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${tab === 'All' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Title</th>
                  <th className="px-3 py-2.5 text-left">Views</th>
                  <th className="px-3 py-2.5 text-left">Earnings</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myArticles.slice(0, 5).map(a => (
                  <tr key={a.article_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[160px]">{a.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">👁 {formatNumber(a.views)}</td>
                    <td className="px-3 py-3 font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(a.earnings)}</td>
                    <td className="px-3 py-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-base mb-1">Ready to publish your next story?</h3>
            <p className="text-white/60 text-sm">Create, submit, and start earning from your journalism today.</p>
          </div>
          <Link href="/journalist/create" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shrink-0">
            ✏️ Create New Article
          </Link>
        </div>

      </div>
    </>
  )
}
