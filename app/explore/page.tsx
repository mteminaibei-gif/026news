'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Logo } from '@/components/layout/Logo'
import { formatNumber } from '@/lib/utils'
import { autoCategorize, getCategoryName, type CategorizationResult } from '@/lib/auto-categorize'
import {
  TrendingUp, Loader2, Eye, Clock,
  ChevronRight, Sparkles, ArrowLeft, Tag, Search, X, Bell,
  Moon, Sun, Flame, UserPlus, Star,
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

interface AuthorItem {
  user_id: number
  name: string
  profile_image: string | null
  bio: string | null
  followers: number
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
const RECENT_SEARCHES_KEY = 'explore_recent_searches'

const TRENDING_TAGS = ['Elections', 'Tech', 'Markets', 'Football', 'Climate', 'Health', 'Startups', 'Politics', 'AI', 'Culture']

export default function ExplorePage() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [articles, setArticles] = useState<ExploreArticle[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<ExploreArticle[]>([])
  const [latestArticles, setLatestArticles] = useState<ExploreArticle[]>([])
  const [authors, setAuthors] = useState<AuthorItem[]>([])
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchWrapRef = useRef<HTMLDivElement>(null)

  const loadExploreData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/explore')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
      if (data.featuredArticles) setFeaturedArticles(data.featuredArticles as ExploreArticle[])
      if (data.latestArticles) setLatestArticles(data.latestArticles as ExploreArticle[])
      if (data.totalArticles != null) setTotalArticles(data.totalArticles)
      if (data.authors) setAuthors(data.authors as AuthorItem[])
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
            } catch { /* ignore */ }
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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

  const pushRecentSearch = (q: string) => {
    const clean = q.trim()
    if (!clean) return
    setRecentSearches(prev => {
      const next = [clean, ...prev.filter(s => s !== clean)].slice(0, 8)
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
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

  const runSearch = (q: string) => {
    const term = q.trim()
    if (!term) return
    pushRecentSearch(term)
    setSearchQuery(term)
    setShowSuggestions(false)
    doSearch(term)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const clearRecent = () => {
    setRecentSearches([])
    try { localStorage.removeItem(RECENT_SEARCHES_KEY) } catch { /* ignore */ }
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

  const editorsPicks = featuredArticles.slice(0, 6)
  const featuredHero = editorsPicks[0]
  const featuredStack = editorsPicks.slice(1)

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
      {/* Top nav: logo + theme toggle + bell */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--error)' }} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Search hero */}
        <section className="pt-8 pb-6">
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Explore
          </h1>
          <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Discover articles by category, topic, and trending discussions.
          </p>

          <div ref={searchWrapRef} className="relative">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search articles, topics, authors..."
                value={searchQuery}
                onFocus={() => !searchQuery && setShowSuggestions(true)}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim()) { doSearch(e.target.value); setShowSuggestions(false) }
                  else { setSearchResults([]); setShowSuggestions(true) }
                }}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(searchQuery) }}
                className="w-full rounded-2xl border text-sm outline-none transition-all"
                style={{
                  padding: '14px 44px 14px 44px',
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showSuggestions && !searchQuery && (
              <div
                className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl z-30"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
              >
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recent Searches</span>
                      <button onClick={clearRecent} className="text-xs border-0 bg-transparent cursor-pointer" style={{ color: 'var(--text-tertiary)' }}>Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => runSearch(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Trending Tags</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TRENDING_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => runSearch(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid transparent', cursor: 'pointer' }}
                      >
                        <Flame size={11} /> {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {!activeCategory && !searchQuery && (
          <>
            {/* Category carousel */}
            {categories.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Tag size={16} style={{ color: 'var(--primary)' }} />
                  Browse Categories
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat)}
                      className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all cursor-pointer flex-shrink-0 w-32"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                    >
                      <span style={{ fontSize: '1.9rem' }}>{CATEGORY_ICONS[cat.name] || cat.icon || ICON_FALLBACK}</span>
                      <span className="text-xs font-bold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{cat.articleCount} articles</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Editor's Picks */}
            {editorsPicks.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Star size={16} style={{ color: 'var(--accent)' }} />
                  Editor&apos;s Picks
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {featuredHero && (
                    <Link href={`/article/${featuredHero.slug}`} className="lg:col-span-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div
                        className="relative rounded-2xl overflow-hidden flex items-end min-h-[320px]"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
                      >
                        {featuredHero.featured_image ? (
                          <Image src={featuredHero.featured_image} alt="" fill className="object-cover" unoptimized priority sizes="(max-width: 1024px) 100vw, 66vw" />
                        ) : null}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.1))' }} />
                        <div className="relative p-5">
                          {featuredHero.category?.name && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-2 inline-block" style={{ background: CATEGORY_COLORS[featuredHero.category.name] || COLOR_FALLBACK, color: '#fff' }}>
                              {featuredHero.category.name}
                            </span>
                          )}
                          <h3 className="text-xl font-bold leading-tight text-white group-hover:underline">{featuredHero.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/70">
                            <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(featuredHero.views)}</span>
                            <span>{new Date(featuredHero.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  <div className="flex flex-col gap-3">
                    {featuredStack.map(a => (
                      <Link key={a.article_id} href={`/article/${a.slug}`} className="flex gap-3 p-3 rounded-xl transition-all group" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'inherit' }}>
                        {a.featured_image ? (
                          <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized sizes="80px" loading="lazy" />
                          </div>
                        ) : (
                          <div className="w-20 h-16 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                            <Tag size={16} style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {a.category?.name && (
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[a.category.name] || COLOR_FALLBACK }}>{a.category.name}</span>
                          )}
                          <h4 className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2 group-hover:underline" style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-0.5"><Eye size={9} /> {formatNumber(a.views)}</span>
                            <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Trending Topics grid */}
            {latestArticles.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  Trending Topics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestArticles.map(a => (
                    <Link key={a.article_id} href={`/article/${a.slug}`} className="group" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="rounded-2xl overflow-hidden transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        {a.featured_image ? (
                          <div className="relative w-full h-40">
                            <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized sizes="(max-width: 1024px) 100vw, 33vw" loading="lazy" />
                          </div>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
                            <Tag size={28} style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                        )}
                        <div className="p-4">
                          {a.category?.name && (
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[a.category.name] || COLOR_FALLBACK }}>{a.category.name}</span>
                          )}
                          <h3 className="text-sm font-semibold leading-snug mt-1 line-clamp-2 group-hover:underline" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(a.views)}</span>
                            <span className="flex items-center gap-1"><Clock size={11} /> {new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Authors to Follow carousel */}
            {authors.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <UserPlus size={16} style={{ color: 'var(--primary)' }} />
                  Authors to Follow
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {authors.map(author => (
                    <Link key={author.user_id} href={`/journalists/${author.user_id}`} className="flex-shrink-0 w-44 p-4 rounded-2xl flex flex-col items-center text-center transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'inherit' }}>
                      {author.profile_image ? (
                        <Image src={author.profile_image} alt={author.name} width={56} height={56} className="rounded-full object-cover mb-2" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold mb-2" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>{author.name.charAt(0)}</div>
                      )}
                      <span className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{author.name}</span>
                      <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatNumber(author.followers)} followers</span>
                      <span className="mt-2 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>+ Follow</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Search results */}
        {!activeCategory && searchQuery && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={backToAll} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Search size={16} style={{ color: 'var(--primary)' }} />
                Results for &quot;{searchQuery}&quot;
              </h2>
            </div>
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
                        <Image src={a.featured_image} alt="" fill className="object-cover" unoptimized sizes="96px" loading="lazy" />
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
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
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
            <div className="flex items-center gap-3 mb-4">
              <button onClick={backToAll} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ fontSize: '1.3rem' }}>{CATEGORY_ICONS[activeCategory.name] || activeCategory.icon || ICON_FALLBACK}</span>
                  {activeCategory.name}
                  <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>({totalArticles})</span>
                </h2>
                {activeCategory.description && (
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{activeCategory.description}</p>
                )}
              </div>
              {unmatchedArticles.length > 0 && (
                <span className="text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-full ml-auto" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
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
                    <div key={article.article_id} className="rounded-xl transition-all" style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${mismatch ? 'var(--warning)' : 'var(--border-subtle)'}`,
                    }}>
                      <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="flex gap-4 p-4">
                          {article.featured_image ? (
                            <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                              <Image src={article.featured_image} alt="" fill className="object-cover" unoptimized sizes="96px" loading="lazy" />
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
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>RSS</span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                Suggested: <span className="font-bold" style={{ color: 'var(--primary)' }}>{getCategoryName(sug.bestCategoryId)}</span>
                                <span className="ml-1">({sug.confidence})</span>
                              </span>
                              <button onClick={() => applyCategory(article.article_id, sug.bestCategoryId)} className="text-[10px] font-bold px-2 py-0.5 rounded-md border-0 cursor-pointer" style={{ background: 'var(--primary)', color: '#fff' }}>
                                Apply
                              </button>
                              {sug.scores.length > 1 && sug.scores.slice(1, 3).map(s => (
                                <button key={s.categoryId} onClick={() => applyCategory(article.article_id, s.categoryId)} className="text-[10px] px-2 py-0.5 rounded-md border cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
                                  {getCategoryName(s.categoryId)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button onClick={() => classifyArticle(article)} disabled={analyzing.has(article.article_id)} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border-0 cursor-pointer" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                              {analyzing.has(article.article_id) ? (<><Loader2 size={10} className="animate-spin" /> Analyzing...</>) : (<><Sparkles size={10} /> Auto-classify</>)}
                            </button>
                          )}
                        </div>
                      )}

                      {mismatch && (
                        <div className="px-4 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--warning)' }}>⚠</span> AI suggests{' '}
                              <span className="font-bold" style={{ color: 'var(--primary)' }}>{getCategoryName(sug!.bestCategoryId)}</span>
                              {' '}(currently in {article.category?.name})
                            </span>
                            <button onClick={() => applyCategory(article.article_id, sug!.bestCategoryId)} className="text-[10px] font-bold px-2 py-0.5 rounded-md border-0 cursor-pointer" style={{ background: 'var(--warning)', color: '#fff' }}>
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
                <button onClick={loadMore} disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold text-sm border-0 cursor-pointer transition-all" style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.6 : 1 }}>
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