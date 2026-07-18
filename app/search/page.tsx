'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { formatNumber, formatDate, stripHtml } from '@/lib/utils'
import { Search as SearchIcon, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

type Art = {
  article_id: number
  title: string
  slug: string
  content: string
  excerpt?: string | null
  featured_image?: string | null
  views: number
  created_at: string
  author?: { name: string } | null
  category?: { name: string } | null
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(true)

  const [categories, setCategories] = useState<{ category_id: number; name: string }[]>([])
  const [articles, setArticles] = useState<Art[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('026-recent-searches')
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/categories').then(r => (r.ok ? r.json() : [])),
      fetch('/api/articles?status=published&limit=200&sort=recent').then(r =>
        r.ok ? r.json() : { articles: [] },
      ),
    ])
      .then(([cats, arts]) => {
        if (!active) return
        setCategories(Array.isArray(cats) ? cats : [])
        setArticles(arts?.articles ?? [])
        setLoading(false)
      })
      .catch(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const q = query.trim().toLowerCase()

  const matched = useMemo(() => {
    let list = articles
    if (q) {
      list = list.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          (a.content || '').toLowerCase().includes(q) ||
          (a.category?.name || '').toLowerCase().includes(q),
      )
    }
    if (activeCategory !== 'all') {
      list = list.filter(a => a.category?.name === activeCategory)
    }
    return list
  }, [articles, q, activeCategory])

  const sorted = useMemo(() => {
    const arr = [...matched]
    if (sortBy === 'views') arr.sort((a, b) => b.views - a.views)
    else arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return arr
  }, [matched, sortBy])

  // Group by category when browsing all categories (search results + no-query browse).
  const groups = useMemo(() => {
    if (activeCategory !== 'all') return null
    const map = new Map<string, Art[]>()
    for (const a of sorted) {
      const name = a.category?.name ?? 'Uncategorized'
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(a)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [sorted, activeCategory])

  const trending = useMemo(
    () => [...articles].sort((a, b) => b.views - a.views).slice(0, 6),
    [articles],
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setQuery(trimmed)
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 8)
    setRecentSearches(updated)
    localStorage.setItem('026-recent-searches', JSON.stringify(updated))
  }

  function clearRecent() {
    setRecentSearches([])
    localStorage.removeItem('026-recent-searches')
  }

  function removeRecent(term: string) {
    const updated = recentSearches.filter(s => s !== term)
    setRecentSearches(updated)
    localStorage.setItem('026-recent-searches', JSON.stringify(updated))
  }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
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
        <form onSubmit={handleSearch} className="mb-6">
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

        {/* Category filter chips */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeCategory === 'all' ? 'var(--primary)' : 'var(--bg-surface)',
              color: activeCategory === 'all' ? 'var(--bg-elevated)' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === 'all' ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.category_id}
              onClick={() => setActiveCategory(c.name)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeCategory === c.name ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeCategory === c.name ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === c.name ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading articles…</p>
          </div>
        ) : query ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Results for &ldquo;<span style={{ color: 'var(--primary)' }}>{query}</span>&rdquo;
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortBy('recent')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: sortBy === 'recent' ? 'var(--bg-inset)' : 'transparent', color: sortBy === 'recent' ? 'var(--primary)' : 'var(--text-tertiary)' }}
                >
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('views')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: sortBy === 'views' ? 'var(--bg-inset)' : 'transparent', color: sortBy === 'views' ? 'var(--primary)' : 'var(--text-tertiary)' }}
                >
                  Most viewed
                </button>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No results found</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Try a different keyword or browse by category above.
                </p>
              </div>
            ) : (
              // Grouped by category when browsing all; flat when a category is selected.
              groups ? (
                <div className="flex flex-col gap-8">
                  {groups.map(([cat, items]) => (
                    <div key={cat}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{cat}</h3>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{items.length}</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                      </div>
                      <div className="flex flex-col gap-3">
                        {items.map(a => <ResultRow key={a.article_id} a={a} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sorted.map(a => <ResultRow key={a.article_id} a={a} />)}
                </div>
              )
            )}
          </section>
        ) : (
          <>
            {/* Trending */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Trending</h2>
                <button
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => setSortBy(s => (s === 'views' ? 'recent' : 'views'))}
                >
                  <RefreshCw size={14} />
                  {sortBy === 'views' ? 'By recent' : 'Refresh'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map(t => (
                  <Link
                    key={t.article_id}
                    href={`/article/${t.slug}`}
                    className="rounded-xl overflow-hidden text-left transition-all duration-300 group"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'inherit' }}
                  >
                    <div className="relative h-32 overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
                      {t.featured_image ? (
                        <Image src={t.featured_image} alt={t.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"  loading="lazy"/>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                          <span className="text-2xl font-black tracking-widest uppercase" style={{ color: 'var(--primary)', opacity: 0.15 }}>026</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent)' }}>{t.category?.name ?? 'News'}</p>
                      <h3 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{t.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="mb-12 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setShowRecent(!showRecent)}
                  className="w-full flex items-center justify-between px-6 py-4 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <h2 className="text-base font-bold">Recent Searches</h2>
                  <div className="flex items-center gap-3">
                    <span onClick={e => { e.stopPropagation(); clearRecent() }} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Clear all</span>
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
                        <span onClick={e => { e.stopPropagation(); removeRecent(term) }} className="ml-0.5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>×</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function ResultRow({ a }: { a: Art }) {
  return (
    <Link
      href={`/article/${a.slug}`}
      className="flex gap-4 rounded-xl p-4 transition-all duration-200 group"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'inherit', textDecoration: 'none' }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-hover-shadow)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-inset)' }}>
        {a.featured_image ? (
          <Image src={a.featured_image} alt={a.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="112px"  loading="lazy"/>
        ) : (
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>026</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>{a.category?.name}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(a.created_at)}</span>
        </div>
        <h3 className="font-bold leading-snug mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{stripHtml(a.excerpt || a.content).replace(/\n+/g, ' ').slice(0, 120)}…</p>
        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{a.author?.name ?? 'Staff Writer'}</span>
          <span>·</span>
          <span>{formatNumber(a.views)} views</span>
        </div>
      </div>
    </Link>
  )
}
