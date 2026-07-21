'use client'

interface OnlineIndicatorProps {
  online?: boolean
  size?: number
  className?: string
}

export function OnlineIndicator({ online = false, size = 12, className = '' }: OnlineIndicatorProps) {
  if (!online) return null

  return (
    <span
      className={`online-indicator ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--success)',
        border: '2px solid var(--bg-surface)',
        position: 'absolute',
        bottom: 0,
        right: 0,
        boxShadow: '0 0 6px var(--success)',
      }}
      aria-label="Online"
      title="Online"
    />
  )
}
