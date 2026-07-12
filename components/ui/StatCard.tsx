import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number | React.ReactNode
  sub?: string
  accent?: 'blue' | 'orange' | 'green' | 'red' | 'gold' | 'purple' | 'cyan' | 'kenya'
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

const accentStyles: Record<string, { iconBg: string; iconColor: string; border: string; iconBgStyle?: React.CSSProperties; borderStyle?: React.CSSProperties }> = {
  kenya: { iconBg: '', iconColor: 'text-white', border: 'border-l-4', iconBgStyle: { backgroundColor: 'var(--primary)' }, borderStyle: { borderLeftColor: 'var(--primary)' } },
  green: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', border: 'border-l-4 border-emerald-500' },
  gold: { iconBg: 'bg-amber-100', iconColor: 'text-amber-700', border: 'border-l-4 border-amber-500' },
  blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-700', border: 'border-l-4 border-blue-500' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-700', border: 'border-l-4 border-red-500' },
  orange: { iconBg: 'bg-orange-100', iconColor: 'text-orange-700', border: 'border-l-4 border-orange-500' },
  purple: { iconBg: 'bg-violet-100', iconColor: 'text-violet-700', border: 'border-l-4 border-violet-500' },
  cyan: { iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700', border: 'border-l-4 border-cyan-500' },
}

export function StatCard({ label, value, sub, accent = 'kenya', icon, trend, trendUp, className }: StatCardProps) {
  const style = accentStyles[accent] || accentStyles.kenya

  return (
    <div
      className={cn(
        'rounded-xl shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        style.border,
        className
      )}
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', ...(style.borderStyle || {}) }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
        </div>
        {icon && (
          <div
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', style.iconColor)}
            style={style.iconBgStyle || {}}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-red-600')}>
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}
