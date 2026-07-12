import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_JOURNALIST_STATS, MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = { title: 'Earnings — Author Portal' }

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
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Monthly Earnings (USD)</h2>
            <BarChart data={MONTHLY_EARNINGS} />
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Revenue Sources</h2>
            <div className="space-y-3">
              {[
                { label: 'Ad Revenue',    percent: 45, color: 'linear-gradient(to right, var(--primary), var(--accent))' },
                { label: 'Subscriptions', percent: 35, color: 'linear-gradient(to right, var(--warning), var(--warning))' },
                { label: 'Sponsored',     percent: 20, color: 'linear-gradient(to right, var(--error), #e03050)' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.percent}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>Payouts processed every 15th of the month</p>
              <button className="mt-3 w-full font-bold py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                Request Payout
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Article</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRANSACTIONS.map(t => (
                  <tr key={t.id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{t.type}</td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{t.article}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: t.status === 'paid' ? 'var(--success-light)' : 'var(--warning-light)',
                          color: t.status === 'paid' ? 'var(--primary)' : 'var(--warning)',
                        }}>
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
