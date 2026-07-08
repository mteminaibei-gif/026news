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

const inputCls = 'w-full border border-[#e8f5ea] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 transition-all duration-300'

export function AdminPayoutPanel({ journalistEarnings, payouts }: Props) {
  const router        = useRouter()
  const today         = new Date().toISOString().slice(0, 10)
  const firstOfMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [periodStart, setPeriodStart]     = useState(firstOfMonth)
  const [periodEnd, setPeriodEnd]         = useState(today)
  const [method, setMethod]               = useState<'manual' | 'mpesa' | 'paypal'>('manual')
  const [triggerPayment, setTriggerPayment] = useState(false)
  const [running, setRunning]             = useState(false)
  const [result, setResult]               = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)

  async function runPayout() {
    setRunning(true); setResult(null); setError(null)
    try {
      const res  = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_start: periodStart, period_end: periodEnd, payment_method: method, trigger_payment: triggerPayment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Payout failed'); return }
      setResult(`✅ ${data.payouts_created} payout(s) created — Journalist: ${formatCurrency(data.journalist_total)} · Platform: ${formatCurrency(data.platform_total)}`)
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
      <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-[#f5c518]" />
          <h2 className="text-sm font-bold text-[#1a5c2a]">💸 Run Monthly Payout (50 / 50 Split)</h2>
        </div>
        <div className="grid sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as typeof method)}
              className={inputCls + ' bg-white'}>
              <option value="manual">Manual</option>
              <option value="mpesa">M-Pesa</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={triggerPayment} onChange={e => setTriggerPayment(e.target.checked)}
                className="w-4 h-4 accent-[#1a5c2a]" />
              <span className="text-xs text-gray-600 font-semibold group-hover:text-[#1a5c2a] transition-colors duration-300">
                Auto-send payments
              </span>
            </label>
          </div>
        </div>

        {result && <p className="text-sm text-[#1a5c2a] font-semibold bg-[#e8f5ea] px-3 py-2 rounded-xl mb-3">{result}</p>}
        {error  && <p className="text-sm text-[#c8102e] bg-[#fde8e8] px-3 py-2 rounded-xl mb-3">{error}</p>}

        <button
          onClick={runPayout}
          disabled={running}
          className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
        >
          {running ? '⏳ Processing…' : '💸 Run Payout Now'}
        </button>
      </div>

      {/* Top journalists by pending earnings */}
      <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
          <h2 className="text-sm font-bold text-[#1a5c2a]">✍️ Journalist Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left">Journalist</th>
                <th className="px-4 py-2.5 text-right">Total Earned</th>
                <th className="px-4 py-2.5 text-right">Pending (50%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0faf2]">
              {journalistEarnings.map(j => (
                <tr key={j.user_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{j.name}</p>
                    <p className="text-xs text-gray-500">{j.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1a5c2a]">{formatCurrency(j.total)}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#f5c518]">{formatCurrency(j.pending * 0.5)}</td>
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
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="text-sm font-bold text-[#1a5c2a]">📋 Payout History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">Journalist</th>
                  <th className="px-4 py-2.5 text-left">Period</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Their Cut</th>
                  <th className="px-4 py-2.5 text-left">Method</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {payouts.map(p => (
                  <tr key={p.payout_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{p.journalist?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{p.journalist?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-semibold">{formatCurrency(Number(p.amount))}</td>
                    <td className="px-4 py-3 text-right text-[#1a5c2a] font-bold">{formatCurrency(Number(p.journalist_cut))}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.payment_method}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
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
