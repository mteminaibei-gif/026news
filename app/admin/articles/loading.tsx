export default function AdminArticlesLoading() {
  return (
    <div className="flex-1" style={{ background: 'var(--bg-base)' }}>
      <div className="px-4 md:px-6 py-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="h-5 w-24 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} />
      </div>
      <div className="px-4 md:px-6 py-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="w-14 h-10 rounded-lg animate-pulse shrink-0 hidden sm:block" style={{ background: 'var(--bg-muted)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} />
            </div>
            <div className="w-20 h-6 rounded animate-pulse shrink-0" style={{ background: 'var(--bg-muted)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
