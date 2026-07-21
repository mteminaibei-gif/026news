'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export function Input({ label, error, fullWidth = true, className, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: fullWidth ? '100%' : 'auto',
          padding: '0.625rem 0.875rem',
          borderRadius: '0.5rem',
          border: error ? '1px solid var(--error)' : '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'all 0.2s',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--primary)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-light)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        className={className}
        {...props}
      />
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  )
}
