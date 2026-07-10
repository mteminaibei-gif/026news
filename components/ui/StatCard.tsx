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

// Kenya flag color themed accent gradients
const accentGradients: Record<string, string> = {
  kenya: 'from-[#1a5c2a] to-[#2d5a31] border-l-4 border-[#4caf28]',
  blue: 'from-blue-50 to-blue-100 border-l-4 border-blue-500',
  orange: 'from-orange-50 to-orange-100 border-l-4 border-orange-500',
  green: 'from-green-50 to-emerald-100 border-l-4 border-emerald-600',
  red: 'from-red-50 to-rose-100 border-l-4 border-rose-600',
  gold: 'from-amber-50 to-yellow-100 border-l-4 border-amber-500',
  purple: 'from-purple-50 to-violet-100 border-l-4 border-violet-600',
  cyan: 'from-cyan-50 to-blue-100 border-l-4 border-cyan-500',
}

// Text colors matching the accents
const accentText: Record<string, string> = {
  kenya: 'text-white',
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  green: 'text-emerald-700',
  red: 'text-rose-700',
  gold: 'text-amber-700',
  purple: 'text-violet-700',
  cyan: 'text-cyan-700',
}

// Sparkline colors matching accents
const sparkColors: Record<string, string> = {
  kenya: 'bg-gradient-to-r from-[#4caf28] to-[#f5c518]',
  blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
  orange: 'bg-gradient-to-r from-orange-400 to-orange-600',
  green: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  red: 'bg-gradient-to-r from-rose-400 to-rose-600',
  gold: 'bg-gradient-to-r from-amber-400 to-amber-600',
  purple: 'bg-gradient-to-r from-violet-400 to-violet-600',
  cyan: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
}

// Animated sparkline with Kenya colors when accent is kenya
const Sparkline = ({ color = 'bg-gradient-to-r from-blue-400 to-blue-600' }: { color?: string }) => (
  <div className="flex items-end gap-1 h-12 mt-3">
    {[40, 55, 45, 70, 60, 80, 75, 90, 100].map((h, i) => (
      <div
        key={i}
        className={cn('flex-1 rounded-full transition-all duration-500 hover:scale-110 cursor-pointer', 
          i === 8 ? color : 'bg-white/30'
        )}
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
)

export function StatCard({ label, value, sub, accent = 'kenya', icon, trend, trendUp, className }: StatCardProps) {
  const gradientClass = accentGradients[accent]
  const textClass = accentText[accent]
  const sparkColor = sparkColors[accent]
  const isKenya = accent === 'kenya'

  return (
    <div className={cn(
      'bg-gradient-to-br rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02] group relative overflow-hidden',
      gradientClass,
      className
    )}>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      
      {/* Kenya flag accent for kenya theme */}
      {isKenya && (
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className="absolute inset-0 bg-gradient-to-bl from-[#c8102e]/20 via-[#1a1a1a]/10 to-transparent rounded-br-2xl" />
        </div>
      )}
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className={cn('text-xs font-bold uppercase tracking-wider mb-2 opacity-80', textClass)}>{label}</p>
          <p className={cn(
            'text-4xl font-black',
            isKenya ? 'text-white drop-shadow-md' : 'bg-clip-text text-transparent bg-gradient-to-r'
          )}>
            {value}
          </p>
          {sub && <p className={cn('text-sm mt-2 font-medium opacity-80', isKenya ? 'text-white/80' : 'text-gray-600')}>{sub}</p>}
        </div>
        {icon && <div className={cn('text-4xl transition-all duration-500 group-hover:scale-110 group-hover:opacity-90', isKenya ? 'text-white/20' : 'opacity-25')}>{icon}</div>}
      </div>
      
      {/* Sparkline */}
      <div className="relative z-10">
        <Sparkline color={sparkColor} />
      </div>
      
      {/* Trend indicator */}
      {trend && (
        <div className={cn('flex items-center gap-1.5 mt-3 text-xs font-semibold', isKenya ? 'text-[#f5c518]' : trendUp ? 'text-green-600' : 'text-red-600')}>
          <span className="text-sm">{trendUp ? '↑' : '↓'}</span>
          {trend}
        </div>
      )}
    </div>
  )
}
