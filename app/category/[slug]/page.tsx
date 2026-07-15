'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, MessageSquare, Clock, Loader2, Eye, Bookmark, BookmarkCheck } from 'lucide-react'

type Filter = 'trending' | 'latest' | 'discussed'

type CategoryArticle = {
  article_id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  likes: number
  created_at: string
  post_type: string
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#e23b3b',
  Business: '#d4a853',
  Tech: '#1a73e8',
  Sports: '#34a853',
  Science: '#fbbc04',
  Health: '#34a853',
  Kenya: '#006600',
  Africa: '#d4a853',
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [activeFilter, setActiveFilter] = useState<Filter>('trending')
  const [articles, setArticles] = useState<CategoryArticle[]>([])
  const [trending, setTrending] = useState<CategoryArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())

  const supabase = createClient()
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1)

  useEffect(() => {
    fetchArticles()
  }, [slug, activeFilter])

  async function fetchArticles() {
    setLoading(true)

    // Find category by slug or name
    const { data: cats } = await supabase
      .from('categories')
      .select('category_id, name')
      .or(`slug.eq.${slug},name.ilike.${slug}`)
      .limit(1)

    const catId = (cats as { category_id: number; name: string }[] | null)?.[0]?.category_id

    let query = supabase
      .from('articles')
      .select('article_id, slug, title, excerpt, content, featured_image, views, likes, created_at, post_type, author:users(name, profile_image), category:categories(name)')
      .eq('status', 'published')

    if (catId) {
      query = query.eq('category_id', catId)
    } else {
      query = query.ilike('category.name', `%${slug}%`)
    }

    if (activeFilter === 'trending' || activeFilter === 'discussed') {
      query = query.order('views', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.limit(30)

    const { data } = await query
    setArticles((data as unknown as CategoryArticle[]) ?? [])

    // Trending across all categories
    const { data: trendData } = await supabase
      .from('articles')
      .select('article_id, slug, title, excerpt, featured_image, views, likes, created_at, category:categories(name)')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(5)

    setTrending((trendData as unknown as CategoryArticle[]) ?? [])
    setLoading(false)
  }

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const featured = articles[0]
  const gridArticles = articles.slice(1)

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Category Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 40px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: CATEGORY_COLORS[categoryName] || 'var(--primary)', marginBottom: 8 }}>
            Category
          </p>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {categoryName}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Latest {categoryName} news and analysis
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {(['trending', 'latest', 'discussed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                background: activeFilter === f ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeFilter === f ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                borderColor: activeFilter === f ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {f === 'trending' && <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: -2 }} />}
              {f === 'discussed' && <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />}
              {f === 'latest' && <Clock size={14} style={{ marginRight: 6, verticalAlign: -2 }} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Loading articles...</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
            <main>
              {/* Featured Article */}
              {featured && (
                <Link href={`/article/${featured.slug}`} style={{
                  display: 'block', borderRadius: 16, overflow: 'hidden',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  marginBottom: 32, textDecoration: 'none', color: 'inherit',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'row', minHeight: 300 }}>
                    <div style={{ width: 420, flexShrink: 0, position: 'relative', background: 'var(--bg-inset)' }}>
                      {featured.featured_image ? (
                        <Image src={featured.featured_image} alt={featured.title} fill style={{ objectFit: 'cover' }} sizes="420px" unoptimized />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.15, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{categoryName}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: CATEGORY_COLORS[categoryName] || 'var(--primary)', marginBottom: 10 }}>
                        Featured in {categoryName}
                      </p>
                      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
                        {featured.title}
                      </h2>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                        {featured.content.substring(0, 200)}...
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                        <span>{featured.author?.name ?? 'Staff Writer'}</span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /> {formatNumber(featured.views)}</span>
                        <span>·</span>
                        <span>{new Date(featured.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Article Grid */}
              {gridArticles.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {gridArticles.map(article => (
                    <Link key={article.article_id} href={`/article/${article.slug}`} style={{
                      display: 'flex', flexDirection: 'column',
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 14, overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                      {article.featured_image ? (
                        <div style={{ position: 'relative', height: 180 }}>
                          <Image src={article.featured_image} alt={article.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 33vw" unoptimized />
                        </div>
                      ) : (
                        <div style={{ height: 180, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-tertiary)', opacity: 0.3 }}>{categoryName}</span>
                        </div>
                      )}
                      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: CATEGORY_COLORS[article.category?.name ?? ''] || 'var(--primary)', marginBottom: 6 }}>
                          {article.category?.name ?? 'News'}
                        </span>
                        <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12, flex: 1 }}>
                            {article.excerpt}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{article.author?.name ?? 'Staff'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {formatNumber(article.views)}</span>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); toggleBookmark(article.article_id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: bookmarked.has(article.article_id) ? 'var(--primary)' : 'var(--text-tertiary)' }}
                          >
                            {bookmarked.has(article.article_id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>No articles yet</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Check back soon for {categoryName} news.</p>
                </div>
              )}
            </main>

            {/* Sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Trending */}
              {trending.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                    Trending Now
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {trending.map((a, i) => (
                      <Link key={a.article_id} href={`/article/${a.slug}`} style={{ display: 'flex', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-tertiary)', minWidth: 24, fontFeatureSettings: "'tnum'" }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {a.title}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                            {formatNumber(a.views)} views · {a.category?.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
