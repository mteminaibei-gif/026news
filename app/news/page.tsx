'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

import { formatNumber, stripHtml } from '@/lib/utils'
import { useCategories } from '@/lib/hooks/useCategories'
import { Clock, Eye, Bookmark, BookmarkCheck, Radio, Filter, Loader2, RefreshCw, ChevronDown } from 'lucide-react'

const REGION_FILTERS = ['All Regions', 'Kenya', 'East Africa', 'Africa', 'World'] as const
const SORT_OPTIONS = ['Most Recent', 'Most Popular'] as const

type NewsArticle = {
  article_id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  created_at: string
  tags: string[] | null
  source_name: string | null
  category_id: number | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'World Updates': '#475569',
  'Kenya Focus': '#006600',
  'Politics & Governance': '#e23b3b',
  'Business & Economy': '#d4a853',
  'Tech & Innovation': '#1a73e8',
  'Health & Wellness': '#059669',
  'Arts & Culture': '#db2777',
  'Sports Arena': '#34a853',
  'Opinion & Analysis': '#a21caf',
  'Trending Now': '#f59e0b',
  'Features & Profiles': '#6366f1',
  'Environment & Climate': '#0d9488',
}

const BREAKING = [
  'Parliament passes new digital economy bill after heated debate',
  'Nairobi Stock Exchange hits all-time high amid foreign investment surge',
  'Kenya signs trade deal with European Union worth KSh 50 billion',
  'President announces new affordable housing initiative for youth',
]

const PAGE_SIZE = 15

function getRegionPriority(article: NewsArticle): number {
  const catName = article.category?.name ?? ''
  const source = (article.source_name ?? '').toLowerCase()

  if (catName === 'Kenya Focus' || source.includes('kenya') || source.includes('nation') || source.includes('standard') || source.includes('citizen') || source.includes('kbc') || source.includes('capital') || source.includes('star')) return 0
  if (catName === 'East Africa' || source.includes('east africa') || source.includes('tanzania') || source.includes('uganda') || source.includes('rwanda')) return 1
  if (catName === 'Africa' || source.includes('africa')) return 2
  return 3
}

function sortByRegionPriority(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const pa = getRegionPriority(a)
    const pb = getRegionPriority(b)
    if (pa !== pb) return pa - pb
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeRegion, setActiveRegion] = useState<typeof REGION_FILTERS[number]>('All Regions')
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('Most Recent')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [newCount, setNewCount] = useState(0)
  const { categories } = useCategories()
  const [showFilters, setShowFilters] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const lastInteractionRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)
  const latestTimestampRef = useRef('')

  const buildApiParams = useCallback((reset: boolean, forPoll = false) => {
    const params = new URLSearchParams()
    if (!forPoll) {
      params.set('offset', String(reset ? 0 : offsetRef.current))
      params.set('limit', String(PAGE_SIZE))
    }
    params.set('sort', sortBy === 'Most Popular' ? 'trending' : 'latest')
    params.set('post_type', 'news')
    if (activeCategory !== 'All') params.set('category', activeCategory)
    if (activeRegion !== 'All Regions') params.set('region', activeRegion)
    if (forPoll && latestTimestampRef.current) params.set('after', latestTimestampRef.current)
    return params
  }, [activeCategory, activeRegion, sortBy])

  const fetchArticles = useCallback(async (reset = false) => {
    if (reset) {
      offsetRef.current = 0
      setArticles([])
      setHasMore(true)
    }

    const params = buildApiParams(reset, false)
    let res: Response
    try {
      res = await fetch(`/api/articles?${params}`)
    } catch { return }
    const data = await res.json()
    const fetched = (data.articles ?? []) as NewsArticle[]

    if (fetched.length < PAGE_SIZE) setHasMore(false)

    if (reset || offsetRef.current === 0) {
      setArticles(sortByRegionPriority(fetched))
      if (fetched.length > 0) {
        latestTimestampRef.current = fetched[0].created_at
      }
    } else {
      setArticles(prev => sortByRegionPriority([...prev, ...fetched]))
    }

    offsetRef.current += fetched.length
  }, [buildApiParams])

  useEffect(() => {
    setLoading(true)
    fetchArticles(true).finally(() => setLoading(false))
  }, [fetchArticles])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true)
          fetchArticles(false).finally(() => setLoadingMore(false))
        }
      },
      { rootMargin: '200px' }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => { observerRef.current?.disconnect() }
  }, [hasMore, loadingMore, loading, fetchArticles])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!latestTimestampRef.current) return
      const params = buildApiParams(false, true)
      params.set('limit', '20')
      try {
        const res = await fetch(`/api/articles?${params}`)
        const data = await res.json()
        const newArticles = (data.articles ?? []) as NewsArticle[]
        if (newArticles.length > 0) {
          setNewCount(prev => prev + newArticles.length)
          setArticles(prev => sortByRegionPriority([...newArticles, ...prev]))
          latestTimestampRef.current = newArticles[0].created_at
        }
      } catch { /* ignore */ }
    }, 30000)
    return () => clearInterval(interval)
  }, [buildApiParams])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const PX_PER_SEC = 48
    const RESUME_DELAY = 3500
    const END_PAUSE = 1400
    let raf = 0
    let last = performance.now()
    let endPauseUntil = 0

    const tick = (now: number) => {
      const dt = Math.min(now - last, 80)
      last = now
      const idle = now - lastInteractionRef.current > RESUME_DELAY
      if (el && !pausedRef.current && idle && el.scrollHeight > el.clientHeight + 4) {
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
        if (distanceFromBottom <= 80) {
          if (endPauseUntil === 0) endPauseUntil = now + END_PAUSE
          else if (now >= endPauseUntil) { el.scrollTop = 0; endPauseUntil = 0 }
        } else {
          el.scrollTop += (dt / 1000) * PX_PER_SEC
          endPauseUntil = 0
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const mark = () => { lastInteractionRef.current = performance.now() }
    const opts = { passive: true } as AddEventListenerOptions
    el.addEventListener('wheel', mark, opts)
    el.addEventListener('touchstart', mark, opts)
    el.addEventListener('touchmove', mark, opts)
    el.addEventListener('pointerdown', mark)
    el.addEventListener('keydown', mark)
    return () => {
      el.removeEventListener('wheel', mark)
      el.removeEventListener('touchstart', mark)
      el.removeEventListener('touchmove', mark)
      el.removeEventListener('pointerdown', mark)
      el.removeEventListener('keydown', mark)
    }
  }, [])

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const showNewPosts = () => {
    setNewCount(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const topStory = articles[0]
  const sideStories = articles.slice(1, 4)
  const remainingArticles = articles.slice(4)

  return (
    <div className="flex flex-col min-h-screen news-page">
      {/* Breaking News Ticker */}
      <div className="news-ticker-breaking" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <div style={{
            padding: '10px 18px', background: 'rgba(0,0,0,0.2)',
            fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0, backdropFilter: 'blur(4px)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#ff4444', boxShadow: '0 0 8px rgba(255,68,68,0.6)',
              animation: 'futr-pulse 1.5s ease-in-out infinite',
            }} />
            Breaking
          </div>
          <div
            ref={scrollRef}
            style={{
              flex: 1, overflow: 'hidden', whiteSpace: 'nowrap',
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            }}
          >
            {[...BREAKING, ...BREAKING].map((item, i) => (
              <span key={i} style={{
                display: 'inline-block', padding: '10px 24px',
                fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                {item}
                <span style={{ margin: '0 16px', opacity: 0.4 }}>&bull;</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', paddingInline: 'var(--space-md)', width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBlock: 'var(--space-xl)',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: 'var(--space-lg)',
        }}>
          <div>
            <h1 className="font-serif" style={{
              fontSize: '1.75rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              <Radio size={24} /> News
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Breaking stories and latest updates
            </p>
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 10, border: `1px solid ${showFilters ? 'oklch(65% 0.12 175 / 0.4)' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              background: showFilters ? 'var(--primary-light)' : 'var(--glass-bg)',
              backdropFilter: 'blur(var(--glass-blur))',
              color: showFilters ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.78rem', fontWeight: 600,
              transition: 'all 0.3s var(--ease-out-expo)',
              boxShadow: showFilters ? 'var(--glow-primary)' : 'none',
            }}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={12} style={{
              transition: 'transform 0.3s var(--ease-out-expo)',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0)',
            }} />
          </button>
        </div>

        {/* New posts notification */}
        {newCount > 0 && (
          <button
            onClick={showNewPosts}
            style={{
              width: '100%', padding: '10px 16px', marginBottom: 16,
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(var(--glass-blur))',
              border: '1px solid oklch(65% 0.12 175 / 0.3)',
              borderRadius: 10, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)',
              transition: 'all 0.3s var(--ease-out-expo)',
              animation: 'futr-fade-up 0.4s var(--ease-out-expo) both',
              boxShadow: 'var(--glow-primary)',
            }}
          >
            <RefreshCw size={14} />
            {newCount} new {newCount === 1 ? 'article' : 'articles'} — tap to see
          </button>
        )}

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="news-filter-panel">
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Category</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="font-semibold"
                  style={{
                    fontSize: '0.72rem', padding: '5px 12px', borderRadius: 9999,
                    border: '1px solid', cursor: 'pointer',
                    transition: 'all 0.25s var(--ease-out-expo)',
                    borderColor: activeCategory === 'All' ? 'transparent' : 'var(--glass-border)',
                    background: activeCategory === 'All' ? 'var(--grad-primary)' : 'var(--surface-2)',
                    color: activeCategory === 'All' ? '#fff' : 'var(--text-secondary)',
                    boxShadow: activeCategory === 'All' ? 'var(--glow-primary)' : 'none',
                    transform: activeCategory === 'All' ? 'translateY(-1px)' : 'none',
                  }}
                >All</button>
                {categories.map(cat => {
                  const color = CATEGORY_COLORS[cat.name] || 'var(--primary)'
                  const isActive = activeCategory === cat.name
                  return (
                    <button
                      key={cat.category_id}
                      onClick={() => setActiveCategory(cat.name)}
                      className="font-semibold"
                      style={{
                        fontSize: '0.72rem', padding: '5px 12px', borderRadius: 9999,
                        border: '1px solid', cursor: 'pointer',
                        transition: 'all 0.25s var(--ease-out-expo)',
                        borderColor: isActive ? color : 'var(--glass-border)',
                        background: isActive ? color : 'var(--surface-2)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        boxShadow: isActive ? `0 0 12px -4px ${color}` : 'none',
                        transform: isActive ? 'translateY(-1px)' : 'none',
                      }}
                    >{cat.name}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {REGION_FILTERS.map((region) => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    style={{
                      fontSize: '0.72rem', padding: '5px 12px', borderRadius: 8,
                      border: '1px solid', cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.25s var(--ease-out-expo)',
                      borderColor: activeRegion === region ? 'oklch(72% 0.16 55 / 0.4)' : 'var(--glass-border)',
                      background: activeRegion === region ? 'var(--accent-light)' : 'var(--surface-2)',
                      color: activeRegion === region ? 'var(--accent)' : 'var(--text-tertiary)',
                    }}
                  >{region}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    style={{
                      fontSize: '0.72rem', padding: '5px 12px', borderRadius: 8,
                      border: 'none', cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.2s var(--ease-out-expo)',
                      background: sortBy === opt ? 'var(--primary-light)' : 'transparent',
                      color: sortBy === opt ? 'var(--primary)' : 'var(--text-tertiary)',
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ paddingBlock: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto' }}>
              <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-lg)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />)}
              </div>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="news-empty">
            <Radio size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No news articles yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Check back soon for breaking stories.</p>
          </div>
        ) : (
          <>
            {/* Top Story Hero */}
            {topStory && (
              <Link
                href={`/article/${topStory.slug}`}
                className="news-hero"
                style={{
                  transition: 'all 0.4s var(--ease-out-expo)',
                  display: 'block',
                }}
              >
                {topStory.featured_image ? (
                  <img
                    src={topStory.featured_image}
                    alt=""
                    style={{ transition: 'transform 0.6s var(--ease-out-expo)' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ) : (
                  <div className="news-hero-fallback" />
                )}
                <div className="news-hero-overlay" />
                <div className="news-hero-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="news-hero-badge" style={{
                      background: CATEGORY_COLORS[topStory.category?.name ?? ''] || 'var(--primary)',
                    }}>
                      {topStory.category?.name ?? 'Breaking'}
                    </span>
                    <span style={{
                      fontSize: '0.72rem', opacity: 0.8,
                      background: 'rgba(255,255,255,0.12)', padding: '3px 10px',
                      borderRadius: 999, fontWeight: 600,
                    }}>Top Story</span>
                  </div>
                  <h2 className="news-hero-title">
                    {topStory.title}
                  </h2>
                  {topStory.excerpt && (
                    <p className="news-hero-excerpt">
                      {stripHtml(topStory.excerpt)}
                    </p>
                  )}
                  <div className="news-hero-meta">
                    <span style={{ fontWeight: 600 }}>{topStory.author?.name ?? '026connet!'}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /> {formatNumber(topStory.views ?? 0)}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {new Date(topStory.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Side Stories */}
            {sideStories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                {sideStories.map((a, i) => (
                  <Link
                    key={a.article_id}
                    href={`/article/${a.slug}`}
                    className="news-side-card"
                    style={{
                      animation: `futr-fade-up 0.5s var(--ease-out-expo) ${i * 100}ms both`,
                    }}
                  >
                    {a.featured_image ? (
                      <img
                        src={a.featured_image}
                        alt=""
                        style={{ transition: 'transform 0.4s var(--ease-out-expo)' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <div className="news-side-card-fallback" />
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)',
                        }}>
                          {a.category?.name ?? 'News'}
                        </span>
                        <h3 style={{
                          fontFamily: "'Newsreader', serif", fontSize: '0.9rem', fontWeight: 600,
                          lineHeight: 1.3, marginTop: 4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          color: 'var(--text-primary)',
                          transition: 'color 0.2s',
                        }}>
                          {a.title}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
                        <span>{a.author?.name ?? 'Staff'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {formatNumber(a.views ?? 0)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Divider */}
            {remainingArticles.length > 0 && (
              <>
                <div style={{
                  borderTop: '1px solid var(--glass-border)', marginBlock: 24,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: -1,
                    width: 40, height: 3, borderRadius: 3,
                    background: 'var(--grad-primary)', transform: 'translateX(-50%)',
                  }} />
                </div>
                <h2 style={{
                  fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 3, height: 20, borderRadius: 3,
                    background: 'var(--grad-primary)',
                  }} />
                  Latest News
                </h2>
              </>
            )}

            {/* Article list with infinite scroll */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
              {remainingArticles.map((a, i) => (
                <Link
                  key={a.article_id}
                  href={`/article/${a.slug}`}
                  className="news-list-card"
                  style={{
                    animation: `futr-fade-up 0.4s var(--ease-out-expo) ${Math.min(i * 60, 300)}ms both`,
                  }}
                >
                  {a.featured_image ? (
                    <img
                      src={a.featured_image}
                      alt=""
                      style={{ transition: 'transform 0.4s var(--ease-out-expo)' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ) : (
                    <div className="news-list-card-fallback" />
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <div>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)',
                      }}>
                        {a.category?.name ?? 'News'}
                      </span>
                      <h3 style={{
                        fontFamily: "'Newsreader', serif", fontSize: '0.95rem', fontWeight: 600,
                        lineHeight: 1.3, marginTop: 4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        color: 'var(--text-primary)',
                      }}>
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p style={{
                          fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {stripHtml(a.excerpt)}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{a.author?.name ?? 'Staff'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {formatNumber(a.views ?? 0)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleBookmark(a.article_id) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                      color: bookmarked.has(a.article_id) ? 'var(--primary)' : 'var(--text-tertiary)',
                      flexShrink: 0, alignSelf: 'center',
                      transition: 'all 0.25s var(--ease-out-expo)',
                      borderRadius: 10,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--primary-light)'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {bookmarked.has(a.article_id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </Link>
              ))}

              <div ref={loadMoreRef} style={{ height: 1 }} />

              {loadingMore && (
                <div style={{ textAlign: 'center', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Loading more news...</span>
                </div>
              )}

              {!hasMore && articles.length > 0 && (
                <div style={{
                  textAlign: 'center', padding: 24, fontSize: '0.82rem', color: 'var(--text-tertiary)',
                  background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--glass-border)',
                }}>
                  You&apos;ve reached the end
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
