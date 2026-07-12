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

const PLAN_COLORS: Record<string, { background: string; color: string }> = {
  Pro:     { background: 'var(--warning-light)', color: 'var(--warning)' },
  Premium: { background: 'var(--success-light)', color: 'var(--primary)' },
  Free:    { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' },
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
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Subscriber Growth</h2>
            <BarChart data={MONTHLY_SUBS} />
          </div>

          {/* Plan breakdown */}
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Plan Breakdown</h2>
            <div className="space-y-4">
              {[
                { plan: 'Pro',     count: 120, color: 'linear-gradient(to right, var(--warning), var(--warning))' },
                { plan: 'Premium', count: 430, color: 'linear-gradient(to right, var(--primary), var(--accent))' },
                { plan: 'Free',    count: 700, color: 'linear-gradient(to right, var(--border), var(--border))' },
              ].map(p => (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(p.count / JOURNALIST.subscribers) * 100}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl p-3 text-center" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                💡 Upgrade free readers with exclusive content!
              </p>
            </div>
          </div>
        </div>

        {/* Subscriber list */}
        <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Recent Subscribers</h2>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing 5 of {JOURNALIST.subscribers.toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                  <th className="px-4 py-3 text-left">Subscriber</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Since</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SUBSCRIBERS.map(s => (
                  <tr key={s.id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Image src={s.avatar} alt={s.name} width={28} height={28}
                          className="rounded-full object-cover" style={{ border: '2px solid var(--border-subtle)' }} />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{s.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={PLAN_COLORS[s.plan]}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.since}</td>
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
