'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const dims = size === 'sm'
    ? { width: 40, height: 24, dot: 18, translate: 19 }
    : { width: 52, height: 30, dot: 24, translate: 24 }

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: dims.height,
        border: checked ? 'none' : '1px solid var(--glass-border)',
        background: checked
          ? 'var(--grad-primary)'
          : 'var(--glass-bg)',
        backdropFilter: checked ? undefined : 'blur(8px)',
        WebkitBackdropFilter: checked ? undefined : 'blur(8px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        boxShadow: checked ? '0 2px 10px oklch(65% 0.12 175 / 0.3)' : 'none',
        flexShrink: 0,
      }}
      disabled={disabled}
    >
      <div
        style={{
          position: 'absolute',
          width: dims.dot,
          height: dims.dot,
          borderRadius: '50%',
          background: '#fff',
          top: checked ? (size === 'sm' ? 3 : 3) : (size === 'sm' ? 2.5 : 2.5),
          left: checked ? dims.translate : (size === 'sm' ? 3 : 3),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}
