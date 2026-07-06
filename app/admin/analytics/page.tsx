import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Platform Analytics — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

const MONTHLY_TRAFFIC = [
  { label: 'Nov', value: 28000 },
  { label: 'Dec', value: 34000 },
  { label: 'Jan', value: 31000 },
  { label: 'Feb', value: 42000 },
  { label: 'Mar', value: 56000 },
  { label: 'Apr', value: 48000 },
]

const MONTHLY_REVENUE = [
  { label: 'Nov', value: 1200 },
  { label: 'Dec', value: 1600 },
  { label: 'Jan', value: 1450 },
  { label: 'Feb', value: 2100 },
  { label: 'Mar', value: 2800 },
  { label: 'Apr', value: 2400 },
]

const TOP_COUNTRIES = [
  { flag: '🇰🇪', country: 'Kenya', sessions: 18400, percent: 34 },
  { flag: '🇳🇬', country: 'Nigeria', sessions: 11900, percent: 22 },
  { flag: '🇿🇦', country: 'South Africa', sessions: 8100, percent: 15 },
  { flag: '🇬🇧', country: 'United Kingdom', sessions: 6500, percent: 12 },
  { flag: '🇺🇸', country: 'United States', sessions: 5400, percent: 10 },
]

export default function AdminAnalyticsPage() {
  const totalViews = MOCK_ARTICLES.reduce((s, a) => s + a.views, 0)
  const published = MOCK_ARTICLES.filter(a => a.status === 'published')

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Platform Analytics" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Page Views" value={formatNumber(totalViews)} sub="↑ +18% this month" accent="blue" />
          <StatCard label="Monthly Visits" value="48,000" sub="↓ -14% vs last month" accent="red" />
          <StatCard label="Avg Session" value="3m 42s" sub="↑ +8% vs last month" accent="green" />
          <StatCard label="Bounce Rate" value="38.4%" sub="↓ -2% improving" accent="green" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Monthly Traffic (Sessions)</h2>
            <BarChart data={MONTHLY_TRAFFIC} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Monthly Revenue (USD)</h2>
            <BarChart data={MONTHLY_REVENUE} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top articles */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900">Top Articles by Views</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {published.sort((a, b) => b.views - a.views).slice(0, 6).map((a, i) => (
                <div key={a.article_id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-2xl font-black text-gray-200 min-w-[28px]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.category?.name} · {formatNumber(a.views)} views</p>
                  </div>
                  <div className="text-sm font-bold text-green-600 shrink-0">${a.earnings.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Audience by country */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Top Audiences</h2>
            <div className="space-y-3">
              {TOP_COUNTRIES.map(c => (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{c.country}</span>
                      <span className="font-bold text-gray-600">{c.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.percent}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{c.sessions.toLocaleString()} sessions</p>
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
