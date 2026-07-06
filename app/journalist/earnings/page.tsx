import type { Metadata } from 'next'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_JOURNALIST_STATS, MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Earnings — Journalist Portal',
  description: 'Track your earnings, payouts, and revenue breakdown on 026News.',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'Ads Revenue', article: 'Research Team Discovers New Exoplanet', amount: 38.40, date: '2024-04-20', status: 'paid' },
  { id: 2, type: 'Subscription Share', article: 'Breakthrough in Renewable Energy', amount: 22.10, date: '2024-04-15', status: 'paid' },
  { id: 3, type: 'Sponsored Content', article: 'Africa Tech Summit 2024', amount: 150.00, date: '2024-04-10', status: 'paid' },
  { id: 4, type: 'Ads Revenue', article: 'New Space Telescope', amount: 18.90, date: '2024-04-05', status: 'pending' },
  { id: 5, type: 'Subscription Share', article: 'Climate Report', amount: 30.50, date: '2024-03-28', status: 'paid' },
]

const MONTHLY_EARNINGS = [
  { label: 'Nov', value: 180 },
  { label: 'Dec', value: 210 },
  { label: 'Jan', value: 195 },
  { label: 'Feb', value: 280 },
  { label: 'Mar', value: 320 },
  { label: 'Apr', value: 260 },
]

export default function JournalistEarningsPage() {
  const stats = MOCK_JOURNALIST_STATS
  const totalPending = MOCK_TRANSACTIONS.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Earnings" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Earnings" value={`$${JOURNALIST.earnings.toFixed(2)}`} sub="↑ +12% all time" accent="green" />
          <StatCard label="This Month" value="$260.00" sub="↑ +8% vs last month" accent="blue" />
          <StatCard label="Pending Payout" value={`$${totalPending.toFixed(2)}`} sub="Awaiting processing" accent="orange" />
          <StatCard label="Avg per Article" value={`$${(JOURNALIST.earnings / JOURNALIST.articles).toFixed(2)}`} sub="↑ +5% vs last month" accent="blue" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Monthly Earnings (USD)</h2>
            <BarChart data={MONTHLY_EARNINGS} />
          </div>

          {/* Revenue breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Revenue Sources</h2>
            <div className="space-y-3">
              {[
                { label: 'Ad Revenue', percent: 45, color: 'bg-blue-500' },
                { label: 'Subscriptions', percent: 35, color: 'bg-orange-500' },
                { label: 'Sponsored', percent: 20, color: 'bg-green-500' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-bold text-gray-800">{s.percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Payouts processed every 15th of the month</p>
              <button className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                Request Payout
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-extrabold text-gray-900">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Article</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{t.type}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.article}</td>
                    <td className="px-4 py-3 font-bold text-green-600">${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.status}
                      </span>
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
