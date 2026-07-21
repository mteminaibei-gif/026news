import { cn } from '@/lib/utils'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  published: { background: 'oklch(65% 0.12 145 / 0.12)', color: 'var(--success)', border: '1px solid oklch(65% 0.12 145 / 0.2)' },
  active:    { background: 'oklch(65% 0.12 145 / 0.12)', color: 'var(--success)', border: '1px solid oklch(65% 0.12 145 / 0.2)' },
  approved:  { background: 'oklch(65% 0.12 145 / 0.12)', color: 'var(--success)', border: '1px solid oklch(65% 0.12 145 / 0.2)' },
  pending:   { background: 'oklch(72% 0.13 80 / 0.12)',  color: 'var(--warning)', border: '1px solid oklch(72% 0.13 80 / 0.2)' },
  review:    { background: 'oklch(72% 0.13 80 / 0.12)',  color: 'var(--warning)', border: '1px solid oklch(72% 0.13 80 / 0.2)' },
  draft:     { background: 'var(--bg-muted)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' },
  rejected:  { background: 'oklch(65% 0.14 25 / 0.12)',  color: 'var(--error)',   border: '1px solid oklch(65% 0.14 25 / 0.2)' },
  failed:    { background: 'oklch(65% 0.14 25 / 0.12)',  color: 'var(--error)',   border: '1px solid oklch(65% 0.14 25 / 0.2)' },
  inactive:  { background: 'oklch(65% 0.14 25 / 0.12)',  color: 'var(--error)',   border: '1px solid oklch(65% 0.14 25 / 0.2)' },
  suspended: { background: 'oklch(65% 0.14 25 / 0.12)',  color: 'var(--error)',   border: '1px solid oklch(65% 0.14 25 / 0.2)' },
  featured:  { background: 'oklch(72% 0.16 55 / 0.12)',  color: 'var(--accent)',  border: '1px solid oklch(72% 0.16 55 / 0.2)' },
  trending:  { background: 'oklch(72% 0.16 55 / 0.12)',  color: 'var(--accent)',  border: '1px solid oklch(72% 0.16 55 / 0.2)' },
  breaking:  { background: 'oklch(65% 0.14 25 / 0.12)',  color: 'var(--error)',   border: '1px solid oklch(65% 0.14 25 / 0.2)' },
}

const fallback: React.CSSProperties = {
  background: 'var(--bg-muted)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
}

export function Badge({ status, label, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? fallback
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-semibold', className)}
      style={{
        ...style,
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
