import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroCarousel } from '@/components/news/HeroCarousel'
import { HomeFeed } from '@/components/news/HomeFeed'
import { ArticleCard } from '@/components/news/ArticleCard'
import { BreakingNewsTicker } from '@/components/news/BreakingNewsTicker'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MOCK_CATEGORIES, MOCK_ARTICLES } from '@/lib/mock-data'
import type { Metadata } from 'next'
import type { PostgrestResponse } from '@supabase/supabase-js'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: '026News — Breaking News, Analysis & Freelance Journalism',
  description: 'Kenya\'s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.',
}

type CategoryRow = { category_id: number; name: string }

interface Props {
  searchParams: Promise<{ category?: string; sort?: string }>
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch { return fallback }
}

export default async function HomePage({ searchParams }: Props) {
  const { category: categoryParam, sort: sortParam } = await searchParams
  const supabase = await createClient()

  const rawArticles: ArticleWithAuthor[] = await safeQuery(async () => {
    const response = await supabase
      .from('articles')
      .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
      .eq('status', 'published' as never)
      .order('created_at', { ascending: false })
      .limit(200) as PostgrestResponse<ArticleWithAuthor>
    if (response.error) throw response.error
    return response.data ?? []
  }, MOCK_ARTICLES.filter(a => a.status === 'published').map(a => ({
    ...a,
    author: a.author,
    category: a.category,
    analytics: { views: a.views, likes: 0, shares: 0, comments_count: 0 },
  })) as unknown as ArticleWithAuthor[])

  // Admin "Publish Limits": how many published articles to surface per source type.
  const limitsRes = await safeQuery(async () => {
    const r = await (supabase.from('site_settings') as any)
      .select('value')
      .eq('key', 'publish_limits')
      .maybeSingle() as { data: { value: { inhouse?: number; sourced?: number } } | null; error: unknown }
    if (r.error) throw r.error
    return r.data
  }, null)
  const limits = (limitsRes?.value ?? { inhouse: 0, sourced: 0 }) as { inhouse: number; sourced: number }

  // Organise the published posts by the saved limit: cap in-house and
  // sourced/RSS articles separately, then show newest first overall.
  // A limit of 0 (or unset) means unlimited.
  const inhouseList = rawArticles.filter(a => (a as unknown as Record<string, unknown>).is_aggregated !== true)
  const sourcedList = rawArticles.filter(a => (a as unknown as Record<string, unknown>).is_aggregated === true)
  const inhouse = limits.inhouse > 0 ? inhouseList.slice(0, limits.inhouse) : inhouseList
  const sourced = limits.sourced > 0 ? sourcedList.slice(0, limits.sourced) : sourcedList
  const articles: ArticleWithAuthor[] = [...inhouse, ...sourced].sort((a, b) => {
    // In-house (original) posts are surfaced before aggregated/RSS content.
    const ai = (a as unknown as Record<string, unknown>).is_aggregated === true ? 1 : 0
    const bi = (b as unknown as Record<string, unknown>).is_aggregated === true ? 1 : 0
    if (ai !== bi) return ai - bi
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const categories: CategoryRow[] = await safeQuery(async () => {
    const response = await supabase.from('categories').select('category_id, name') as PostgrestResponse<CategoryRow>
    if (response.error) throw response.error
    return (response.data?.length ? response.data : MOCK_CATEGORIES) as CategoryRow[]
  }, MOCK_CATEGORIES)

  const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)

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

  const featured = articles.filter((a): a is ArticleWithAuthor & { featured: boolean } =>
    Boolean((a as unknown as Record<string, unknown>).featured)
  )
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

  // Prioritise in-house (non-aggregated) posts, then newest-first.
  const prioritizeInhouse = (arr: ArticleWithAuthor[]) =>
    [...arr].sort((a, b) => {
      const ai = (a as unknown as Record<string, unknown>).is_aggregated === true ? 1 : 0
      const bi = (b as unknown as Record<string, unknown>).is_aggregated === true ? 1 : 0
      if (ai !== bi) return ai - bi
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const heroSlides = [
    ...featured,
    ...sortByPriorityThenViews(kenyaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(africaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(otherArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
  ].slice(0, 7)

  const baseArticles = prioritizeInhouse(
    categoryParam
      ? articles.filter(a => a.category?.name === categoryParam)
      : [...sortByPriorityThenViews(kenyaArticles), ...sortByPriorityThenViews(africaArticles), ...sortByPriorityThenViews(otherArticles)]
  ).filter((a, i, self) => i === self.findIndex(b => b.article_id === a.article_id))

  const feedArticles =
    sortParam === 'recent'
      ? [...baseArticles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : sortParam === 'popular'
        ? [...baseArticles].sort((a, b) => b.views - a.views)
        : baseArticles

  // Top Stories — in-house posts first, then the latest published articles
  const topStories = prioritizeInhouse([...articles])
    .slice(0, 6)

  const tabHref = (s: 'foryou' | 'recent' | 'popular') => {
    const params = new URLSearchParams()
    if (categoryParam) params.set('category', categoryParam)
    if (s !== 'foryou') params.set('sort', s)
    const q = params.toString()
    return q ? `/?${q}` : '/'
  }
  const activeSort = sortParam === 'recent' || sortParam === 'popular' ? sortParam : 'foryou'

  const breakingHeadlines = trending.map(a => ({
    article_id: a.article_id, title: a.title, slug: a.slug, created_at: a.created_at, category: a.category ?? null,
  }))

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <Navbar />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker initialHeadlines={breakingHeadlines} />

      {/* Hero Carousel */}
      {!categoryParam && <HeroCarousel articles={heroSlides as never} />}

      {/* Main Content Grid */}
      <div className="main-layout">
        <main>
          {/* Feed Header */}
          <div className="feed-header">
            <h2 className="feed-heading">{categoryParam ? `${categoryParam} News` : 'Latest Stories'}</h2>
            <div className="feed-tabs">
              <Link href={tabHref('foryou')} className={`feed-tab ${activeSort === 'foryou' ? 'active' : ''}`}>For You</Link>
              <Link href={tabHref('recent')} className={`feed-tab ${activeSort === 'recent' ? 'active' : ''}`}>Recent</Link>
              <Link href={tabHref('popular')} className={`feed-tab ${activeSort === 'popular' ? 'active' : ''}`}>Popular</Link>
            </div>
          </div>

          {/* Article Feed (auto-scroll, latest-first) */}
          <HomeFeed initialArticles={feedArticles} categoryFilterName={categoryParam} />

          {/* Top Stories */}
          <section style={{ marginTop: 48 }}>
            <h2 className="feed-heading" style={{ marginBottom: 24 }}>Top Stories</h2>
            <div className="top-stories-grid">
              {topStories.map(article => (
                <ArticleCard key={article.article_id} article={article} variant="default" />
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="home-sidebar">
          {/* Trending Now */}
          {trending.length > 0 && (
            <div className="home-widget">
              <h3 className="widget-title">
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                Trending Now
              </h3>
              <div className="trending-list">
                {trending.map((a, i) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} className="trending-item">
                    <span className="trending-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="trending-body">
                      <p className="trending-title">{a.title}</p>
                      <p className="trending-meta">{formatNumber(a.views)} views · {a.category?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="home-widget">
            <h3 className="widget-title">Categories</h3>
            <div className="categories-grid">
              {categories.map(cat => (
                <Link key={cat.category_id} href={`/?category=${encodeURIComponent(cat.name)}`} className="cat-pill">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Daily Digest */}
          <div className="digest-box">
            <div className="digest-head">
              <Mail size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="widget-title" style={{ marginBottom: 0 }}>Daily Digest</h3>
            </div>
            <p className="digest-desc">
              Get the biggest stories of the day delivered to your inbox every morning.
            </p>
            <form className="digest-form" action="/subscribe" method="get">
              <input className="digest-input" type="email" name="email" placeholder="Your email address" aria-label="Email address" />
              <button className="digest-btn" type="submit">Subscribe</button>
            </form>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  )
}
