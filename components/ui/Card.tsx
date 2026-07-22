'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'filled'
  padding?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, variant = 'default', padding = 'md', className, style }: CardProps) {
  const [hovered, setHovered] = useState(false)

  const paddingValue = padding === 'sm' ? '1rem' : padding === 'lg' ? '2rem' : '1.5rem'

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    padding: paddingValue,
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--glass-border)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style,
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {},
    elevated: {
      boxShadow: 'var(--glow-soft)',
    },
    filled: {
      background: 'var(--glass-bg-strong)',
      backdropFilter: 'blur(calc(var(--glass-blur) + 6px)) saturate(150%)',
      WebkitBackdropFilter: 'blur(calc(var(--glass-blur) + 6px)) saturate(150%)',
    },
  }

  return (
    <div
      className={cn(className)}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        transform: hovered ? 'translateY(-2px)' : undefined,
        boxShadow: hovered ? 'var(--glow-primary)' : variantStyles[variant]?.boxShadow as string | undefined,
        borderColor: hovered ? 'oklch(65% 0.12 175 / 0.15)' : baseStyle.borderColor,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}
