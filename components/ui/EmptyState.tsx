'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, oklch(65% 0.12 175 / 0.12), oklch(65% 0.12 175 / 0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            color: 'var(--primary)',
            fontSize: '2rem',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-tertiary)',
            marginBottom: '1.5rem',
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--grad-primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--glow-primary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
            e.currentTarget.style.filter = 'brightness(1.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.filter = 'brightness(1)'
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
            e.currentTarget.style.filter = 'brightness(0.95)'
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
            e.currentTarget.style.filter = 'brightness(1.08)'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
