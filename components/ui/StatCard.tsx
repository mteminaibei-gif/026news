'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  sub?: string
  accent?: string
  change?: {
    value: number | string
    direction: 'up' | 'down' | 'neutral'
    period?: string
  }
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatCard({ label, value, icon, sub, accent, change, color = 'var(--primary)', size = 'md' }: StatCardProps) {
  const padding = size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.5rem'
  const valueSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '2.5rem' : '2rem'
  const labelSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.875rem'
  const accentColor = accent ? `var(--${accent})` : color

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: labelSize, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        {icon && (
          <div
            style={{
              width: size === 'sm' ? 24 : size === 'lg' ? 32 : 28,
              height: size === 'sm' ? 24 : size === 'lg' ? 32 : 28,
              borderRadius: '0.5rem',
              background: `${accentColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: valueSize, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
          {change && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color:
                  change.direction === 'up'
                    ? 'var(--success)'
                    : change.direction === 'down'
                      ? 'var(--error)'
                      : 'var(--text-tertiary)',
              }}
            >
              {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '—'} {change.value}
              {change.period && ` ${change.period}`}
            </span>
          )}
        </div>
        {sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sub}</span>}
      </div>
    </div>
  )
}
