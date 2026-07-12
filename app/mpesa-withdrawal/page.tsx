'use client'

import { useState } from 'react'

const TRANSACTIONS = [
  { id: 1, status: 'Completed', date: '2024-04-20', txnId: 'MPX-29384751', method: 'M-Pesa', amount: 150.00 },
  { id: 2, status: 'Processing', date: '2024-04-19', txnId: 'MPX-29384802', method: 'M-Pesa', amount: 75.00 },
  { id: 3, status: 'Completed', date: '2024-04-18', txnId: 'MPX-29384903', method: 'M-Pesa', amount: 200.00 },
  { id: 4, status: 'Pending', date: '2024-04-17', txnId: 'MPX-29385014', method: 'M-Pesa', amount: 50.00 },
  { id: 5, status: 'Completed', date: '2024-04-15', txnId: 'MPX-29385125', method: 'M-Pesa', amount: 320.00 },
]

export default function MpesaWithdrawalPage() {
  const [amount, setAmount] = useState('')
  const balance = 5000.00
  const fee = 2.50
  const minAmount = 5.00

  const statusStyle = (status: string) => {
    if (status === 'Completed') return { bg: 'var(--success-light)', color: 'var(--success)' }
    if (status === 'Processing') return { bg: 'var(--primary-light)', color: 'var(--primary)' }
    return { bg: 'var(--warning-light)', color: 'var(--warning)' }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px 60px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--primary-light)', marginBottom: 12,
        }}>
          <span style={{ fontSize: '1.8rem' }}>📱</span>
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif", textAlign: 'center', marginBottom: 24,
      }}>
        M-Pesa Withdrawal
      </h1>

      {/* Card */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16,
        padding: 32, marginBottom: 32,
      }}>
        {/* Earnings display */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Earnings Available
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>
            Amount
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)',
            }}>$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={minAmount}
              style={{
                width: '100%', padding: '14px 14px 14px 32px', borderRadius: 10,
                border: '2px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600,
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>

        {/* Quick amount buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Min ($5.00)', value: '5.00' },
            { label: 'Half', value: (balance / 2).toFixed(2) },
            { label: 'All', value: balance.toFixed(2) },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => setAmount(btn.value)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontWeight: 600,
                fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Fee line */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '12px 0',
          borderTop: '1px solid var(--border-subtle)', marginBottom: 20,
        }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Withdrawal Fee</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ${fee.toFixed(2)}
          </span>
        </div>

        {/* Withdraw button */}
        <button
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--primary)', color: '#fff', fontWeight: 700,
            fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: '0 4px 12px oklch(45% 0.12 175 / 0.3)',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-hover)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--primary)' }}
        >
          Proceed to Withdrawal
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 style={{
          fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif", marginBottom: 16,
        }}>
          Recent Transactions
        </h2>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
          overflow: 'hidden',
        }}>
          {TRANSACTIONS.map((txn, i) => {
            const sc = statusStyle(txn.status)
            return (
              <div key={txn.id} style={{
                padding: '16px 20px',
                borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-inset)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--primary-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                  }}>
                    📱
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {txn.method}
                      </span>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                        fontSize: '0.7rem', fontWeight: 600, background: sc.bg, color: sc.color,
                      }}>
                        {txn.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                      <span>{txn.date}</span>
                      <span>•</span>
                      <span>{txn.txnId}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  -${txn.amount.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
