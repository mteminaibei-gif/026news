import type { Metadata } from 'next'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Subscribers — Author Portal',
}

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

const MONTHLY_SUBS = [
  { label: 'Nov', value: 980  },
  { label: 'Dec', value: 1020 },
  { label: 'Jan', value: 1080 },
  { label: 'Feb', value: 1130 },
  { label: 'Mar', value: 1200 },
  { label: 'Apr', value: 1250 },
]

const MOCK_SUBSCRIBERS = [
  { id: 1, name: 'David Kim',    email: 'david@example.com',  plan: 'Premium', since: '2024-01-15', avatar: 'https://i.pravatar.cc/40?img=10' },
  { id: 2, name: 'Maria Lopez',  email: 'maria@example.com',  plan: 'Pro',     since: '2024-02-03', avatar: 'https://i.pravatar.cc/40?img=11' },
  { id: 3, name: 'James Omondi', email: 'james@example.com',  plan: 'Free',    since: '2024-02-20', avatar: 'https://i.pravatar.cc/40?img=12' },
  { id: 4, name: 'Amara Nwosu',  email: 'amara@example.com',  plan: 'Premium', since: '2024-03-08', avatar: 'https://i.pravatar.cc/40?img=13' },
  { id: 5, name: 'Sarah Chen',   email: 'sarah@example.com',  plan: 'Free',    since: '2024-03-22', avatar: 'https://i.pravatar.cc/40?img=14' },
]

const PLAN_COLORS: Record<string, string> = {
  Pro:     'bg-[#fff8e1] text-[#c8820a]',
  Premium: 'bg-[#e8f5ea] text-[#1a5c2a]',
  Free:    'bg-gray-100 text-gray-500',
}

export default function JournalistSubscribersPage() {
  const premium = MOCK_SUBSCRIBERS.filter(s => s.plan !== 'Free').length
  const free    = MOCK_SUBSCRIBERS.filter(s => s.plan === 'Free').length

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Subscribers" user={JOURNALIST} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Subscribers" value={JOURNALIST.subscribers.toLocaleString()} sub="↑ +4% this month"  accent="green" />
          <StatCard label="Paid Members"       value={String(premium)}                         sub="↑ +12% this month" accent="gold"  />
          <StatCard label="Free Members"       value={String(free)}                            sub="↑ +2% this month"  accent="green" />
          <StatCard label="Churn Rate"         value="2.1%"                                   sub="↓ -0.4% improving" accent="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Growth chart */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
            <h2 className="font-extrabold text-[#1a5c2a] mb-4">Subscriber Growth</h2>
            <BarChart data={MONTHLY_SUBS} />
          </div>

          {/* Plan breakdown */}
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
            <h2 className="font-extrabold text-[#1a5c2a] mb-4">Plan Breakdown</h2>
            <div className="space-y-4">
              {[
                { plan: 'Pro',     count: 120, color: 'from-[#f5c518] to-[#f5c518]' },
                { plan: 'Premium', count: 430, color: 'from-[#1a5c2a] to-[#4caf28]' },
                { plan: 'Free',    count: 700, color: 'from-gray-200 to-gray-300'   },
              ].map(p => (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{p.plan}</span>
                    <span className="font-bold text-gray-800">{p.count}</span>
                  </div>
                  <div className="h-2 bg-[#f0faf2] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${p.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(p.count / JOURNALIST.subscribers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#f0faf2] border border-[#e8f5ea] rounded-xl p-3 text-center">
              <p className="text-xs text-[#1a5c2a] font-semibold">
                💡 Upgrade free readers with exclusive content!
              </p>
            </div>
          </div>
        </div>

        {/* Subscriber list */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="font-extrabold text-[#1a5c2a]">Recent Subscribers</h2>
            <span className="text-xs text-gray-400">Showing 5 of {JOURNALIST.subscribers.toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Subscriber</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {MOCK_SUBSCRIBERS.map(s => (
                  <tr key={s.id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Image src={s.avatar} alt={s.name} width={28} height={28}
                          className="rounded-full object-cover ring-2 ring-[#e8f5ea]" />
                        <span className="font-semibold text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLAN_COLORS[s.plan]}`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.since}</td>
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
