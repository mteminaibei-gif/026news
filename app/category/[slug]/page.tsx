'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { SubscribeWidget } from '@/components/ui/SubscribeWidget'
import { MOCK_ARTICLES, MOCK_CATEGORIES } from '@/lib/mock-data'
import { formatNumber, formatDate } from '@/lib/utils'
import { TrendingUp, MessageSquare, Clock } from 'lucide-react'

type Filter = 'trending' | 'latest' | 'discussed'

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [activeFilter, setActiveFilter] = useState<Filter>('trending')

  const category = MOCK_CATEGORIES.find(c => c.name.toLowerCase() === slug.toLowerCase())
  const categoryName = category?.name ?? slug
  const categoryDescription = category?.description ?? `Latest ${categoryName} news and analysis`

  const filteredArticles = MOCK_ARTICLES.filter(
    a => a.status === 'published' && a.category?.name.toLowerCase() === slug.toLowerCase()
  )

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (activeFilter === 'trending') return b.views - a.views
    if (activeFilter === 'discussed') return (b.comments?.length ?? 0) - (a.comments?.length ?? 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const featured = sortedArticles[0]
  const gridArticles = sortedArticles.slice(1)
  const trending = [...MOCK_ARTICLES].filter(a => a.status === 'published').sort((a, b) => b.views - a.views).slice(0, 5)

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Category Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--primary)' }}
          >
            Category
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-3"
            style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--text-primary)' }}
          >
            {categoryName}
          </h1>
          <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
            {categoryDescription}
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {(['trending', 'latest', 'discussed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeFilter === f ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeFilter === f ? 'var(--bg-elevated)' : 'var(--text-secondary)',
                border: `1px solid ${activeFilter === f ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {f === 'trending' && <TrendingUp size={14} className="inline mr-1.5 -mt-0.5" />}
              {f === 'discussed' && <MessageSquare size={14} className="inline mr-1.5 -mt-0.5" />}
              {f === 'latest' && <Clock size={14} className="inline mr-1.5 -mt-0.5" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Layout: Main + Sidebar */}
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[1fr_340px]">
          <main>
            {/* Featured Article */}
            {featured && (
              <div
                className="rounded-2xl overflow-hidden mb-10 transition-all duration-300 group"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <Link href={`/article/${featured.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="flex flex-col md:flex-row">
                    <div
                      className="relative w-full md:w-[420px] h-64 md:h-auto shrink-0 overflow-hidden"
                      style={{ background: 'var(--bg-inset)' }}
                    >
                      {featured.featured_image ? (
                        <Image
                          src={featured.featured_image}
                          alt={featured.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 420px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                          <span className="text-2xl font-bold tracking-widest uppercase" style={{ color: 'var(--primary)', opacity: 0.15 }}>
                            {categoryName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--accent)' }}>
                        Featured in {categoryName}
                      </p>
                      <h2
                        className="text-2xl font-bold leading-snug mb-3"
                        style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--text-primary)' }}
                      >
                        {featured.title}
                      </h2>
                      <p className="text-sm leading-relaxed mb-5 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                        {featured.content.substring(0, 160)}...
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                        >
                          {featured.author?.name?.charAt(0) ?? 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {featured.author?.name ?? 'Staff Writer'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDate(featured.created_at)} · {formatNumber(featured.views)} views
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map(article => (
                <ArticleCard key={article.article_id} article={article} />
              ))}
            </div>

            {sortedArticles.length === 0 && (
              <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No articles yet</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Check back soon for {categoryName} news.</p>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-8">
            {/* Trending */}
            <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                Trending Now
              </h3>
              <div className="flex flex-col gap-4">
                {trending.map((a, i) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} className="flex gap-3 items-start" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)', minWidth: 28, lineHeight: 1 }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{
                          color: 'var(--text-primary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {a.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {formatNumber(a.views)} views · {a.category?.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <SubscribeWidget />
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
