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
          padding: '1rem 0.85rem',
          gap: '1rem',
          borderRadius: '14px',
          transition: 'background 0.2s var(--ease-out-expo)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: description ? '0.2rem' : 0,
            letterSpacing: '-0.01em',
          }}>
            {label}
          </p>
          {description && (
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              {description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          {value && (
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                minWidth: 150,
                textAlign: 'right',
                fontWeight: 500,
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
            background: 'var(--glass-border)',
            margin: '0 0.85rem',
          }}
        />
      )}
    </>
  )
}
