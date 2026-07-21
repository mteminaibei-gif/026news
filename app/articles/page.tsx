import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { CategoryCloud } from '@/components/layout/CategoryCloud'
import { stripHtml } from '@/lib/utils'
import type { PostgrestResponse } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Most Popular Articles',
  description: 'The most-read stories on 026connet! — from our newsroom and leading publications across Kenya, Africa, and the world.',
  openGraph: {
    title: 'Most Popular Articles — 026connet!',
    description: 'The most-read stories on 026connet! — from our newsroom and leading publications across Kenya, Africa, and the world.',
    siteName: '026connet!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Most Popular Articles — 026connet!',
    description: 'The most-read stories on 026connet! — from our newsroom and leading publications.',
  },
}

type ArticleRow = {
  article_id: number
  slug: string
  title: string
  content: string
  excerpt: string | null
  featured_image: string | null
  views: number
  created_at: string
  tags: string[] | null
  source_name: string | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

const FILTER_TABS = ['All Time', 'This Month', 'This Week', 'Today'] as const

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch { return fallback }
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '—'
}

function ArticleThumb({ src, alt, height }: { src: string | null; alt: string; height: number }) {
  if (src) {
    return (
      <div style={{ position: 'relative', height }}>
        <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} unoptimized  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
      </div>
    )
  }
  return (
    <div
      style={{
        height,
        background: 'linear-gradient(135deg, var(--primary-light), var(--bg-inset))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
      }}
    >
      📰
    </div>
  )
}

function AuthorAvatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <Image src={src} alt={name} width={28} height={28} style={{ borderRadius: '50%' }} unoptimized />
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--primary)',
        color: 'var(--text-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </div>
  )
}

export default async function ArticlesPage() {
  const supabase = await createClient()

  const articles = await safeQuery(async () => {
    const res = await supabase
      .from('articles')
      .select(
        'article_id, slug, title, content, excerpt, featured_image, views, created_at, tags, source_name, author:users(name, profile_image), category:categories(name)',
      )
      .eq('status', 'published' as never)
      .eq('post_type', 'article' as never)
      .order('views', { ascending: false })
      .limit(48) as PostgrestResponse<ArticleRow>
    if (res.error) throw res.error
    return res.data ?? []
  }, [] as ArticleRow[])

  const featured = articles[0]
  const rest = articles.slice(1)

  const risingStories = articles
    .filter(a => a.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      trend: `+${Math.min(Math.round(a.views / 10), 999)}%`,
      category: a.category?.name || 'News',
    }))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
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
              The stories that matter most to our readers — from our newsroom and leading publications.
            </p>

            {/* Filter Tabs */}
            <div className="flex gap-2" style={{ marginTop: 'var(--space-xl)' }}>
              {FILTER_TABS.map((tab, i) => (
                <span
                  key={tab}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.15)',
                    color: i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {tab}
                </span>
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
              {featured && (() => {
                const byline = featured.source_name ?? featured.author?.name ?? 'Staff'
                return (
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
                      <ArticleThumb src={featured.featured_image} alt={featured.title} height={400} />
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
                          {featured.category?.name ?? 'Articles'}
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
                          {stripHtml(featured.excerpt || featured.content).slice(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <AuthorAvatar src={featured.author?.profile_image ?? null} name={byline} />
                            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                              {byline}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                            {featured.views.toLocaleString()} views
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })()}

              {/* Article Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
                {rest.map((article) => {
                  const byline = article.source_name ?? article.author?.name ?? 'Staff'
                  return (
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
                        <ArticleThumb src={article.featured_image} alt={article.title} height={180} />
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
                          {article.category?.name ?? 'Articles'}
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
                          {stripHtml(article.excerpt || article.content).slice(0, 100)}...
                        </p>

                        {/* Author Row */}
                        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-sm)' }}>
                          <AuthorAvatar src={article.author?.profile_image ?? null} name={byline} />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {byline}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            &middot; {new Date(article.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-sm)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {'👁'} {article.views.toLocaleString()}
                          </span>
                          {article.tags?.[0] && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                              #{article.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
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
                  {risingStories.map((story, i) => (
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
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {story.category}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)' }}>
                          {story.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories (real-time) */}
              <CategoryCloud />

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
    </div>
  )
}
