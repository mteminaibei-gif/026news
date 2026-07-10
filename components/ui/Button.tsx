import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
}

const variants = {
  primary: 'bg-[#1a5c2a] hover:bg-[#13411f] text-white shadow-lg shadow-[#1a5c2a]/20',
  secondary: 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
}

const sizes = {
  xs: 'px-2 md:px-3 py-1.5 md:py-2 text-xs min-h-8 md:min-h-10',
  sm: 'px-3 md:px-4 py-2 md:py-2.5 text-sm min-h-10 md:min-h-11',
  md: 'px-4 md:px-6 py-2.5 md:py-3 text-base min-h-11 md:min-h-12',
  lg: 'px-6 md:px-8 py-3 md:py-4 text-lg min-h-12 md:min-h-14',
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
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}

export function ButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex gap-2', className)}>{children}</div>
}
