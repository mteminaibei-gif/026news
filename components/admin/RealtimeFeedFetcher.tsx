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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-[#e8f5ea] p-5 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#1a5c2a]">📡 RSS Feed Fetcher</h3>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="text-xs font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <div className="flex-1 bg-[#f0faf2] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1a5c2a]">{displayCount}</p>
              <p className="text-xs text-gray-500">Total Articles</p>
            </div>
            <div className="flex-1 bg-[#fff8e1] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#f5c518]">+{result.newArticles}</p>
              <p className="text-xs text-gray-500">New This Fetch</p>
            </div>
            <div className="flex-1 bg-[#f0faf2] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1a5c2a]">{result.feeds}</p>
              <p className="text-xs text-gray-500">Active Feeds</p>
            </div>
          </div>
          
          {Object.keys(result.results).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Feed Results:</p>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2 text-xs space-y-1">
                {Object.entries(result.results).map(([feed, status]) => (
                  <div key={feed} className="flex justify-between">
                    <span className="font-medium text-gray-700">{feed}</span>
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
        <p className="text-sm text-gray-500">
          Click &quot;Fetch Now&quot; to pull latest articles from RSS feeds. New articles will be added in real-time.
        </p>
      )}
    </div>
  )
}