'use client'

import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  description?: string
  error?: string
  children: ReactNode
  required?: boolean
}

export function FormField({ label, description, error, children, required = false }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
          {required && <span style={{ color: 'var(--error)', marginLeft: '0.25rem' }}>*</span>}
        </span>
      </label>

      {description && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{description}</p>
      )}

      {children}

      {error && <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  )
}
