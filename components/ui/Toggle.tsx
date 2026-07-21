'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const isDimensions = size === 'sm' ? { width: 40, height: 24, dot: 18 } : { width: 52, height: 32, dot: 26 }

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: isDimensions.width,
        height: isDimensions.height,
        borderRadius: isDimensions.height,
        border: 'none',
        background: checked ? 'var(--primary)' : 'var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled}
    >
      <div
        style={{
          position: 'absolute',
          width: isDimensions.dot,
          height: isDimensions.dot,
          borderRadius: '50%',
          background: '#fff',
          top: size === 'sm' ? 3 : 4,
          left: checked ? isDimensions.width - isDimensions.dot - (size === 'sm' ? 3 : 4) : size === 'sm' ? 3 : 4,
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}
