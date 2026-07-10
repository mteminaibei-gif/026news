import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'kenya' | 'gold'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
}

const variants = {
  primary: 'bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] hover:from-[#2d8a47] hover:to-[#4caf28] text-white shadow-lg shadow-[#1a5c2a]/25 hover:shadow-xl hover:shadow-[#1a5c2a]/35',
  kenya: 'bg-gradient-to-r from-[#1a5c2a] via-[#2d8a47] to-[#4caf28] hover:from-[#2d8a47] hover:via-[#4caf28] hover:to-[#65a30d] text-white shadow-lg shadow-[#1a5c2a]/30 hover:shadow-2xl hover:shadow-[#1a5c2a]/40',
  gold: 'bg-gradient-to-r from-[#f5c518] to-[#d4a010] hover:from-[#d4a010] hover:to-[#ca8a04] text-[#1a1a1a] font-bold shadow-lg shadow-[#f5c518]/30 hover:shadow-xl hover:shadow-[#f5c518]/40',
  secondary: 'bg-white dark:bg-[#162319] hover:bg-[#f9fafb] dark:hover:bg-[#1a2e1e] text-[#1a5c2a] dark:text-[#4caf28] border-2 border-[#e8f5ea] dark:border-[#223d29] hover:border-[#1a5c2a] dark:hover:border-[#4caf28] shadow-sm hover:shadow-md',
  ghost: 'bg-transparent hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/15 text-[#1a5c2a] dark:text-[#4caf28] hover:text-[#2d8a47] dark:hover:text-[#65a30d]',
  danger: 'bg-gradient-to-r from-[#c8102e] to-[#a50d25] hover:from-[#a50d25] hover:to-[#991b1b] text-white shadow-lg shadow-[#c8102e]/25 hover:shadow-xl hover:shadow-[#c8102e]/35',
  success: 'bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:from-[#15803d] hover:to-[#166534] text-white shadow-lg shadow-[#16a34a]/25 hover:shadow-xl hover:shadow-[#16a34a]/35',
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
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 overflow-hidden group',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'hover:-translate-y-0.5 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 dark:focus:ring-[#4caf28]/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0f1410]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Kenya flag inspired shimmer effect for primary/kenya variants */}
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
