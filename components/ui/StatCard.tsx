import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'blue' | 'orange' | 'green' | 'red'
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

const accentBorder: Record<string, string> = {
  blue: 'border-l-4 border-blue-600',
  orange: 'border-l-4 border-orange-500',
  green: 'border-l-4 border-emerald-500',
  red: 'border-l-4 border-red-500',
}

// Simple CSS sparkline
const Sparkline = ({ color = 'bg-blue-600' }: { color?: string }) => (
  <div className="flex items-end gap-0.5 h-8 mt-2">
    {[40, 55, 45, 70, 60, 80, 75, 90, 100].map((h, i) => (
      <div
        key={i}
        className={cn('flex-1 rounded-sm', i === 8 ? color : 'bg-gray-100')}
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
)

export function StatCard({ label, value, sub, accent = 'blue', icon, className }: StatCardProps) {
  const sparkColors: Record<string, string> = {
    blue: 'bg-blue-600', orange: 'bg-orange-500', green: 'bg-emerald-500', red: 'bg-red-500',
  }
  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-5', accentBorder[accent], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      <Sparkline color={sparkColors[accent]} />
    </div>
  )
}
