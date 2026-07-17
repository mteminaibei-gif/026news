'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: number) => {
    timersRef.current.delete(id)
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => remove(id), 4000)
    timersRef.current.set(id, timer)
  }, [remove])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />,
    error: <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />,
    info: <Info size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />,
  }
  const bg = {
    success: 'var(--bg-elevated, #fff)',
    error: 'var(--bg-elevated, #fff)',
    info: 'var(--bg-elevated, #fff)',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        background: bg[toast.type],
        border: '1px solid var(--border, #e5e7eb)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxWidth: 420,
        animation: 'toast-slide-in 0.25s ease-out',
        color: 'var(--text-primary, #111)',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {icons[toast.type]}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary, #9ca3af)', display: 'flex' }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
