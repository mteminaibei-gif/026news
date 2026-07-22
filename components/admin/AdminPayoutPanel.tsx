'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, safeRefresh } from '@/lib/utils'
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

const inputCls = 'w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all duration-300'
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', ['--tw-ring-color' as string]: 'var(--success)' }

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
      setResult(`✅ ${data.payouts_created} payout(s) created — Author: ${formatCurrency(data.journalist_total)} · Platform: ${formatCurrency(data.platform_total)}`)
      safeRefresh(router)
    } catch {
      setError('Network error — try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Payout trigger */}
      <div className="backdrop-blur-sm rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full" style={{ background: 'var(--warning)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>💸 Run Monthly Payout (50 / 50 Split)</h2>
        </div>
        <div className="grid sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as typeof method)}
              className={inputCls + ' bg-white'} style={inputStyle}>
              <option value="manual">Manual</option>
              <option value="mpesa">M-Pesa</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={triggerPayment} onChange={e => setTriggerPayment(e.target.checked)}
                className="w-4 h-4" style={{ accentColor: 'var(--primary)' }} />
              <span className="text-xs font-semibold transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                Auto-send payments
              </span>
            </label>
          </div>
        </div>

        {result && <p className="text-sm font-semibold px-3 py-2 rounded-xl mb-3" style={{ color: 'var(--primary)', background: 'var(--border-subtle)' }}>{result}</p>}
        {error  && <p className="text-sm px-3 py-2 rounded-xl mb-3" style={{ color: 'var(--error)', background: 'var(--error-light)' }}>{error}</p>}

        <button
          onClick={runPayout}
          disabled={running}
          className="text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
        >
          {running ? '⏳ Processing…' : '💸 Run Payout Now'}
        </button>
      </div>

      {/* Top journalists by pending earnings */}
      <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, var(--primary-light), var(--bg-surface))' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>✍️ Author Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--primary-light)' }}>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Author</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Total Earned</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Pending (50%)</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--primary-light)' }}>
              {journalistEarnings.map(j => (
                <tr key={j.user_id} className="transition-all duration-300" style={{ ['--hover-bg' as string]: 'var(--bg-inset)' }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{j.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>{formatCurrency(j.total)}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--warning)' }}>{formatCurrency(j.pending * 0.5)}</td>
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
        <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, var(--primary-light), var(--bg-surface))' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>📋 Payout History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--primary-light)' }}>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Author</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Period</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Total</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Their Cut</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Method</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Paid At</th>
                </tr>
              </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--primary-light)' }}>
                {payouts.map(p => (
                  <tr key={p.payout_id} className="transition-all duration-300">
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.journalist?.name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.journalist?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(p.amount))}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(Number(p.journalist_cut))}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-tertiary)' }}>{p.payment_method}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
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
