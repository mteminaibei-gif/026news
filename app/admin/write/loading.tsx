export default function AdminWriteLoading() {
  return (
    <div className="flex-1 p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-5 w-32 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} />
        <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
        <div className="h-24 w-full rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
        <div className="h-64 w-full rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
        <div className="flex gap-3">
          <div className="h-9 w-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-9 w-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
        </div>
      </div>
    </div>
  )
}
