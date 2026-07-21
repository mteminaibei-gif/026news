'use client'

import { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.35rem',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
        {description && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-tertiary)',
            lineHeight: 1.5,
          }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
