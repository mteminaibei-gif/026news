import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Subscribers — Journalist Portal',
  description: 'Manage and grow your subscriber base on 026News.',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const MONTHLY_SUBS = [
  { label: 'Nov', value: 980 },
  { label: 'Dec', value: 1020 },
  { label: 'Jan', value: 1080 },
  { label: 'Feb', value: 1130 },
  { label: 'Mar', value: 1200 },
  { label: 'Apr', value: 1250 },
]

const MOCK_SUBSCRIBERS = [
  { id: 1, name: 'David Kim', email: 'david@example.com', plan: 'Premium', since: '2024-01-15', avatar: 'https://i.pravatar.cc/40?img=10' },
  { id: 2, name: 'Maria Lopez', email: 'maria@example.com', plan: 'Pro', since: '2024-02-03', avatar: 'https://i.pravatar.cc/40?img=11' },
  { id: 3, name: 'James Omondi', email: 'james@example.com', plan: 'Free', since: '2024-02-20', avatar: 'https://i.pravatar.cc/40?img=12' },
  { id: 4, name: 'Amara Nwosu', email: 'amara@example.com', plan: 'Premium', since: '2024-03-08', avatar: 'https://i.pravatar.cc/40?img=13' },
  { id: 5, name: 'Sarah Chen', email: 'sarah@example.com', plan: 'Free', since: '2024-03-22', avatar: 'https://i.pravatar.cc/40?img=14' },
]

export default function JournalistSubscribersPage() {
  const premium = MOCK_SUBSCRIBERS.filter(s => s.plan !== 'Free').length
  const free = MOCK_SUBSCRIBERS.filter(s => s.plan === 'Free').length

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Subscribers" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Subscribers" value={JOURNALIST.subscribers.toLocaleString()} sub="↑ +4% this month" accent="blue" />
          <StatCard label="Premium Members" value={String(premium)} sub="↑ +12% this month" accent="orange" />
          <StatCard label="Free Members" value={String(free)} sub="↑ +2% this month" accent="green" />
          <StatCard label="Churn Rate" value="2.1%" sub="↓ -0.4% improving" accent="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Growth chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Subscriber Growth</h2>
            <BarChart data={MONTHLY_SUBS} />
          </div>

          {/* Plan breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Plan Breakdown</h2>
            <div className="space-y-4">
              {[
                { plan: 'Pro', count: 120, color: 'bg-purple-500' },
                { plan: 'Premium', count: 430, color: 'bg-blue-500' },
                { plan: 'Free', count: 700, color: 'bg-gray-300' },
              ].map(p => (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{p.plan}</span>
                    <span className="font-bold text-gray-800">{p.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full ${p.color} rounded-full`}
                      style={{ width: `${(p.count / JOURNALIST.subscribers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-700 font-semibold">
                Upgrade free readers to premium with exclusive content!
              </p>
            </div>
          </div>
        </div>

        {/* Subscriber list */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">Recent Subscribers</h2>
            <span className="text-xs text-gray-400">Showing 5 of {JOURNALIST.subscribers.toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Subscriber</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Plan</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Since</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SUBSCRIBERS.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="font-medium text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.plan === 'Pro' ? 'bg-purple-100 text-purple-700' :
                        s.plan === 'Premium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{s.since}</td>
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
