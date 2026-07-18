'use client'

export default function AdminArticlesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--bg-base)', minHeight: 300 }}>
      <div className="text-center max-w-sm">
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Failed to load articles. Please try again.</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'var(--primary)' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
