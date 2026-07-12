import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'kenya' | 'gold'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(to right, var(--primary), var(--primary-hover))',
    color: '#fff',
  },
  kenya: {
    background: 'linear-gradient(to right, var(--primary), var(--primary-hover), var(--success))',
    color: '#fff',
  },
  gold: {
    background: 'linear-gradient(to right, var(--warning), #d4a010, #ca8a04)',
    color: 'var(--text-primary)',
    fontWeight: 700,
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--primary)',
    border: '2px solid var(--border-subtle)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--primary)',
  },
  danger: {
    background: 'linear-gradient(to right, var(--error), #a50d25, #991b1b)',
    color: '#fff',
  },
  success: {
    background: 'linear-gradient(to right, #16a34a, #15803d, #166534)',
    color: '#fff',
  },
}

const variantHoverStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(to right, var(--primary-hover), var(--success))',
  },
  kenya: {
    background: 'linear-gradient(to right, var(--primary-hover), var(--success), #65a30d)',
  },
  gold: {
    background: 'linear-gradient(to right, #d4a010, #ca8a04)',
  },
  secondary: {
    background: 'var(--bg-inset)',
    borderColor: 'var(--primary)',
  },
  ghost: {
    background: 'rgba(26, 92, 42, 0.15)',
    color: 'var(--primary-hover)',
  },
  danger: {
    background: 'linear-gradient(to right, #a50d25, #991b1b)',
  },
  success: {
    background: 'linear-gradient(to right, #15803d, #166534)',
  },
}

const sizes = {
  xs: 'px-3 md:px-4 py-1.5 md:py-2 text-xs min-h-8 md:min-h-9',
  sm: 'px-4 md:px-5 py-2 md:py-2.5 text-sm min-h-9 md:min-h-10',
  md: 'px-5 md:px-6 py-2.5 md:py-3 text-base min-h-10 md:min-h-11',
  lg: 'px-6 md:px-8 py-3 md:py-4 text-lg min-h-12 md:min-h-13',
  xl: 'px-8 md:px-10 py-4 md:py-5 text-xl min-h-14 md:min-h-16',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const mergedStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...(isHovered ? variantHoverStyles[variant] : {}),
    ...style,
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 overflow-hidden group',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'hover:-translate-y-0.5 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizes[size],
        className
      )}
      style={{
        ...mergedStyle,
        ['--tw-ring-color' as string]: 'rgba(26, 92, 42, 0.3)',
        ['--tw-ring-offset-color' as string]: 'var(--bg-surface)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {(variant === 'primary' || variant === 'kenya') && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
      )}
      
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      
      {isLoading ? loadingText : children}
    </button>
  )
}

export function ButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>
}
