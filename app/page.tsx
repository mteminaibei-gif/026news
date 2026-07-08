import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticlesList } from '@/components/news/ArticlesList'
import { HeroCarousel } from '@/components/news/HeroCarousel'
import { SubscribeWidget } from '@/components/ui/SubscribeWidget'
import { formatNumber, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { MOCK_CATEGORIES, MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import type { Metadata } from 'next'
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
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
      .eq('status', 'published' as never)
      .order('created_at', { ascending: false })
      .limit(24) as any
    if (error) throw error
    return (data ?? []) as unknown as ArticleWithAuthor[]
  }, MOCK_ARTICLES.filter(a => a.status === 'published').map(a => ({
    ...a,
    author:    a.author,
    category:  a.category,
    analytics: { views: a.views, likes: 0, shares: 0, comments_count: 0 },
  })) as unknown as ArticleWithAuthor[])

  const journalists: JournalistRow[] = await safeQuery(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, profile_image')
      .eq('role', 'journalist' as never)
      .eq('status', 'active' as never)
      .limit(3) as any
    if (error) throw error
    return (data ?? []) as unknown as JournalistRow[]
  }, MOCK_USERS.filter(u => u.role === 'journalist').slice(0, 3).map(u => ({
    user_id:       u.user_id,
    name:          u.name,
    profile_image: u.profile_image,
  })))

  const categories: CategoryRow[] = await safeQuery(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, name') as any
    if (error) throw error
    return (data?.length ? data : MOCK_CATEGORIES) as CategoryRow[]
  }, MOCK_CATEGORIES)

  const trending  = [...articles].sort((a, b) => b.views - a.views).slice(0, 5)
  const spotlight = articles.slice(0, 3)

  const featured   = articles.filter(a => (a as any).featured)
  const heroSlides = [
    ...featured,
    ...[...articles].sort((a, b) => b.views - a.views)
      .filter(a => !featured.find(f => f.article_id === a.article_id)),
  ].slice(0, 7)

  const displayArticles = categoryParam
    ? articles.filter(a => a.category?.name === categoryParam)
    : articles

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      {/* Category bar */}
      <div className="bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-0 scrollbar-none">
          <Link
            href="/"
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors',
              !categoryParam
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600'
            )}
          >
            All News
          </Link>
          {categories.map(cat => {
            const isActive = categoryParam === cat.name
            return (
              <Link
                key={cat.category_id}
                href={`/?category=${cat.name}`}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600'
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
        <div className="bg-[#0a1628] text-white py-2 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 text-sm">
            <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded text-xs font-bold uppercase shrink-0 animate-pulse">
              ⚡ Breaking
            </span>
            <div className="flex gap-8 overflow-hidden whitespace-nowrap text-white/70">
              {trending.map(a => (
                <Link
                  key={a.article_id}
                  href={`/article/${a.slug}`}
                  className="before:content-['•_'] before:text-orange-400 hover:text-white transition-colors"
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero — home page only */}
      <HeroCarousel articles={heroSlides as never} />

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
                  <div
                    key={article.article_id}
                    className="bg-white dark:bg-gray-800/40 border dark:border-gray-800/60 rounded-xl shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    {article.featured_image && (
                      <div className="relative w-24 h-20 shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={article.featured_image}
                          alt={article.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold uppercase text-orange-500 tracking-wider">
                        {article.category?.name}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white mt-0.5 mb-1.5 leading-snug">
                        <Link
                          href={`/article/${article.slug}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {article.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {article.content.substring(0, 100)}...
                      </p>
                      {article.author && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {article.author.profile_image && (
                            <Image
                              src={article.author.profile_image}
                              alt={article.author.name}
                              width={20}
                              height={20}
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {article.author.name} — Freelance Journalist
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-5">
          {trending.length > 0 && (
            <div className="bg-white dark:bg-gray-800/40 border dark:border-gray-800/60 rounded-xl shadow-sm overflow-hidden transition-colors">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b-2 border-blue-600">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                  🔥 Trending Now
                </h3>
              </div>
              {trending.map((a, i) => (
                <div
                  key={a.article_id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <span className="text-2xl font-black text-gray-200 dark:text-gray-700 min-w-[28px]">{i + 1}</span>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                      <Link href={`/article/${a.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
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

          <div className="bg-white dark:bg-gray-800/40 border dark:border-gray-800/60 rounded-xl shadow-sm overflow-hidden transition-colors">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b-2 border-blue-600">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                📂 Categories
              </h3>
            </div>
            {categories.map(cat => (
              <div
                key={cat.category_id}
                className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div>
                  <Link
                    href={`/?category=${cat.name}`}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {cat.name}
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {articles.filter(a => a.category?.name === cat.name).length} articles
                  </p>
                </div>
                <span className="text-gray-300 dark:text-gray-600">→</span>
              </div>
            ))}
          </div>

          {journalists.length > 0 && (
            <div className="bg-white dark:bg-gray-800/40 border dark:border-gray-800/60 rounded-xl shadow-sm overflow-hidden transition-colors">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b-2 border-blue-600">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                  🏆 Top Journalists
                </h3>
              </div>
              {journalists.map(j => (
                <Link
                  key={j.user_id}
                  href={`/journalists/${j.user_id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
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
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
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
                className="block text-center text-xs font-semibold text-blue-600 dark:text-blue-400 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
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
