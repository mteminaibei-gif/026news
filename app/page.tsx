import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticlesList } from '@/components/news/ArticlesList'
import { HeroCarousel } from '@/components/news/HeroCarousel'
import { ArticleCard } from '@/components/news/ArticleCard'
import { SubscribeWidget } from '@/components/ui/SubscribeWidget'
import { BreakingNewsTicker } from '@/components/news/BreakingNewsTicker'
import { formatNumber } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MOCK_CATEGORIES, MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import type { Metadata } from 'next'
import type { PostgrestResponse } from '@supabase/supabase-js'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Breaking News, Analysis & Freelance Journalism',
}

type AuthorRow = { user_id: number; name: string; profile_image: string | null }
type CategoryRow = { category_id: number; name: string }

interface Props {
  searchParams: Promise<{ category?: string }>
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch { return fallback }
}

export default async function HomePage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams
  const supabase = await createClient()

  const articles: ArticleWithAuthor[] = await safeQuery(async () => {
    const response = await supabase
      .from('articles')
      .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
      .eq('status', 'published' as never)
      .order('created_at', { ascending: false })
      .limit(24) as PostgrestResponse<ArticleWithAuthor>
    if (response.error) throw response.error
    return response.data ?? []
  }, MOCK_ARTICLES.filter(a => a.status === 'published').map(a => ({
    ...a,
    author: a.author,
    category: a.category,
    analytics: { views: a.views, likes: 0, shares: 0, comments_count: 0 },
  })) as unknown as ArticleWithAuthor[])

  const authors: AuthorRow[] = await safeQuery(async () => {
    const response = await supabase
      .from('users')
      .select('user_id, name, profile_image')
      .eq('role', 'journalist' as never)
      .eq('status', 'active' as never)
      .limit(3) as PostgrestResponse<AuthorRow>
    if (response.error) throw response.error
    return response.data ?? []
  }, MOCK_USERS.filter(u => u.role === 'journalist').slice(0, 3).map(u => ({
    user_id: u.user_id, name: u.name, profile_image: u.profile_image,
  })))

  const categories: CategoryRow[] = await safeQuery(async () => {
    const response = await supabase.from('categories').select('category_id, name') as PostgrestResponse<CategoryRow>
    if (response.error) throw response.error
    return (response.data?.length ? response.data : MOCK_CATEGORIES) as CategoryRow[]
  }, MOCK_CATEGORIES)

  const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)
  const spotlight = articles.slice(0, 3)

  const kenyaArticles = articles.filter(a =>
    ['Kenya', 'Politics', 'Business'].includes(a.category?.name ?? '') ||
    (a as unknown as Record<string, unknown>).source_name?.toString().toLowerCase().includes('kenya')
  )
  const africaArticles = articles.filter(a =>
    a.category?.name === 'Africa' ||
    ((a as unknown as Record<string, unknown>).source_name?.toString().toLowerCase().includes('africa') &&
     !['Kenya', 'Politics', 'Business'].includes(a.category?.name ?? ''))
  )
  const otherArticles = articles.filter(a =>
    !['Kenya', 'Africa', 'Politics', 'Business'].includes(a.category?.name ?? '') &&
    !(a as unknown as Record<string, unknown>).source_name?.toString().toLowerCase().includes('africa')
  )

  const featured = articles.filter((a): a is ArticleWithAuthor & { featured: boolean } => Boolean((a as unknown as Record<string, unknown>).featured))
  const PRIORITY_SOURCES = ['nation', 'kbc', 'royal', 'citizen', 'standard', 'capital', 'star', 'business daily']
  const isPriority = (a: ArticleWithAuthor) => {
    const candidates = [a.source_name, a.source_reference, a.source_url, a.author?.name]
    return candidates.some(v => !!v && PRIORITY_SOURCES.some(p => v!.toLowerCase().includes(p)))
  }
  const sortByPriorityThenViews = (arr: ArticleWithAuthor[]) =>
    [...arr].sort((a, b) => {
      const pa = isPriority(a) ? 1 : 0
      const pb = isPriority(b) ? 1 : 0
      if (pa !== pb) return pb - pa
      return (b.views ?? 0) - (a.views ?? 0)
    })

  const heroSlides = [
    ...featured,
    ...sortByPriorityThenViews(kenyaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(africaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(otherArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
  ].slice(0, 7)

  const displayArticles = categoryParam
    ? articles.filter(a => a.category?.name === categoryParam)
    : [...sortByPriorityThenViews(kenyaArticles), ...sortByPriorityThenViews(africaArticles), ...sortByPriorityThenViews(otherArticles)]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Breaking ticker */}
      <BreakingNewsTicker initialHeadlines={trending.map(a => ({
        article_id: a.article_id, title: a.title, slug: a.slug, created_at: a.created_at, category: a.category ?? null,
      }))} />

      {/* Hero */}
      {!categoryParam && <HeroCarousel articles={heroSlides as never} />}

      {/* Main content grid */}
      <div className="main-layout max-w-[1400px] mx-auto px-6 py-12 grid gap-12" style={{ gridTemplateColumns: '1fr 340px' }}>
        <main>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold" style={{ letterSpacing: '-0.01em' }}>
              {categoryParam ? `${categoryParam} News` : 'Latest News'}
            </h2>
            <div className="feed-tabs flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <button className="feed-tab active px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}>All</button>
              <button className="feed-tab px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Trending</button>
              <button className="feed-tab px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Latest</button>
            </div>
          </div>

          <ArticlesList initialArticles={displayArticles} categoryFilterName={categoryParam} />

          {spotlight.length > 0 && (
            <>
              <h2 className="text-xl font-bold mt-12 mb-6">Spotlight</h2>
              <div className="space-y-6">
                {spotlight.map(article => (
                  <ArticleCard key={article.article_id} article={article} variant="horizontal" />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="flex flex-col gap-8">
          {/* Trending */}
          {trending.length > 0 && (
            <div className="sidebar-section p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                Trending Now
              </h3>
              <div className="flex flex-col gap-4">
                {trending.map((a, i) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} className="trending-item flex gap-3 items-start no-underline" style={{ color: 'inherit' }}>
                    <span className="trending-number text-2xl font-bold" style={{ color: 'var(--text-tertiary)', minWidth: 28, lineHeight: 1 }}>{i + 1}</span>
                    <div className="trending-content flex-1">
                      <p className="trending-item-title text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</p>
                      <p className="trending-item-meta text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{formatNumber(a.views)} views · {a.category?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <SubscribeWidget />

          {/* Categories */}
          <div className="sidebar-section p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Link
                  key={cat.category_id}
                  href={`/?category=${cat.name}`}
                  className="category-tag px-3.5 py-1.5 rounded-full text-xs font-medium transition-all no-underline"
                  style={{ background: 'var(--category-bg)', color: 'var(--text-secondary)' }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Top Authors */}
          {authors.length > 0 && (
            <div className="sidebar-section p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                Top Authors
              </h3>
              <div className="flex flex-col gap-4">
                {authors.map(j => (
                  <Link key={j.user_id} href={`/journalists/${j.user_id}`} className="flex items-center gap-3 no-underline" style={{ color: 'inherit' }}>
                    {j.profile_image ? (
                      <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" unoptimized />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {j.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Author</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/leaderboard" className="block text-center text-xs font-semibold mt-4 pt-4 no-underline" style={{ color: 'var(--primary)', borderTop: '1px solid var(--border-subtle)' }}>
                View Full Leaderboard →
              </Link>
            </div>
          )}
        </aside>
      </div>

      <Footer />
    </div>
  )
}
