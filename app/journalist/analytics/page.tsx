import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Analytics — Journalist Portal',
  description: 'Deep dive into your article performance and audience insights on 026News.',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const WEEKLY_VIEWS = [
  { label: 'Mon', value: 420 },
  { label: 'Tue', value: 650 },
  { label: 'Wed', value: 580 },
  { label: 'Thu', value: 890 },
  { label: 'Fri', value: 1100 },
  { label: 'Sat', value: 760 },
  { label: 'Sun', value: 490 },
]

const TOP_SOURCES = [
  { label: 'Direct', percent: 38 },
  { label: 'Google Search', percent: 29 },
  { label: 'Twitter / X', percent: 16 },
  { label: 'Facebook', percent: 11 },
  { label: 'Other', percent: 6 },
]

const TOP_COUNTRIES = [
  { flag: '🇰🇪', country: 'Kenya', percent: 34 },
  { flag: '🇳🇬', country: 'Nigeria', percent: 22 },
  { flag: '🇿🇦', country: 'South Africa', percent: 15 },
  { flag: '🇬🇧', country: 'United Kingdom', percent: 12 },
  { flag: '🇺🇸', country: 'United States', percent: 10 },
  { flag: '🌍', country: 'Other', percent: 7 },
]

export default function JournalistAnalyticsPage() {
  const myArticles = MOCK_ARTICLES.filter(a => a.author_id === JOURNALIST.user_id && a.status === 'published')
  const totalViews = myArticles.reduce((s, a) => s + a.views, 0)
  const avgViews = myArticles.length ? Math.round(totalViews / myArticles.length) : 0

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Analytics" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Views" value={formatNumber(totalViews)} sub="↑ +18% this month" accent="blue" />
          <StatCard label="Avg Views/Article" value={formatNumber(avgViews)} sub="↑ +5% vs last month" accent="blue" />
          <StatCard label="Total Comments" value="347" sub="↑ +22% this month" accent="green" />
          <StatCard label="Total Shares" value="1,290" sub="↑ +9% this month" accent="orange" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly views chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Views This Week</h2>
            <BarChart data={WEEKLY_VIEWS} />
          </div>

          {/* Traffic sources */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Traffic Sources</h2>
            <div className="space-y-3">
              {TOP_SOURCES.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-bold">{s.percent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top articles */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900">Top Performing Articles</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {myArticles.sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => (
                <div key={a.article_id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-2xl font-black text-gray-200 min-w-[24px]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{formatNumber(a.views)} views</p>
                  </div>
                </div>
              ))}
              {myArticles.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No published articles yet.</p>
              )}
            </div>
          </div>

          {/* Audience by country */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Audience by Country</h2>
            <div className="space-y-3">
              {TOP_COUNTRIES.map(c => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{c.country}</span>
                      <span className="font-bold">{c.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${c.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
