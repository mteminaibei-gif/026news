'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

type JournalistEarn = { user_id: number; name: string; email: string; total: number; pending: number }
type PayoutRow = {
  payout_id: number; amount: number; journalist_cut: number; platform_fee: number
  payment_method: string; status: string; period_start: string; period_end: string; paid_at: string | null
  journalist: { name: string; email: string } | null
}

interface Props {
  journalistEarnings: JournalistEarn[]
  payouts: PayoutRow[]
}

export function AdminPayoutPanel({ journalistEarnings, payouts }: Props) {
  const router  = useRouter()
  const today   = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [periodStart, setPeriodStart]   = useState(firstOfMonth)
  const [periodEnd, setPeriodEnd]       = useState(today)
  const [method, setMethod]             = useState<'manual' | 'mpesa' | 'paypal'>('manual')
  const [triggerPayment, setTriggerPayment] = useState(false)
  const [running, setRunning]           = useState(false)
  const [result, setResult]             = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  async function runPayout() {
    setRunning(true); setResult(null); setError(null)
    try {
      const res  = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end:   periodEnd,
          payment_method: method,
          trigger_payment: triggerPayment,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Payout failed'); return }
      setResult(`✅ ${data.payouts_created} payout(s) created — Journalist share: ${formatCurrency(data.journalist_total)} · Platform: ${formatCurrency(data.platform_total)}`)
      router.refresh()
    } catch {
      setError('Network error — try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Payout trigger */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">💸 Run Monthly Payout (50 / 50 Split)</h2>
        <div className="grid sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as typeof method)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
              <option value="manual">Manual</option>
              <option value="mpesa">M-Pesa</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={triggerPayment} onChange={e => setTriggerPayment(e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-xs text-gray-600 font-semibold">Auto-send payments</span>
            </label>
          </div>
        </div>

        {result && <p className="text-sm text-emerald-600 font-semibold mb-3">{result}</p>}
        {error  && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          onClick={runPayout}
          disabled={running}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {running ? '⏳ Processing…' : '💸 Run Payout Now'}
        </button>
      </div>

      {/* Top journalists by pending earnings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">✍️ Journalist Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">Journalist</th>
                <th className="px-4 py-2.5 text-right">Total Earned</th>
                <th className="px-4 py-2.5 text-right">Pending (50%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {journalistEarnings.map(j => (
                <tr key={j.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{j.name}</p>
                    <p className="text-xs text-gray-400">{j.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatCurrency(j.total)}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-500">{formatCurrency(j.pending * 0.5)}</td>
                </tr>
              ))}
              {journalistEarnings.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">No earnings data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout history */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">📋 Payout History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Journalist</th>
                  <th className="px-4 py-2.5 text-left">Period</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Their Cut</th>
                  <th className="px-4 py-2.5 text-left">Method</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map(p => (
                  <tr key={p.payout_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.journalist?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{p.journalist?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">{formatCurrency(Number(p.amount))}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{formatCurrency(Number(p.journalist_cut))}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
