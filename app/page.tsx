import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticlesList } from '@/components/news/ArticlesList'
import { HeroCarousel } from '@/components/news/HeroCarousel'
import { ArticleCard } from '@/components/news/ArticleCard'
import { SubscribeWidget } from '@/components/ui/SubscribeWidget'
import { formatNumber, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { MOCK_CATEGORIES, MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import type { Metadata } from 'next'
import type { PostgrestResponse } from '@supabase/supabase-js'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Breaking News, Analysis & Freelance Journalism',
}

type JournalistRow = { user_id: number; name: string; profile_image: string | null }
type CategoryRow   = { category_id: number; name: string }

interface Props {
  searchParams: Promise<{ category?: string }>
}

// Safe data-fetch helper — always returns a value, never throws
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export default async function HomePage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams

  // All Supabase calls wrapped — if env vars are missing or DB is unreachable
  // the page falls back to mock data instead of crashing
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
    author:    a.author,
    category:  a.category,
    analytics: { views: a.views, likes: 0, shares: 0, comments_count: 0 },
  })) as unknown as ArticleWithAuthor[])

  const journalists: JournalistRow[] = await safeQuery(async () => {
    const response = await supabase
      .from('users')
      .select('user_id, name, profile_image')
      .eq('role', 'journalist' as never)
      .eq('status', 'active' as never)
      .limit(3) as PostgrestResponse<JournalistRow>
    if (response.error) throw response.error
    return response.data ?? []
  }, MOCK_USERS.filter(u => u.role === 'journalist').slice(0, 3).map(u => ({
    user_id:       u.user_id,
    name:          u.name,
    profile_image: u.profile_image,
  })))

  const categories: CategoryRow[] = await safeQuery(async () => {
    const response = await supabase
      .from('categories')
      .select('category_id, name') as PostgrestResponse<CategoryRow>
    if (response.error) throw response.error
    return (response.data?.length ? response.data : MOCK_CATEGORIES) as CategoryRow[]
  }, MOCK_CATEGORIES)

  const trending  = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)
  const spotlight = articles.slice(0, 3)

  // Hero: Kenya/Africa content first, then most viewed, then latest
  const kenyaArticles = articles.filter(a =>
    ['Kenya', 'Africa', 'Politics', 'Business'].includes(a.category?.name ?? '')
  )
  const otherArticles = articles.filter(a =>
    !['Kenya', 'Africa', 'Politics', 'Business'].includes(a.category?.name ?? '')
  )
  const featured   = articles.filter((a): a is ArticleWithAuthor & { featured: boolean } => Boolean((a as unknown as Record<string, unknown>).featured))
  // Prioritise trusted Kenyan sources (Nation, KBC, Royal Media, NTV, Citizen, K24)
  const PRIORITY_SOURCES = ['nation', 'kbc', 'royal', 'ntv', 'citizen', 'k24']

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
    ...sortByPriorityThenViews(otherArticles).filter(a => !featured.find(f => f.article_id === a.article_id)),
  ].slice(0, 7)

  // Kenya/Africa articles first, then rest — when no category filter is active
  const displayArticles = categoryParam
    ? articles.filter(a => a.category?.name === categoryParam)
    : [
        ...articles.filter(a => ['Kenya', 'Africa'].includes(a.category?.name ?? '')),
        ...articles.filter(a => !['Kenya', 'Africa'].includes(a.category?.name ?? '')),
      ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      {/* Category bar */}
      <div className="bg-white dark:bg-[#0f1a12] border-b-2 border-[#e8f5ea] dark:border-[#1a2e1e] sticky top-16 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-0 scrollbar-none">
          <Link
            href="/"
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors',
              !categoryParam
                ? 'text-[#1a5c2a] dark:text-[#4caf28] border-[#1a5c2a] dark:border-[#4caf28]'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-[#1a5c2a] dark:hover:text-[#4caf28] hover:border-[#1a5c2a]'
            )}
          >
            All News
          </Link>
          {categories.map(cat => {
            const isActive = categoryParam === cat.name
            const isKenya  = ['Kenya', 'Africa'].includes(cat.name)
            return (
              <Link
                key={cat.category_id}
                href={`/?category=${cat.name}`}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  isActive
                    ? isKenya
                      ? 'text-[#c8102e] border-[#c8102e] font-semibold'
                      : 'text-[#1a5c2a] dark:text-[#4caf28] border-[#1a5c2a] dark:border-[#4caf28] font-semibold'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-[#1a5c2a] dark:hover:text-[#4caf28] hover:border-[#1a5c2a]'
                )}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Breaking ticker */}
      {trending.length > 0 && (
        <div className="bg-[#1a5c2a] text-white py-2 overflow-hidden border-b-2 border-[#f5c518]/30">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 text-sm">
            <span className="bg-[#c8102e] text-white px-2.5 py-0.5 rounded text-xs font-bold uppercase shrink-0 animate-pulse">
              🇰🇪 Breaking
            </span>
            <div className="flex gap-8 overflow-hidden whitespace-nowrap text-white/75">
              {trending.map(a => (
                <Link
                  key={a.article_id}
                  href={`/article/${a.slug}`}
                  className="before:content-['•_'] before:text-[#f5c518] hover:text-white transition-colors shrink-0"
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero — home page only */}
      {!categoryParam && <HeroCarousel articles={heroSlides as never} />}

      {/* Main content grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8 w-full">
        <main>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2 after:flex-1 after:h-0.5 after:bg-gray-200 dark:after:bg-gray-800 after:ml-2">
            📰 {categoryParam ? `${categoryParam} News` : 'Latest News'}
          </h2>

          <ArticlesList initialArticles={displayArticles} categoryFilterName={categoryParam} />

          {/* Freelance Spotlight */}
          {spotlight.length > 0 && (
            <>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mt-10 mb-4 flex items-center gap-2 after:flex-1 after:h-0.5 after:bg-gray-200 dark:after:bg-gray-800 after:ml-2">
                ✍️ Freelance Spotlight
              </h2>
              <div className="space-y-4">
                {spotlight.map(article => (
                  <ArticleCard
                    key={article.article_id}
                    article={article}
                    variant="horizontal"
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-5">
          {trending.length > 0 && (
            <div className="bg-white dark:bg-[#1a2e1e] border dark:border-[#2d4a33]/60 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#e8f5ea] dark:bg-[#1a5c2a]/30 border-b-2 border-[#1a5c2a] dark:border-[#4caf28]">
                <h3 className="text-sm font-extrabold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider">
                  🔥 Trending Now
                </h3>
              </div>
              {trending.map((a, i) => (
                <div
                  key={a.article_id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2d4a33]/40 last:border-0 hover:bg-[#e8f5ea]/50 dark:hover:bg-[#1a5c2a]/10 transition-colors"
                >
                  <span className="text-2xl font-black text-[#4caf28]/25 dark:text-[#4caf28]/20 min-w-7">{i + 1}</span>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                      <Link href={`/article/${a.slug}`} className="hover:text-[#1a5c2a] dark:hover:text-[#4caf28]">
                        {a.title}
                      </Link>
                    </h5>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      👁 {formatNumber(a.views)} · {a.category?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SubscribeWidget />

          <div className="bg-white dark:bg-[#1a2e1e] border dark:border-[#2d4a33]/60 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-[#e8f5ea] dark:bg-[#1a5c2a]/30 border-b-2 border-[#1a5c2a] dark:border-[#4caf28]">
              <h3 className="text-sm font-extrabold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider">
                📂 Categories
              </h3>
            </div>
            {categories.map(cat => (
              <div
                key={cat.category_id}
                className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2d4a33]/40 last:border-0 hover:bg-[#e8f5ea]/50 dark:hover:bg-[#1a5c2a]/10 transition-colors"
              >
                <div>
                  <Link
                    href={`/?category=${cat.name}`}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-[#1a5c2a] dark:hover:text-[#4caf28]"
                  >
                    {['Kenya','Africa'].includes(cat.name) ? '🇰🇪 ' : ''}{cat.name}
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {articles.filter(a => a.category?.name === cat.name).length} articles
                  </p>
                </div>
                <span className="text-[#4caf28]/40 dark:text-[#4caf28]/30">→</span>
              </div>
            ))}
          </div>

          {journalists.length > 0 && (
            <div className="bg-white dark:bg-[#1a2e1e] border dark:border-[#2d4a33]/60 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#e8f5ea] dark:bg-[#1a5c2a]/30 border-b-2 border-[#1a5c2a] dark:border-[#4caf28]">
                <h3 className="text-sm font-extrabold text-[#1a5c2a] dark:text-[#4caf28] uppercase tracking-wider">
                  🏆 Top Journalists
                </h3>
              </div>
              {journalists.map(j => (
                <Link
                  key={j.user_id}
                  href={`/journalists/${j.user_id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2d4a33]/40 last:border-0 hover:bg-[#e8f5ea]/50 dark:hover:bg-[#1a5c2a]/10 transition-colors"
                >
                  {j.profile_image ? (
                    <Image
                      src={j.profile_image}
                      alt={j.name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#e8f5ea] dark:bg-[#1a5c2a]/40 flex items-center justify-center text-sm font-bold text-[#1a5c2a] dark:text-[#4caf28] shrink-0">
                      {j.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{j.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Journalist</p>
                  </div>
                </Link>
              ))}
              <Link
                href="/leaderboard"
                className="block text-center text-xs font-semibold text-[#1a5c2a] dark:text-[#4caf28] py-2.5 hover:bg-[#e8f5ea]/50 dark:hover:bg-[#1a5c2a]/10 transition-colors"
              >
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
