'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatNumber } from '@/lib/utils'
import { autoCategorize, getCategoryName, type CategorizationResult } from '@/lib/auto-categorize'
import {
  Compass, TrendingUp, Loader2, Eye, Clock,
  ChevronRight, Sparkles, ArrowLeft, Tag, Search, X,
} from 'lucide-react'

interface CategoryItem {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  articleCount: number
}

interface ExploreArticle {
  article_id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  created_at: string
  tags: string[]
  source_name: string | null
  source_reference: string | null
  is_aggregated: boolean
  category_id: number | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
  autoCategory?: CategorizationResult
}

const CATEGORY_COLORS: Record<string, string> = {
  'World Updates': '#475569', 'Kenya Focus': '#006600', 'Politics & Governance': '#e23b3b',
  'Business & Economy': '#d4a853', 'Tech & Innovation': '#1a73e8', 'Health & Wellness': '#059669',
  'Arts & Culture': '#db2777', 'Sports Arena': '#34a853', 'Opinion & Analysis': '#a21caf',
  'Trending Now': '#f59e0b', 'Features & Profiles': '#6366f1', 'Environment & Climate': '#0d9488',
}

const CATEGORY_ICONS: Record<string, string> = {
  'World Updates': '🌐', 'Kenya Focus': '🇰🇪', 'Politics & Governance': '🏛️',
  'Business & Economy': '💼', 'Tech & Innovation': '💻', 'Health & Wellness': '🏥',
  'Arts & Culture': '🎭', 'Sports Arena': '⚽', 'Opinion & Analysis': '💭',
  'Trending Now': '🔥', 'Features & Profiles': '📰', 'Environment & Climate': '🌿',
}

const ICON_FALLBACK = '📂'
const COLOR_FALLBACK = '#6366f1'

export default function ExplorePage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [articles, setArticles] = useState<ExploreArticle[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<ExploreArticle[]>([])
  const [latestArticles, setLatestArticles] = useState<ExploreArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null)
  const [analyzing, setAnalyzing] = useState<Set<number>>(new Set())
  const [suggestions, setSuggestions] = useState<Record<number, CategorizationResult>>({})
  const [page, setPage] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExploreArticle[]>([])
  const [searching, setSearching] = useState(false)

  const loadExploreData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/explore')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
      if (data.featuredArticles) setFeaturedArticles(data.featuredArticles as ExploreArticle[])
      if (data.latestArticles) setLatestArticles(data.latestArticles as ExploreArticle[])
      if (data.totalArticles != null) setTotalArticles(data.totalArticles)
    } catch (err) {
      console.error('Failed to load explore data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCategoryArticles = useCallback(async (catId: number, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/explore?category_id=${catId}&page=${pageNum}&limit=20`)
      const data = await res.json()
      const fetchedArticles = (data.articles ?? []) as ExploreArticle[]

      // Auto-categorize any uncategorized articles
      const autoSuggestions: Record<number, CategorizationResult> = {}
      for (const article of fetchedArticles) {
        if (!article.category_id) {
          const result = autoCategorize({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            tags: article.tags,
            sourceName: article.source_name,
            sourceReference: article.source_reference,
          })
          autoSuggestions[article.article_id] = result
          // Auto-apply high-confidence suggestions
          if (result.confidence === 'high') {
            try {
              await fetch('/api/articles/categorize', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article_id: article.article_id, category_id: result.bestCategoryId }),
              })
              article.category_id = result.bestCategoryId
              article.category = { name: getCategoryName(result.bestCategoryId) }
              delete autoSuggestions[article.article_id]
            } catch { /* ignore - will show as suggestion */ }
          }
        }
      }

      if (pageNum === 1) {
        setArticles(fetchedArticles)
        setSuggestions(prev => ({ ...prev, ...autoSuggestions }))
      } else {
        setArticles(prev => [...prev, ...fetchedArticles])
        setSuggestions(prev => ({ ...prev, ...autoSuggestions }))
      }
      setHasMore(fetchedArticles.length === 20)
      setTotalArticles(data.total ?? 0)
    } catch (err) {
      console.error('Failed to load category articles:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExploreData() }, [loadExploreData])

  const selectCategory = (cat: CategoryItem) => {
    setActiveCategory(cat)
    setPage(1)
    setArticles([])
    setSuggestions({})
    loadCategoryArticles(cat.id, 1)
  }

  const backToAll = () => {
    setActiveCategory(null)
    setArticles([])
    setSuggestions({})
    setPage(1)
    loadExploreData()
  }

  const loadMore = () => {
    if (!activeCategory || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadCategoryArticles(activeCategory.id, nextPage)
  }

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/explore?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.articles ?? [])
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const classifyArticle = async (article: ExploreArticle) => {
    if (analyzing.has(article.article_id)) return
    setAnalyzing(prev => new Set([...prev, article.article_id]))
    try {
      const result = autoCategorize({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        tags: article.tags,
        sourceName: article.source_name,
        sourceReference: article.source_reference,
        currentCategoryId: article.category_id,
      })
      setSuggestions(prev => ({ ...prev, [article.article_id]: result }))
    } finally {
      setAnalyzing(prev => {
        const next = new Set(prev)
        next.delete(article.article_id)
        return next
      })
    }
  }

  const applyCategory = async (articleId: number, categoryId: number) => {
    try {
      const res = await fetch('/api/articles/categorize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, category_id: categoryId }),
      })
      if (res.ok) {
        setSuggestions(prev => {
          const next = { ...prev }
          delete next[articleId]
          return next
        })
        setArticles(prev => prev.map(a =>
          a.article_id === articleId
            ? { ...a, category_id: categoryId, category: { name: getCategoryName(categoryId) } }
            : a
        ))
      }
    } catch (err) {
      console.error('Failed to apply category:', err)
    }
  }

  const unmatchedArticles = articles.filter(a => {
    if (!a.category_id) return true
    const sug = suggestions[a.article_id]
    return sug && sug.bestCategoryId !== a.category_id
  })

  if (loading && categories.length === 0 && articles.length === 0 && latestArticles.length === 0 && searchResults.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>Loading explore page...</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '32px 0 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingInline: 24 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            {activeCategory ? (
              <button onClick={backToAll}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff' }}
                aria-label="Back to all categories"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Compass size={22} style={{ color: '#fff' }} />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {activeCategory ? activeCategory.name : searchQuery ? `Search: ${searchQuery}` : 'Explore'}
              </h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {activeCategory
                  ? `${activeCategory.articleCount} articles · ${activeCategory.description || ''}`
                  : searchQuery
                    ? `${searchResults.length} results`
                    : `${totalArticles} articles across ${categories.length} categories`}
              </p>
            </div>
          </div>

          {/* Search bar */}
          {!activeCategory && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim()) doSearch(e.target.value)
                  else setSearchResults([])
                }}
                className="w-full rounded-xl border-0 text-sm outline-none transition-all"
                style={{
                  padding: '10px 36px 10px 36px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px', width: '100%' }}>
        {!activeCategory && !searchQuery && (
          <>
            {featuredArticles.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  Featured by Category
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {featuredArticles.map(a => (
                    <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                      display: 'flex', gap: 12, padding: 12,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 14, textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                      {a.featured_image ? (
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-20 h-16 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                          <Tag size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {a.category?.name && (
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[a.category.name] || COLOR_FALLBACK }}>
                            {a.category.name}
                          </span>
                        )}
                        <h3 className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="flex items-center gap-0.5"><Eye size={9} /> {formatNumber(a.views)}</span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Latest News section - always shown */}
            {latestArticles.length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  Latest News
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {latestArticles.map(a => (
                    <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                      display: 'flex', gap: 12, padding: 12,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 14, textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                      {a.featured_image ? (
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-20 h-16 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                          <Tag size={16} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {a.category?.name && (
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[a.category.name] || COLOR_FALLBACK }}>
                            {a.category.name}
                          </span>
                        )}
                        <h3 className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="flex items-center gap-0.5"><Eye size={9} /> {formatNumber(a.views)}</span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Compass size={16} style={{ color: 'var(--primary)' }} />
                All Categories
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => selectCategory(cat)}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all cursor-pointer border-2"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{CATEGORY_ICONS[cat.name] || cat.icon || ICON_FALLBACK}</span>
                    <span className="text-sm font-bold text-center" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {cat.articleCount} article{cat.articleCount !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Search results */}
        {!activeCategory && searchQuery && (
          <section>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Search size={16} style={{ color: 'var(--primary)' }} />
              Search Results
            </h2>
            {searching ? (
              <div className="text-center py-16">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <Search size={40} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No articles found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Try a different search term.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map(a => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                    display: 'flex', gap: 16, padding: 16,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 14, textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s',
                  }}>
                    {a.featured_image ? (
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized sizes="96px" />
                      </div>
                    ) : (
                      <div className="w-24 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                        <Tag size={18} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[a.category?.name || ''] || COLOR_FALLBACK }}>
                          {a.category?.name || 'Uncategorized'}
                        </span>
                        {a.is_aggregated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>RSS</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {a.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(a.views)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, alignSelf: 'center' }} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeCategory && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {activeCategory.name} Articles
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-tertiary)' }}>({totalArticles})</span>
              </h2>
              {unmatchedArticles.length > 0 && (
                <span className="text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Sparkles size={12} /> {unmatchedArticles.length} suggestion{unmatchedArticles.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {(loading && articles.length === 0) ? (
              <div className="text-center py-16">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No articles yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Check back soon for {activeCategory.name} news.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {articles.map(article => {
                  const sug = suggestions[article.article_id]
                  const showAnalyze = !sug && !analyzing.has(article.article_id)
                  const mismatch = sug && article.category_id && sug.bestCategoryId !== article.category_id

                  return (
                    <div key={article.article_id}
                      className="rounded-xl transition-all"
                      style={{
                        background: 'var(--bg-surface)',
                        border: `1px solid ${mismatch ? 'var(--warning)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="flex gap-4 p-4">
                          {article.featured_image ? (
                            <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                              <Image src={article.featured_image} alt="" fill className="object-cover" unoptimized sizes="96px" />
                            </div>
                          ) : (
                            <div className="w-24 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                              <Tag size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[article.category?.name || ''] || COLOR_FALLBACK }}>
                                {article.category?.name || 'Uncategorized'}
                              </span>
                              {article.is_aggregated && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                                  RSS
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(article.views)}</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, alignSelf: 'center' }} />
                        </div>
                      </Link>

                      {article.category_id === null && (
                        <div className="px-4 pb-3">
                          {sug ? (
                            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 0 }}>
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                Suggested: <span className="font-bold" style={{ color: 'var(--primary)' }}>{getCategoryName(sug.bestCategoryId)}</span>
                                <span className="ml-1">({sug.confidence})</span>
                              </span>
                              <button onClick={() => applyCategory(article.article_id, sug.bestCategoryId)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md border-0 cursor-pointer"
                                style={{ background: 'var(--primary)', color: '#fff' }}>
                                Apply
                              </button>
                              {sug.scores.length > 1 && sug.scores.slice(1, 3).map(s => (
                                <button key={s.categoryId} onClick={() => applyCategory(article.article_id, s.categoryId)}
                                  className="text-[10px] px-2 py-0.5 rounded-md border cursor-pointer"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
                                  {getCategoryName(s.categoryId)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button onClick={() => classifyArticle(article)}
                              disabled={analyzing.has(article.article_id)}
                              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border-0 cursor-pointer"
                              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                              {analyzing.has(article.article_id) ? (
                                <><Loader2 size={10} className="animate-spin" /> Analyzing...</>
                              ) : (
                                <><Sparkles size={10} /> Auto-classify</>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {mismatch && (
                        <div className="px-4 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--warning)' }}>⚠</span> AI suggests{' '}
                              <span className="font-bold" style={{ color: 'var(--primary)' }}>{getCategoryName(sug.bestCategoryId)}</span>
                              {' '}(currently in {article.category?.name})
                            </span>
                            <button onClick={() => applyCategory(article.article_id, sug.bestCategoryId)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border-0 cursor-pointer"
                              style={{ background: 'var(--warning)', color: '#fff' }}>
                              Re-categorize
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-6">
                <button onClick={loadMore} disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm border-0 cursor-pointer transition-all"
                  style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Loading...' : `Load More (${articles.length} of ${totalArticles})`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
