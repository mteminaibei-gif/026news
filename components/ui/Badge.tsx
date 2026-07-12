import { cn } from '@/lib/utils'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  published:   { background: 'var(--success-light)', color: 'var(--success)' },
  active:      { background: 'var(--success-light)', color: 'var(--success)' },
  approved:    { background: 'var(--success-light)', color: 'var(--success)' },
  pending:     { background: 'var(--warning-light)', color: 'var(--warning)' },
  review:      { background: 'var(--warning-light)', color: 'var(--warning)' },
  draft:       { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' },
  rejected:    { background: 'var(--error-light)', color: 'var(--error)' },
  failed:      { background: 'var(--error-light)', color: 'var(--error)' },
  inactive:    { background: 'var(--error-light)', color: 'var(--error)' },
  suspended:   { background: 'var(--error-light)', color: 'var(--error)' },
  featured:    { background: 'var(--accent-light)', color: 'var(--accent)' },
  trending:    { background: 'var(--accent-light)', color: 'var(--accent)' },
  breaking:    { background: 'var(--error-light)', color: 'var(--error)' },
}

const fallback: { background: string; color: string } = { background: 'var(--bg-muted)', color: 'var(--text-secondary)' }

export function Badge({ status, label, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? fallback
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={style}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
