import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticlesList } from '@/components/news/ArticlesList'
import { HeroCarousel } from '@/components/news/HeroCarousel'
import { ArticleCard } from '@/components/news/ArticleCard'
import { AdBanner } from '@/components/ui/AdBanner'
import { BreakingNewsTicker } from '@/components/news/BreakingNewsTicker'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, Flame, BarChart2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MOCK_CATEGORIES, MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import type { Metadata } from 'next'
import type { PostgrestResponse } from '@supabase/supabase-js'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: '026News — Breaking News, Analysis & Freelance Journalism',
  description: 'Kenya\'s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.',
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

  const heroSlides = [
    ...featured,
    ...sortByPriorityThenViews(kenyaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(africaArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
    ...sortByPriorityThenViews(otherArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
  ].slice(0, 7)

  const displayArticles = categoryParam
    ? articles.filter(a => a.category?.name === categoryParam)
    : [...sortByPriorityThenViews(kenyaArticles), ...sortByPriorityThenViews(africaArticles), ...sortByPriorityThenViews(otherArticles)]

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

      {/* Feed Tabs */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 16,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {categoryParam ? `${categoryParam} News` : 'For You'}
          </h2>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 4 }}>
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--bg-elevated)',
                cursor: 'pointer',
              }}
            >
              For You
            </button>
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Recent
            </button>
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48 }}>
        <main>
          {/* Featured Article (First hero slide) */}
          {heroSlides[0] && (
            <Link
              key={heroSlides[0].article_id}
              href={`/article/${heroSlides[0].slug}`}
              style={{
                display: 'block',
                marginBottom: 32,
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                textDecoration: 'none',
              }}
            >
              <div style={{ position: 'relative', height: 400 }}>
                <Image
                  src={heroSlides[0].featured_image || 'https://picsum.photos/id/1000/800/450'}
                  alt={heroSlides[0].title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="100vw"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                  {heroSlides[0].category?.name && (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 8,
                    }}>
                      {heroSlides[0].category.name}
                    </span>
                  )}
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: "'Newsreader', Georgia, serif",
                    lineHeight: 1.25,
                    marginBottom: 8,
                  }}>
                    {heroSlides[0].title}
                  </h2>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', marginBottom: 12, maxWidth: 700 }}>
                    {heroSlides[0].content.slice(0, 180).replace(/\n/g, ' ')}...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {heroSlides[0].author?.profile_image ? (
                      <Image src={heroSlides[0].author.profile_image} alt={heroSlides[0].author.name} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>
                        {heroSlides[0].author?.name?.charAt(0) ?? 'S'}
                      </div>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      {heroSlides[0].author?.name ?? 'Staff Writer'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      · {formatNumber(heroSlides[0].views)} views
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Article Grid - 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {displayArticles.slice(0, 8).map(article => (
              <ArticleCard key={article.article_id} article={article} variant="default" />
            ))}
          </div>

          {/* Infinite Scroll Articles */}
          <ArticlesList initialArticles={displayArticles} categoryFilterName={categoryParam} />
        </main>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Trending Now */}
          {trending.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                Trending Now
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {trending.map((a, i) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-tertiary)', minWidth: 28, lineHeight: 1 }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {formatNumber(a.views)} views · {a.category?.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rising Stories */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={16} style={{ color: 'var(--accent)' }} />
              Rising Stories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'New Exoplanet Discovery Sparks Debate', trend: '+245%', category: 'Science' },
                { title: 'Kenya\'s Tech Hub Expansion Plans', trend: '+180%', category: 'Tech' },
                { title: 'East African Trade Agreement Update', trend: '+156%', category: 'Business' },
                { title: 'Climate Summit Key Takeaways', trend: '+132%', category: 'Science' },
                { title: 'Youth Employment Initiative Results', trend: '+98%', category: 'Politics' },
              ].map((story, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 12, background: 'var(--bg-inset)', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 4 }}>
                    {story.title}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{story.category}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)' }}>{story.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsored */}
          <AdBanner slot="home-newsletter" format="rectangle" className="rounded-xl overflow-hidden" label="Sponsored" />

          {/* Categories */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Categories</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map(cat => (
                <Link
                  key={cat.category_id}
                  href={`/?category=${cat.name}`}
                  style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: 'var(--bg-muted)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Top Authors */}
          {authors.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Authors</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authors.map(j => (
                  <Link key={j.user_id} href={`/journalists/${j.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, textDecoration: 'none', color: 'inherit' }}>
                    {j.profile_image ? (
                      <Image src={j.profile_image} alt={j.name} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>
                        {j.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{j.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Author</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/leaderboard" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--primary)', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
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