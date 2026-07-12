'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MOCK_ARTICLES } from '@/lib/mock-data'
import { formatNumber, formatDate } from '@/lib/utils'
import { Search as SearchIcon, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const TRENDING_TOPICS = [
  { title: 'Climate Summit', category: 'Science', image: 'https://picsum.photos/id/1015/400/250' },
  { title: 'AI Regulation', category: 'Tech', image: 'https://picsum.photos/id/106/400/250' },
  { title: 'Market Rally', category: 'Business', image: 'https://picsum.photos/id/20/400/250' },
  { title: 'Election Results', category: 'Politics', image: 'https://picsum.photos/id/342/400/250' },
  { title: 'Space Discovery', category: 'Science', image: 'https://picsum.photos/id/180/400/250' },
  { title: 'Startup Funding', category: 'Business', image: 'https://picsum.photos/id/0/400/250' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(['Kenya politics', 'Solar energy', 'Tech startups'])
  const [showRecent, setShowRecent] = useState(true)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return MOCK_ARTICLES.filter(
      a => a.status === 'published' && (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category?.name.toLowerCase().includes(q)
      )
    )
  }, [query])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 8)
      return next
    })
  }

  function clearRecent() {
    setRecentSearches([])
  }

  function removeRecent(term: string) {
    setRecentSearches(prev => prev.filter(s => s !== term))
  }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main className="max-w-[800px] mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--text-primary)' }}
            >
              <span style={{ color: 'var(--primary)' }}>026</span>News
            </h1>
          </Link>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-12">
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: query ? '0 0 0 3px var(--primary-light)' : 'var(--card-shadow)',
              borderColor: query ? 'var(--primary)' : undefined,
            }}
          >
            <SearchIcon size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search news, topics, journalists..."
              className="flex-1 text-base outline-none border-none bg-transparent p-0"
              style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(''); setQuery('') }}
                className="text-sm font-medium px-3 py-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'var(--bg-inset)' }}
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="text-sm font-bold px-5 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results */}
        {query && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Results for &ldquo;<span style={{ color: 'var(--primary)' }}>{query}</span>&rdquo;
              </h2>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {results.length} article{results.length !== 1 ? 's' : ''}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No results found</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Try a different keyword or browse trending topics below.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map(article => (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    className="flex gap-4 rounded-xl p-4 transition-all duration-200 group"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'inherit',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-hover-shadow)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <div
                      className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                      style={{ background: 'var(--bg-inset)' }}
                    >
                      {article.featured_image ? (
                        <Image
                          src={article.featured_image}
                          alt={article.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="112px"
                        />
                      ) : (
                        <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                          026
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                          {article.category?.name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(article.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold leading-snug mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {article.title}
                      </h3>
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {article.content.substring(0, 120)}...
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{article.author?.name ?? 'Staff Writer'}</span>
                        <span>·</span>
                        <span>{formatNumber(article.views)} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Trending Section */}
        {!query && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Trending</h2>
              <button
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRENDING_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => { setInputValue(topic.title); setQuery(topic.title) }}
                  className="rounded-xl overflow-hidden text-left transition-all duration-300 group"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'inherit',
                  }}
                >
                  <div className="relative h-32 overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
                    <Image
                      src={topic.image}
                      alt={topic.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent)' }}>
                      {topic.category}
                    </p>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {topic.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !query && (
          <section className="mb-12 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="w-full flex items-center justify-between px-6 py-4 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              <h2 className="text-base font-bold">Recent Searches</h2>
              <div className="flex items-center gap-3">
                <span
                  onClick={e => { e.stopPropagation(); clearRecent() }}
                  className="text-xs font-medium"
                  style={{ color: 'var(--primary)' }}
                >
                  Clear all
                </span>
                {showRecent ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
              </div>
            </button>
            {showRecent && (
              <div className="px-6 pb-4 flex flex-wrap gap-2">
                {recentSearches.map(term => (
                  <button
                    key={term}
                    onClick={() => { setInputValue(term); setQuery(term) }}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                  >
                    <SearchIcon size={12} style={{ color: 'var(--text-muted)' }} />
                    {term}
                    <span
                      onClick={e => { e.stopPropagation(); removeRecent(term) }}
                      className="ml-0.5 text-xs font-bold"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
