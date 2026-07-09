import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_JOURNALIST_STATS, MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = { title: 'Earnings — Journalist Portal' }

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'Ads Revenue',       article: 'Research Team Discovers New Exoplanet', amount: 38.40, date: '2024-04-20', status: 'paid'    },
  { id: 2, type: 'Subscription Share',article: 'Breakthrough in Renewable Energy',      amount: 22.10, date: '2024-04-15', status: 'paid'    },
  { id: 3, type: 'Sponsored Content', article: 'Africa Tech Summit 2024',               amount: 150.0, date: '2024-04-10', status: 'paid'    },
  { id: 4, type: 'Ads Revenue',       article: 'New Space Telescope',                   amount: 18.90, date: '2024-04-05', status: 'pending' },
  { id: 5, type: 'Subscription Share',article: 'Climate Report',                        amount: 30.50, date: '2024-03-28', status: 'paid'    },
]

const MONTHLY_EARNINGS = [
  { label: 'Nov', value: 180 }, { label: 'Dec', value: 210 }, { label: 'Jan', value: 195 },
  { label: 'Feb', value: 280 }, { label: 'Mar', value: 320 }, { label: 'Apr', value: 260 },
]

export default function JournalistEarningsPage() {
  const totalPending = MOCK_TRANSACTIONS.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Earnings" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Earnings"   value={`$${JOURNALIST.earnings.toFixed(2)}`}                              sub="↑ +12% all time"        accent="green" />
          <StatCard label="This Month"       value="$260.00"                                                            sub="↑ +8% vs last month"    accent="green" />
          <StatCard label="Pending Payout"   value={`$${totalPending.toFixed(2)}`}                                     sub="Awaiting processing"     accent="gold"  />
          <StatCard label="Avg per Article"  value={`$${(JOURNALIST.earnings / JOURNALIST.articles).toFixed(2)}`}      sub="↑ +5% vs last month"    accent="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Monthly chart */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
            <h2 className="font-extrabold text-[#1a5c2a] mb-4">Monthly Earnings (USD)</h2>
            <BarChart data={MONTHLY_EARNINGS} />
          </div>

          {/* Revenue breakdown */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
            <h2 className="font-extrabold text-[#1a5c2a] mb-4">Revenue Sources</h2>
            <div className="space-y-3">
              {[
                { label: 'Ad Revenue',    percent: 45, color: 'from-[#1a5c2a] to-[#4caf28]' },
                { label: 'Subscriptions', percent: 35, color: 'from-[#f5c518] to-[#f5c518]' },
                { label: 'Sponsored',     percent: 20, color: 'from-[#c8102e] to-[#e03050]' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-bold text-gray-800">{s.percent}%</span>
                  </div>
                  <div className="h-2 bg-[#f0faf2] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#e8f5ea]">
              <p className="text-xs text-gray-400 text-center">Payouts processed every 15th of the month</p>
              <button className="mt-3 w-full bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md">
                Request Payout
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="font-extrabold text-[#1a5c2a]">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Article</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {MOCK_TRANSACTIONS.map(t => (
                  <tr key={t.id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3 font-medium text-gray-700">{t.type}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.article}</td>
                    <td className="px-4 py-3 font-bold text-[#1a5c2a]">${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        t.status === 'paid' ? 'bg-[#e8f5ea] text-[#1a5c2a]' : 'bg-[#fff8e1] text-[#c8820a]'
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
