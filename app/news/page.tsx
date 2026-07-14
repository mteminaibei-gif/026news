'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { Clock, MessageCircle, Eye, Bookmark, BookmarkCheck, ChevronRight, Radio, TrendingUp, Filter } from 'lucide-react'

const CATEGORY_FILTERS = ['All', 'Kenya', 'Politics', 'Business', 'Tech', 'Sports', 'Health', 'Africa']
const REGION_FILTERS = ['All Regions', 'Kenya', 'East Africa', 'Africa', 'World'] as const
const SORT_OPTIONS = ['Most Recent', 'Most Popular', 'Most Discussed'] as const

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
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'var(--kenya-red, #e23b3b)',
  Business: 'var(--accent, #d4a853)',
  Tech: 'var(--primary, #1a73e8)',
  Sports: 'var(--success, #34a853)',
  Science: 'var(--warning, #fbbc04)',
  Health: 'var(--success, #34a853)',
  Kenya: 'var(--kenya-green, #006600)',
  Africa: 'var(--accent, #d4a853)',
}

const BREAKING = [
  'Parliament passes new digital economy bill after heated debate',
  'Nairobi Stock Exchange hits all-time high amid foreign investment surge',
  'Kenya signs trade deal with European Union worth KSh 50 billion',
  'President announces new affordable housing initiative for youth',
]

export default function NewsPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeRegion, setActiveRegion] = useState<typeof REGION_FILTERS[number]>('All Regions')
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('Most Recent')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())

  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const lastInteractionRef = useRef(0)

  // Fetch news articles from Supabase
  useEffect(() => {
    const supabase = createClient()
    let active = true

    ;(async () => {
      let query = supabase
        .from('articles')
        .select('article_id, slug, title, excerpt, content, featured_image, views, created_at, tags, source_name, author:users(name, profile_image), category:categories(name)')
        .eq('status', 'published')
        .eq('post_type', 'news')

      if (activeCategory !== 'All') {
        query = query.eq('category.name', activeCategory)
      }

      // Region filtering
      if (activeRegion !== 'All Regions') {
        const regionMap: Record<string, string> = {
          'Kenya': 'KE',
          'East Africa': 'EA',
          'Africa': 'AF',
          'World': 'INTL',
        }
        const code = regionMap[activeRegion]
        if (code) {
          query = query.contains('regions', [code])
        }
      }

      if (sortBy === 'Most Popular') {
        query = query.order('views', { ascending: false })
      } else if (sortBy === 'Most Discussed') {
        query = query.order('views', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      query = query.limit(30)

      const { data } = await query
      if (active) {
        setArticles((data as unknown as NewsArticle[]) ?? [])
        setLoading(false)
      }
    })()

    return () => { active = false }
  }, [activeCategory, activeRegion, sortBy])

  // Auto-scroll ticker
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
          if (endPauseUntil === 0) {
            endPauseUntil = now + END_PAUSE
          } else if (now >= endPauseUntil) {
            el.scrollTop = 0
            endPauseUntil = 0
          }
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

  const topStory = articles[0]
  const sideStories = articles.slice(1, 4)
  const remainingArticles = articles.slice(4)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      {/* Breaking News Ticker */}
      <div style={{ background: 'var(--primary)', color: 'oklch(98% 0.005 175)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <div style={{
            padding: '8px 16px', background: 'rgba(0,0,0,0.2)',
            fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0,
          }}>
            <Radio size={12} /> Breaking
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
                display: 'inline-block', padding: '8px 24px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 'var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radio size={24} style={{ color: 'var(--primary)' }} /> News
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Breaking stories and latest updates</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="font-semibold"
                style={{
                  fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '9999px',
                  border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--border)',
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: activeCategory === cat ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Region + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {REGION_FILTERS.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                style={{
                  fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6,
                  border: '1px solid', cursor: 'pointer', fontWeight: 600,
                  borderColor: activeRegion === region ? 'var(--accent)' : 'var(--border-subtle)',
                  background: activeRegion === region ? 'var(--accent-light)' : 'transparent',
                  color: activeRegion === region ? 'var(--accent)' : 'var(--text-tertiary)',
                }}
              >
                {region}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                style={{
                  fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6,
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: sortBy === opt ? 'var(--primary-light)' : 'transparent',
                  color: sortBy === opt ? 'var(--primary)' : 'var(--text-tertiary)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ paddingBlock: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading news...</div>
        ) : articles.length === 0 ? (
          <div style={{ paddingBlock: 'var(--space-3xl)', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
            <Radio size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No news articles yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Check back soon for breaking stories.</p>
          </div>
        ) : (
          <>
            {/* Top Story Hero */}
            {topStory && (
              <Link href={`/article/${topStory.slug}`} style={{
                display: 'block', borderRadius: 16, overflow: 'hidden',
                position: 'relative', height: 420, marginBottom: 24,
                textDecoration: 'none', color: 'inherit',
              }}>
                {topStory.featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topStory.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, oklch(45% 0.12 175), oklch(45% 0.12 220))' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(10% 0.02 175 / 0.9) 0%, oklch(10% 0.02 175 / 0.15) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, color: 'oklch(96% 0.005 175)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 4,
                      background: CATEGORY_COLORS[topStory.category?.name ?? ''] || 'var(--primary)',
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {topStory.category?.name ?? 'Breaking'}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Top Story</span>
                  </div>
                  <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 600, lineHeight: 1.25, marginBottom: 12, textWrap: 'balance' as const }}>
                    {topStory.title}
                  </h2>
                  {topStory.excerpt && (
                    <p style={{ fontSize: '0.88rem', opacity: 0.85, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {topStory.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem', opacity: 0.8 }}>
                    <span>{topStory.author?.name ?? '026Newsblog'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /> {formatNumber(topStory.views ?? 0)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {new Date(topStory.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Side Stories */}
            {sideStories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                {sideStories.map((a) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                    display: 'flex', gap: 14, padding: 16,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 12, textDecoration: 'none', color: 'inherit',
                    transition: 'all 0.2s',
                  }}>
                    {a.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.featured_image} alt="" style={{ width: 80, height: 80, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 9, background: 'var(--bg-inset)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                          {a.category?.name ?? 'News'}
                        </span>
                        <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                          {a.title}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
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
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginBlock: 24 }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Latest News</h2>
              </>
            )}

            {/* Article list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
              {remainingArticles.map((a) => (
                <Link key={a.article_id} href={`/article/${a.slug}`} style={{
                  display: 'flex', gap: 16, padding: 16,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 12, textDecoration: 'none', color: 'inherit',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}>
                  {a.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.featured_image} alt="" style={{ width: 120, height: 90, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 120, height: 90, borderRadius: 9, background: 'var(--bg-inset)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                        {a.category?.name ?? 'News'}
                      </span>
                      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-primary)' }}>
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {a.excerpt}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      <span>{a.author?.name ?? 'Staff'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {formatNumber(a.views ?? 0)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> {new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleBookmark(a.article_id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: bookmarked.has(a.article_id) ? 'var(--primary)' : 'var(--text-tertiary)', flexShrink: 0, alignSelf: 'center' }}
                  >
                    {bookmarked.has(a.article_id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
