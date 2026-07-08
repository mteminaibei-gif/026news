import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props { searchParams: Promise<{ q?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search: "${q}" — 026News` : 'Search — 026News',
    description: `Search results for "${q}" on 026News`,
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = await createClient()
  let results: ArticleWithAuthor[] = []

  if (query) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
        .eq('status', 'published' as never)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30) as any
      if (error) throw error
      results = (data ?? []) as unknown as ArticleWithAuthor[]
    } catch (err) {
      console.warn('Search query failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        {/* Search header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            {query ? (
              <>Search results for <span className="text-blue-600 dark:text-blue-400">&ldquo;{query}&rdquo;</span></>
            ) : (
              'Search 026News'
            )}
          </h1>
          {query && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {results.length} article{results.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Search form (for re-searching) */}
        <form action="/search" method="GET" className="flex gap-3 mb-10">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search news, topics, journalists..."
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            🔍 Search
          </button>
        </form>

        {/* Results */}
        {!query ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-base">Enter a keyword to search articles</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800/40 rounded-2xl border dark:border-gray-800/60">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No results found</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              We couldn&apos;t find any articles matching &ldquo;{query}&rdquo;.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              ← Back to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(article => (
              <Link
                key={article.article_id}
                href={`/article/${article.slug}`}
                className="flex gap-4 bg-white dark:bg-gray-800/40 border border-transparent dark:border-gray-800/60 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {article.featured_image ? (
                    <Image
                      src={article.featured_image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-sm font-black text-gray-300 dark:text-gray-600 select-none">026NEWS</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      {article.category?.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(article.created_at)}
                    </span>
                  </div>
                  <h2 className="font-bold text-gray-900 dark:text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {article.content.substring(0, 140)}...
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>✍️ {article.author?.name}</span>
                    <span>👁 {formatNumber(article.views)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
