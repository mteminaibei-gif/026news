import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { BarChart } from '@/components/ui/BarChart'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AdminPayoutPanel } from '@/components/admin/AdminPayoutPanel'

export const metadata: Metadata = { title: 'Platform Earnings — Admin Panel' }

type EarnRow   = { amount: number; source: string; payout_status: string; created_at: string }
type PayoutRow = {
  payout_id: number; amount: number; journalist_cut: number; platform_fee: number
  payment_method: string; status: string; period_start: string; period_end: string; paid_at: string | null
  journalist: { name: string; email: string } | null
}
type JournalistEarn = { user_id: number; name: string; email: string; total: number; pending: number }

export default async function AdminEarningsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase.from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  // All earnings
  const { data: rawEarnings } = await supabase
    .from('earnings')
    .select('amount, source, payout_status, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const earnings = (rawEarnings ?? []) as unknown as EarnRow[]

  // Payout history
  const { data: rawPayouts } = await supabase
    .from('payout_requests')
    .select('payout_id, amount, journalist_cut, platform_fee, payment_method, status, period_start, period_end, paid_at, journalist:users(name,email)')
    .order('created_at', { ascending: false })
    .limit(50)
  const payouts = (rawPayouts ?? []) as unknown as PayoutRow[]

  // Top-earning journalists
  const { data: rawJournalists } = await supabase
    .from('users')
    .select('user_id, name, email')
    .eq('role', 'journalist' as never)
    .eq('status', 'active' as never)
  const journalists = (rawJournalists ?? []) as unknown as { user_id: number; name: string; email: string }[]

  const { data: rawAllEarn } = await supabase
    .from('earnings')
    .select('user_id, amount, payout_status')
  const allEarn = (rawAllEarn ?? []) as unknown as { user_id: number; amount: number; payout_status: string }[]

  const journalistEarnings: JournalistEarn[] = journalists.map(j => ({
    ...j,
    total:   allEarn.filter(e => e.user_id === j.user_id).reduce((s, e) => s + Number(e.amount), 0),
    pending: allEarn.filter(e => e.user_id === j.user_id && e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0),
  })).sort((a, b) => b.total - a.total).slice(0, 10)

  // Totals
  const totalRevenue = earnings.reduce((s, e) => s + Number(e.amount), 0)
  const pendingPayout = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const paidOut = earnings.filter(e => e.payout_status === 'paid').reduce((s, e) => s + Number(e.amount), 0)
  const platformRetained = paidOut * 0.5

  // Monthly chart (6 months)
  const chartData: number[]   = []
  const chartLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setMonth(d.getMonth() - i)
    const ym = d.toISOString().slice(0, 7)
    chartLabels.push(d.toLocaleString('default', { month: 'short' }))
    chartData.push(earnings.filter(e => e.created_at.startsWith(ym)).reduce((s, e) => s + Number(e.amount), 0))
  }

  return (
    <>
      <Topbar title="Platform Earnings" user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }} />

      <div className="p-6 flex-1 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="💰 Total Revenue"     value={formatCurrency(totalRevenue)}    sub="All time"                  accent="blue" />
          <StatCard label="⏳ Pending Payouts"   value={formatCurrency(pendingPayout)}   sub="50% journalist share due"  accent="orange" />
          <StatCard label="✅ Paid Out"           value={formatCurrency(paidOut * 0.5)}  sub="Journalist share paid"     accent="green" />
          <StatCard label="🏢 Platform Retained" value={formatCurrency(platformRetained)} sub="50% service fee"          accent="blue" />
        </div>

        {/* Monthly chart */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">📈 Monthly Revenue</h2>
          </div>
          <div className="px-5 pb-4 pt-3">
            <BarChart data={chartData} labels={chartLabels} height={80} />
          </div>
        </div>

        {/* Payout panel — client component for Pay Now button */}
        <AdminPayoutPanel
          journalistEarnings={journalistEarnings}
          payouts={payouts}
        />

      </div>
    </>
  )
}
