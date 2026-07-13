'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MOCK_ARTICLES } from '@/lib/mock-data'
import { useUser } from '@/lib/hooks/useAuth'

const CATEGORY_FILTERS = ['All', 'Kenya', 'Politics', 'Business', 'Tech', 'Sports', 'Health', 'Africa']
const SORT_OPTIONS = ['Most Recent', 'Most Popular', 'Most Discussed']

const NEWS_FEED = MOCK_ARTICLES.filter(a => a.status === 'published').map((a, i) => ({
  ...a,
  thumbnail: a.featured_image || `https://picsum.photos/id/${10 + i}/400/250`,
  category: a.category?.name ?? 'General',
  excerpt: a.content.slice(0, 140).replace(/\n/g, ' ') + '...',
  authorName: a.author?.name ?? 'Staff',
  authorAvatar: a.author?.profile_image ?? `https://i.pravatar.cc/40?img=${i}`,
  timeAgo: `${(i + 1) * 3}h ago`,
  commentsCount: a.comments?.length ?? Math.floor(Math.random() * 30),
}))

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'var(--kenya-red)',
  Business: 'var(--accent)',
  Tech: 'var(--primary)',
  Sports: 'var(--success)',
  Science: 'var(--warning)',
  Health: 'var(--success)',
  Kenya: 'var(--kenya-green)',
  Africa: 'var(--accent)',
}

const BREAKING = [
  'Parliament passes new digital economy bill after heated debate',
  'Nairobi Stock Exchange hits all-time high amid foreign investment surge',
  'Kenya signs trade deal with European Union worth KSh 50 billion',
  'President announces new affordable housing initiative for youth',
]

const MOST_DISCUSSED = NEWS_FEED.slice(0, 5).sort(() => Math.random() - 0.5).map(a => ({
  ...a,
  commentsCount: Math.floor(Math.random() * 80) + 20,
}))

export default function NewsPage() {
  const router = useRouter()
  const { data: user } = useUser()
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Most Recent')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())

  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const lastInteractionRef = useRef(0)

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

  const filtered = activeCategory === 'All'
    ? NEWS_FEED
    : NEWS_FEED.filter(a => a.category === activeCategory)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Most Popular') return b.views - a.views
    if (sortBy === 'Most Discussed') return b.commentsCount - a.commentsCount
    return 0
  })

  const toggleBookmark = (id: number) => {
    if (!user) {
      router.push('/login?redirect=/news')
      return
    }
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Header */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--primary))',
            padding: '48px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 16px',
                borderRadius: 999,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                marginBottom: 16,
              }}
            >
              Live Feed
            </span>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#fff',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 12,
              }}
            >
              Latest News
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
              Stay informed with breaking news from Kenya and Africa
            </p>
          </div>
        </section>

        {/* Category Filters + Sort */}
        <section style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flex: 1, overflowX: 'auto' }}>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--border)',
                    background: activeCategory === cat ? 'var(--primary)' : 'transparent',
                    color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Main Content */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Feed */}
          <div
            ref={scrollRef}
            className="news-feed-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            onMouseEnter={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) pausedRef.current = true }}
            onMouseLeave={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) pausedRef.current = false }}
          >
            {sorted.map(article => (
              <article
                key={article.article_id}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: 20,
                  borderRadius: 16,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 180,
                    minWidth: 180,
                    height: 120,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      alignSelf: 'flex-start',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: CATEGORY_COLORS[article.category] || 'var(--primary-light)',
                      color: '#fff',
                      marginBottom: 8,
                    }}
                  >
                    {article.category}
                  </span>

                  <h2
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      fontFamily: "'Newsreader', Georgia, serif",
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                      marginBottom: 6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.title}
                  </h2>

                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-tertiary)',
                      lineHeight: 1.5,
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {article.excerpt}
                  </p>

                  {/* Footer row */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img
                        src={article.authorAvatar}
                        alt={article.authorName}
                        style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{article.authorName}</span>
                    </div>
                    <span>·</span>
                    <span>{article.timeAgo}</span>
                    <span>·</span>
                    <span>{article.views.toLocaleString()} views</span>
                    <span>·</span>
                    <span>{article.commentsCount} comments</span>
                    <span style={{ flex: 1 }} />
                    <button
                      onClick={e => { e.stopPropagation(); toggleBookmark(article.article_id) }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 4,
                        color: bookmarked.has(article.article_id) ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'color 0.2s',
                      }}
                      title="Bookmark"
                    >
                      {bookmarked.has(article.article_id) ? '★' : '☆'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Breaking News */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: 20,
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--error)',
                    animation: 'pulseGlow 2s ease-in-out infinite',
                  }}
                />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Breaking News
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BREAKING.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      paddingBottom: 12,
                      borderBottom: i < BREAKING.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Most Discussed */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                padding: 20,
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Most Discussed
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {MOST_DISCUSSED.map((item, i) => (
                  <li key={item.article_id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          marginBottom: 4,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                      >
                        {item.title}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.commentsCount} comments
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                borderRadius: 16,
                padding: 24,
                color: '#fff',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: "'Newsreader', Georgia, serif",
                  marginBottom: 6,
                }}
              >
                Stay Updated
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                Get the latest news delivered to your inbox every morning.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  marginBottom: 10,
                }}
              />
              <button
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Subscribe
              </button>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}
