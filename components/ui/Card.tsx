'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'filled'
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, variant = 'default', padding = 'md', className, style }: CardProps) {
  const paddingValue = padding === 'sm' ? '1rem' : padding === 'lg' ? '2rem' : '1.5rem'
  const variantStyle =
    variant === 'elevated'
      ? {
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }
      : variant === 'filled'
        ? {
            background: 'var(--bg-elevated)',
            border: 'none',
          }
        : {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        padding: paddingValue,
        ...variantStyle,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}
