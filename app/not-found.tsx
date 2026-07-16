import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* 404 number */}
          <h1
            className="select-none animate-float"
            style={{
              fontSize: 'clamp(6rem, 15vw, 10rem)',
              fontWeight: 700,
              lineHeight: 1,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'var(--space-lg)',
            }}
          >
            404
          </h1>

          {/* Title */}
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            Page Not Found
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2xl)',
              maxWidth: '28rem',
              marginInline: 'auto',
              lineHeight: 1.7,
            }}
          >
            The article or page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 justify-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-bold text-sm"
              style={{
                background: 'var(--primary)',
                color: 'var(--bg-elevated)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                transition: 'filter 0.2s',
              }}
            >
              Go Home
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-semibold text-sm"
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              Search
            </Link>
          </div>

          {/* Search input */}
          <form
            action="/search"
            method="GET"
            className="flex gap-3"
            style={{ maxWidth: '32rem', marginInline: 'auto' }}
          >
            <input
              type="search"
              name="q"
              placeholder="Search articles..."
              className="flex-1"
              style={{
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="font-bold text-sm"
              style={{
                background: 'var(--primary)',
                color: 'var(--bg-elevated)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                transition: 'filter 0.2s',
              }}
            >
              Search
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
