'use client'

import { useState, useEffect } from 'react'

import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber } from '@/lib/utils'

type Profile = { user_id: number; name: string; profile_image: string | null }
type EarningRow = { earning_id: number; amount: number; source: string; payout_status: string; created_at: string; article_id: number | null }
type PayoutRow = { payout_id: number; amount: number; journalist_cut: number; status: string; period_start: string; period_end: string; payment_method: string; created_at: string }

export default function JournalistEarningsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [earnings, setEarnings] = useState<EarningRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase
          .from('users')
          .select('user_id, name, profile_image')
          .eq('email', user.email ?? '')
          .single()
        if (!userData) return
        setProfile(userData as Profile)

        const { data: earns } = await supabase
          .from('earnings')
          .select('earning_id, amount, source, payout_status, created_at, article_id')
          .eq('user_id', (userData as Profile).user_id)
          .order('created_at', { ascending: false })
          .limit(50)
        setEarnings((earns as EarningRow[]) || [])

        const { data: payoutData } = await supabase
          .from('payout_requests')
          .select('payout_id, amount, journalist_cut, status, period_start, period_end, payment_method, created_at')
          .eq('user_id', (userData as Profile).user_id)
          .order('created_at', { ascending: false })
          .limit(10)
        setPayouts((payoutData as PayoutRow[]) || [])
      } catch (err) {
        console.error('Error loading earnings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh', color: 'var(--text-tertiary)' }}>
        Please log in to view earnings.
      </div>
    )
  }

  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const pendingAmount = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthEarnings = earnings.filter(e => e.created_at.startsWith(thisMonth)).reduce((s, e) => s + Number(e.amount), 0)
  const publishedCount = earnings.length
  const avgPerArticle = publishedCount > 0 ? totalEarnings / publishedCount : 0

  const chartData: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartData.push({
      label: d.toLocaleString('default', { month: 'short' }),
      value: earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0),
    })
  }

  const sourceBreakdown = earnings.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)
  const sourceEntries = Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1])
  const totalSource = sourceEntries.reduce((s, [, v]) => s + v, 0) || 1

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} sub="All time" accent="kenya" icon="💰" />
          <StatCard label="This Month" value={formatCurrency(monthEarnings)} sub="Current month" accent="kenya" icon="📈" />
          <StatCard label="Pending Payout" value={formatCurrency(pendingAmount)} sub="Awaiting processing" accent="kenya" icon="⏳" />
          <StatCard label="Avg per Article" value={formatCurrency(avgPerArticle)} sub={`${publishedCount} articles`} accent="kenya" icon="📊" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Monthly Earnings</h2>
            <BarChart data={chartData} height={100} />
          </div>

          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-4" style={{ color: 'var(--primary)' }}>Revenue Sources</h2>
            <div className="space-y-3">
              {sourceEntries.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No earnings data yet.</p>
              )}
              {sourceEntries.map(([source, amount]) => {
                const percent = Math.round((amount / totalSource) * 100)
                const colors: Record<string, string> = {
                  ads: 'linear-gradient(to right, var(--primary), var(--accent))',
                  subscriptions: 'linear-gradient(to right, var(--warning), var(--warning))',
                  sponsored: 'linear-gradient(to right, var(--error), #e03050)',
                }
                return (
                  <div key={source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{percent}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: colors[source] || colors.ads }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>Payouts processed every 15th of the month</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            {earnings.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                <p>No transactions yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(e => (
                    <tr key={e.earning_id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3 font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>{e.source}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(e.amount))}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <Badge status={e.payout_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
