'use client'

import { ReactNode, useState } from 'react'

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
  const [hovered, setHovered] = useState(false)

  const padding = size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.5rem'
  const valueSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '2.5rem' : '2rem'
  const labelSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.875rem'
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28
  const accentColor = accent ? `var(--${accent})` : color

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 'var(--radius-md)',
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        borderColor: hovered ? `oklch(from ${accentColor} l c h / 0.15)` : 'var(--glass-border)',
        ...(hovered
          ? {
              transform: 'translateY(-3px)',
              boxShadow: `0 0 0 1px oklch(from ${accentColor} l c h / 0.12), 0 12px 40px -12px oklch(from ${accentColor} l c h / 0.2)`,
            }
          : {
              boxShadow: 'var(--glow-soft)',
            }),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: labelSize, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        {icon && (
          <div
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: 'var(--radius-xs)',
              background: `linear-gradient(135deg, oklch(from ${accentColor} l c h / 0.15), oklch(from ${accentColor} l c h / 0.08))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              transition: 'transform 0.2s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: valueSize, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</span>
          {change && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-xl)',
                ...(change.direction === 'up'
                  ? { color: 'var(--success)', background: 'oklch(65% 0.12 145 / 0.1)' }
                  : change.direction === 'down'
                    ? { color: 'var(--error)', background: 'oklch(65% 0.14 25 / 0.1)' }
                    : { color: 'var(--text-tertiary)', background: 'var(--bg-muted)' }),
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
