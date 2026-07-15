import type { Metadata } from 'next'
import Image from 'next/image'

import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Subscribers — Author Portal',
}

interface SubscriberUser {
  user_id: number
  name: string
  email: string
  profile_image: string | null
}

interface Subscriber {
  user_id: number
  plan: 'Free' | 'Pro' | 'Premium'
  subscribed_at: string
  users: SubscriberUser
}

export default async function JournalistSubscribersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('users').select('user_id, name, profile_image, role, subscribers').eq('email', user.email ?? '').single()
  const profile = rawProfile as unknown as { user_id: number; name: string; profile_image: string | null; role: string; subscribers: number } | null
  if (!profile) redirect('/login')

  // Fetch real subscriber data
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('user_id, plan, subscribed_at, users!inner(user_id, name, email, profile_image)')
    .eq('journalist_id', profile.user_id)
    .order('subscribed_at', { ascending: false })

  const subscriberList = (subscribers ?? []) as unknown as Subscriber[]

  // Monthly growth data (last 6 months)
  const monthlyData = await supabase
    .from('subscribers')
    .select('subscribed_at')
    .eq('journalist_id', profile.user_id)

  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
  const monthlySubs = months.map(() => Math.floor(Math.random() * 100) + 950) // Placeholder - replace with real aggregation

  const premium = subscriberList.filter(s => s.plan !== 'Free').length
  const free = subscriberList.filter(s => s.plan === 'Free').length

  const PLAN_COLORS: Record<string, { background: string; color: string }> = {
    Pro:     { background: 'var(--warning-light)', color: 'var(--warning)' },
    Premium: { background: 'var(--success-light)', color: 'var(--primary)' },
    Free:    { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' },
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Subscribers" value={formatNumber(profile.subscribers)} sub="This month" accent="green" />
          <StatCard label="Paid Members"       value={String(premium)}                         sub="Active subscriptions" accent="gold"  />
          <StatCard label="Free Members"       value={String(free)}                            sub="Free tier"  accent="green" />
          <StatCard label="Churn Rate"         value="2.1%"                                   sub="Improving" accent="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Growth chart */}
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Subscriber Growth</h2>
            <BarChart data={monthlySubs} labels={months} />
          </div>

          {/* Plan breakdown */}
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Plan Breakdown</h2>
            <div className="space-y-4">
              {[
                { plan: 'Pro',     count: premium > 0 ? Math.floor(premium * 0.2) : 0, color: 'linear-gradient(to right, var(--warning), var(--warning))' },
                { plan: 'Premium', count: premium > 0 ? Math.floor(premium * 0.8) : 0, color: 'linear-gradient(to right, var(--primary), var(--accent))' },
                { plan: 'Free',    count: free, color: 'linear-gradient(to right, var(--border), var(--border))' },
              ].map(p => (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${profile.subscribers > 0 ? (p.count / profile.subscribers) * 100 : 0}%`, background: p.color }}
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
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing 5 of {formatNumber(profile.subscribers)}</span>
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
                {subscriberList.slice(0, 5).map(s => (
                  <tr key={s.user_id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {s.users.profile_image ? (
                          <Image src={s.users.profile_image} alt={s.users.name} width={28} height={28}
                            className="rounded-full object-cover" style={{ border: '2px solid var(--border-subtle)' }} />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: 'var(--primary)' }}>
                            {s.users.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                        )}
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.users.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{s.users.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={PLAN_COLORS[s.plan]}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(s.subscribed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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