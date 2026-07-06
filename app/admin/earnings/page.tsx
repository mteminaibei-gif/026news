import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Platform Earnings — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!
const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

const MONTHLY_EARNINGS = [
  { label: 'Nov', value: 1200 },
  { label: 'Dec', value: 1600 },
  { label: 'Jan', value: 1450 },
  { label: 'Feb', value: 2100 },
  { label: 'Mar', value: 2800 },
  { label: 'Apr', value: 2400 },
]

const REVENUE_SOURCES = [
  { label: 'Ad Revenue', value: 5800, percent: 48, color: 'bg-blue-500' },
  { label: 'Subscriptions', value: 3900, percent: 32, color: 'bg-orange-500' },
  { label: 'Sponsored Content', value: 1500, percent: 12, color: 'bg-green-500' },
  { label: 'Affiliate', value: 950, percent: 8, color: 'bg-purple-500' },
]

export default function AdminEarningsPage() {
  const totalJournalistEarnings = journalists.reduce((s, j) => s + j.earnings, 0)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Platform Earnings" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value="$12,150" sub="↑ +22% all time" accent="green" />
          <StatCard label="This Month" value="$2,400" sub="↓ -14% vs last month" accent="red" />
          <StatCard label="Journalist Payouts" value={`$${totalJournalistEarnings.toFixed(2)}`} sub="↑ +8% this month" accent="blue" />
          <StatCard label="Platform Net" value="$3,270" sub="↑ +31% this month" accent="orange" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Monthly Revenue (USD)</h2>
            <BarChart data={MONTHLY_EARNINGS} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              {REVENUE_SOURCES.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-bold">${s.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Payout period: 1st — 15th each month</p>
              <button className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                Process Payouts
              </button>
            </div>
          </div>
        </div>

        {/* Journalist payout table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">Journalist Earnings & Payouts</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Journalist</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Articles</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Total Earned</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">This Month</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Payout Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journalists.map(j => (
                  <tr key={j.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{j.name}</td>
                    <td className="px-4 py-3 text-gray-600">{j.articles}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">${j.earnings.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      ${(j.earnings * 0.11).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-bold text-green-600 hover:underline">Pay Now</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
