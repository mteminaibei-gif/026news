import { useState } from 'react'

interface RealtimeFeedFetcherProps {
  initialArticlesCount?: number
}

export function RealtimeFeedFetcher({ initialArticlesCount = 0 }: RealtimeFeedFetcherProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    inserted: number
    skipped: number
    errors: number
    newArticles: number
    articlesBefore: number
    articlesAfter: number
    feeds: number
    results: Record<string, string>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/fetch-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to fetch feeds')
        return
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const displayCount = result?.articlesAfter ?? initialArticlesCount

  return (
    <div className="backdrop-blur-sm rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>📡 RSS Feed Fetcher</h3>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="text-xs font-bold text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Fetching...
            </>
          ) : (
            '⚡ Fetch Now'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'var(--primary-light)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{displayCount}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Articles</p>
            </div>
            <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'var(--warning-light)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>+{result.newArticles}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>New This Fetch</p>
            </div>
            <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'var(--primary-light)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{result.feeds}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active Feeds</p>
            </div>
          </div>
          
          {Object.keys(result.results).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Feed Results:</p>
              <div className="max-h-32 overflow-y-auto rounded-lg p-2 text-xs space-y-1" style={{ background: 'var(--border)' }}>
                {Object.entries(result.results).map(([feed, status]) => (
                  <div key={feed} className="flex justify-between">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{feed}</span>
                    <span className={status.includes('ERROR') ? 'text-red-500' : 'text-green-600'}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !error && (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Click &quot;Fetch Now&quot; to pull latest articles from RSS feeds. New articles will be added in real-time.
        </p>
      )}
    </div>
  )
}