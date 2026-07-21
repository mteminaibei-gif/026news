'use client'

import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  style,
}: ButtonProps) {
  const padding =
    size === 'sm'
      ? '0.5rem 1rem'
      : size === 'lg'
        ? '0.875rem 1.5rem'
        : '0.625rem 1.25rem'

  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.875rem'

  const variantStyle =
    variant === 'primary'
      ? {
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 2px 8px rgba(29, 155, 240, 0.3)',
        }
      : variant === 'secondary'
        ? {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }
        : variant === 'danger'
          ? {
              background: 'var(--error)',
              color: '#fff',
              border: 'none',
            }
          : {
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '0.5rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s',
        opacity: disabled || loading ? 0.6 : 1,
        ...variantStyle,
        ...style,
      }}
      className={className}
    >
      {loading ? '...' : children}
    </button>
  )
}
