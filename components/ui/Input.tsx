'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export function Input({ label, error, fullWidth = true, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: focused ? 'var(--primary)' : 'var(--text-primary)',
            transition: 'color 0.2s ease',
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: fullWidth ? '100%' : 'auto',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-sm)',
          border: error
            ? '1px solid var(--error)'
            : focused
              ? '1px solid var(--primary)'
              : '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: error
            ? '0 0 0 3px oklch(65% 0.14 25 / 0.15)'
            : focused
              ? 'var(--glow-primary)'
              : 'none',
        }}
        onFocus={e => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        className={cn(className)}
        {...props}
      />
      {error && (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--error)',
            marginTop: '0.375rem',
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
