import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number | React.ReactNode
  sub?: string
  accent?: 'blue' | 'orange' | 'green' | 'red' | 'gold' | 'purple' | 'cyan'
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

const accentGradients: Record<string, string> = {
  blue: 'from-blue-50 to-blue-100 border-l-4 border-blue-500',
  orange: 'from-orange-50 to-orange-100 border-l-4 border-orange-500',
  green: 'from-green-50 to-emerald-100 border-l-4 border-emerald-600',
  red: 'from-red-50 to-rose-100 border-l-4 border-rose-600',
  gold: 'from-amber-50 to-yellow-100 border-l-4 border-amber-500',
  purple: 'from-purple-50 to-violet-100 border-l-4 border-violet-600',
  cyan: 'from-cyan-50 to-blue-100 border-l-4 border-cyan-500',
}

const accentText: Record<string, string> = {
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  green: 'text-emerald-700',
  red: 'text-rose-700',
  gold: 'text-amber-700',
  purple: 'text-violet-700',
  cyan: 'text-cyan-700',
}

const sparkColors: Record<string, string> = {
  blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
  orange: 'bg-gradient-to-r from-orange-400 to-orange-600',
  green: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  red: 'bg-gradient-to-r from-rose-400 to-rose-600',
  gold: 'bg-gradient-to-r from-amber-400 to-amber-600',
  purple: 'bg-gradient-to-r from-violet-400 to-violet-600',
  cyan: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
}

// Animated sparkline
const Sparkline = ({ color = 'bg-gradient-to-r from-blue-400 to-blue-600' }: { color?: string }) => (
  <div className="flex items-end gap-1 h-12 mt-3">
    {[40, 55, 45, 70, 60, 80, 75, 90, 100].map((h, i) => (
      <div
        key={i}
        className={cn('flex-1 rounded-full transition-all duration-500 hover:scale-110 cursor-pointer', 
          i === 8 ? color : 'bg-gray-200'
        )}
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
)

export function StatCard({ label, value, sub, accent = 'blue', icon, className }: StatCardProps) {
  const gradientClass = accentGradients[accent]
  const textClass = accentText[accent]
  const sparkColor = sparkColors[accent]

  return (
    <div className={cn(
      'bg-gradient-to-br rounded-3xl shadow-lg border border-white backdrop-blur-sm p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 group',
      gradientClass,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-xs font-bold uppercase tracking-wider mb-2 opacity-70', textClass)}>{label}</p>
          <p className={cn('text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r', textClass.replace('text-', 'from-').replace('-700', ' to-black/80'))}>
            {value}
          </p>
          {sub && <p className="text-sm text-gray-600 mt-2 font-medium">{sub}</p>}
        </div>
        {icon && <div className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">{icon}</div>}
      </div>
      <Sparkline color={sparkColor} />
    </div>
  )
}
