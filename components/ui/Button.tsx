'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' },
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--grad-primary)',
      color: '#fff',
      border: 'none',
      boxShadow: 'var(--glow-primary)',
    },
    secondary: {
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
      color: 'var(--text-primary)',
      border: '1px solid var(--glass-border)',
    },
    danger: {
      background: 'linear-gradient(135deg, var(--error), oklch(55% 0.16 15))',
      color: '#fff',
      border: 'none',
      boxShadow: '0 2px 12px rgba(244, 33, 46, 0.25)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid transparent',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn('group', className)}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        fontWeight: 600,
        fontFamily: 'inherit',
        width: fullWidth ? '100%' : 'auto',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
          e.currentTarget.style.filter = 'brightness(1.08)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.filter = 'brightness(1)'
      }}
      onMouseDown={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }
      }}
      onMouseUp={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
          e.currentTarget.style.filter = 'brightness(1.08)'
        }
      }}
      onFocus={e => {
        e.currentTarget.style.boxShadow =
          variant === 'primary'
            ? 'var(--glow-primary), 0 0 0 3px oklch(65% 0.12 175 / 0.3)'
            : '0 0 0 3px oklch(65% 0.12 175 / 0.2)'
      }}
      onBlur={e => {
        e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow as string ?? 'none'
      }}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        >
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <path
            d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
