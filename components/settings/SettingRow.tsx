'use client'

import { ReactNode } from 'react'

interface SettingRowProps {
  label: string
  description?: string
  value?: string
  action?: ReactNode
  divider?: boolean
}

export function SettingRow({ label, description, value, action, divider = true }: SettingRowProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 0',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {label}
          </p>
          {description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {value && (
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                minWidth: 150,
                textAlign: 'right',
              }}
            >
              {value}
            </span>
          )}
          {action}
        </div>
      </div>

      {divider && (
        <div
          style={{
            height: '1px',
            background: 'var(--border)',
            margin: '0',
          }}
        />
      )}
    </>
  )
}
