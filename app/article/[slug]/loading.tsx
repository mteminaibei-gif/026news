export default function ArticleLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar skeleton */}
      <div className="skeleton" style={{ height: 64, background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="skeleton" style={{ height: 36, width: 144, borderRadius: 8 }} />
          <div className="hidden lg:flex gap-2">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />)}
          </div>
          <div className="skeleton" style={{ height: 32, width: 96, borderRadius: 8 }} />
        </div>
      </div>

      {/* Reading progress bar placeholder */}
      <div className="skeleton" style={{ height: 4, width: '33.333%' }} />

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8 flex-1" style={{ flex: 1 }}>
        <main className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 16, width: 80, borderRadius: 6 }} />)}
          </div>

          {/* Header card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 24, width: 96, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 40, width: '100%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 32, width: '80%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 6 }} />
            <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 20, width: 96, borderRadius: 6 }} />)}
            </div>
          </div>

          {/* Featured image */}
          <div className="skeleton" style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 16 }} />

          {/* Content */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 16, width: `${75 + (i % 3) * 8}%`, borderRadius: 6 }} />
            ))}
          </div>
        </main>

        <aside className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 24, width: '75%', borderRadius: 6 }} />
              {[...Array(3)].map((_, j) => <div key={j} className="skeleton" style={{ height: 64, width: '100%', borderRadius: 8 }} />)}
            </div>
          ))}
        </aside>
      </div>

      {/* Footer stub */}
      <div className="skeleton" style={{ height: 80, marginTop: 32, background: 'var(--sidebar-bg)' }} />
    </div>
  )
}
