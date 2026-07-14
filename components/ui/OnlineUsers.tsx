'use client'

import { useRealtime } from '@/components/providers/RealtimeProvider'

interface Props {
  compact?: boolean
  maxDisplay?: number
}

export function OnlineUsers({ compact = false, maxDisplay = 5 }: Props) {
  const { onlineUsers, connected } = useRealtime()

  // Filter out current user
  const others = onlineUsers.filter(u => u.user_id > 0)
  const count = others.length

  if (!connected) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: count > 0 ? '#22c55e' : 'var(--text-muted)' }}
        />
        {count > 0 ? `${count} online` : 'Connecting…'}
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: count > 0 ? '#22c55e' : 'var(--text-muted)' }}
        />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          {count > 0 ? `${count} Online Now` : 'Connecting…'}
        </span>
      </div>
      {count > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {others.slice(0, maxDisplay).map(u => (
            <div
              key={u.user_id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              {u.name || `User ${u.user_id}`}
            </div>
          ))}
          {count > maxDisplay && (
            <span className="px-2.5 py-1.5 rounded-lg text-xs" style={{ color: 'var(--text-tertiary)' }}>
              +{count - maxDisplay} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
