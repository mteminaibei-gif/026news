'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_USERS } from '@/lib/mock-data'

const FILTER_TABS = ['All Time', 'This Month', 'This Week', 'Today'] as const

const RISING_STORIES = [
  { title: 'New Exoplanet Discovery Sparks Debate', trend: '+245%', category: 'Science' },
  { title: 'Kenya&apos;s Tech Hub Expansion Plans', trend: '+180%', category: 'Tech' },
  { title: 'East African Trade Agreement Update', trend: '+156%', category: 'Business' },
  { title: 'Climate Summit Key Takeaways', trend: '+132%', category: 'Science' },
  { title: 'Youth Employment Initiative Results', trend: '+98%', category: 'Politics' },
]

const CATEGORIES = ['Politics', 'Business', 'Tech', 'Science', 'Entertainment', 'Sports']

export default function ArticlesPage() {
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]>('All Time')
  const [email, setEmail] = useState('')

  const publishedArticles = MOCK_ARTICLES.filter(a => a.status === 'published')
  const featured = publishedArticles[0]
  const articles = publishedArticles.slice(1)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            padding: 'var(--space-3xl) 0',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', paddingInline: 'var(--space-lg)' }}>
            <h1
              style={{
                fontSize: '2.75rem',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 'var(--space-sm)',
              }}
            >
              Most Popular Articles
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px' }}>
              The stories that matter most to our readers
            </p>

            {/* Filter Tabs */}
            <div className="flex gap-2" style={{ marginTop: 'var(--space-xl)' }}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeFilter === tab ? '#ffffff' : 'rgba(255,255,255,0.15)',
                    color: activeFilter === tab ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-2xl)' }}>
            {/* Left Column */}
            <div>
              {/* Featured Article */}
              {featured && (
                <Link
                  href={`/article/${featured.slug}`}
                  className="hover-lift"
                  style={{
                    display: 'block',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'var(--bg-surface)',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 'var(--space-2xl)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ position: 'relative', height: '400px' }}>
                    <Image
                      src={featured.featured_image}
                      alt={featured.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                      }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--space-xl)' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          background: 'var(--accent)',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 'var(--space-sm)',
                        }}
                      >
                        {featured.category?.name}
                      </span>
                      <h2
                        style={{
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          fontFamily: "'Newsreader', Georgia, serif",
                          lineHeight: 1.3,
                          marginBottom: 'var(--space-sm)',
                        }}
                      >
                        {featured.title}
                      </h2>
                      <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)', marginBottom: 'var(--space-md)' }}>
                        {featured.content.slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src={featured.author?.profile_image || ''}
                            alt={featured.author?.name || ''}
                            width={28}
                            height={28}
                            style={{ borderRadius: '50%' }}
                          />
                          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                            {featured.author?.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                          {featured.views.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Article Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                {articles.map(article => (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    className="hover-lift"
                    style={{
                      display: 'block',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: 'var(--bg-surface)',
                      boxShadow: 'var(--card-shadow)',
                      border: '1px solid var(--border-subtle)',
                      textDecoration: 'none',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', height: '180px' }}>
                      <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ padding: 'var(--space-lg)' }}>
                      {/* Category Badge */}
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: 'var(--space-sm)',
                        }}
                      >
                        {article.category?.name}
                      </span>

                      {/* Title */}
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontFamily: "'Newsreader', Georgia, serif",
                          lineHeight: 1.35,
                          marginBottom: 'var(--space-sm)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          marginBottom: 'var(--space-md)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.content.slice(0, 100)}...
                      </p>

                      {/* Author Row */}
                      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-sm)' }}>
                        <Image
                          src={article.author?.profile_image || ''}
                          alt={article.author?.name || ''}
                          width={22}
                          height={22}
                          style={{ borderRadius: '50%' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {article.author?.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          &middot; {article.created_at}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {'\u{1F441}'} {article.views.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {'\u{1F4AC}'} {article.comments?.length || 0}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {'\u{1F44D}'} {Math.floor(article.views * 0.03)}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: 'var(--bg-inset)',
                              color: 'var(--text-tertiary)',
                              fontSize: '0.68rem',
                              fontWeight: 500,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {/* Rising Stories */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '16px',
                  padding: 'var(--space-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-md)',
                    fontFamily: "'Newsreader', Georgia, serif",
                  }}
                >
                  Rising Stories
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {RISING_STORIES.map((story, i) => (
                    <div
                      key={i}
                      className="hover-lift"
                      style={{
                        padding: 'var(--space-sm)',
                        borderRadius: '12px',
                        background: 'var(--bg-inset)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          marginBottom: '4px',
                        }}
                      >
                        {story.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontWeight: 500,
                          }}
                        >
                          {story.category}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--success)',
                          }}
                        >
                          {story.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '16px',
                  padding: 'var(--space-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-md)',
                    fontFamily: "'Newsreader', Georgia, serif",
                  }}
                >
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <Link
                      key={cat}
                      href={`/category/${cat.toLowerCase()}`}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '9999px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                  borderRadius: '16px',
                  padding: 'var(--space-xl)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: 'var(--space-sm)',
                    fontFamily: "'Newsreader', Georgia, serif",
                  }}
                >
                  Stay Informed
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', marginBottom: 'var(--space-md)' }}>
                  Get the top stories delivered to your inbox every morning.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#ffffff',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Subscribe Free
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
