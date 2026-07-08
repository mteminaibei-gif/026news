import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

interface Props {
  currentSlug: string
  categoryName?: string | null
  limit?: number
}

type RelatedRow = {
  article_id: number; title: string; slug: string
  featured_image: string | null; created_at: string; views: number
  author: { name: string } | null
  category: { name: string } | null
}

export async function RelatedArticles({ currentSlug, categoryName, limit = 3 }: Props) {
  const supabase = await createClient()

  // First try same category
  let { data: rawRelated } = await supabase
    .from('articles')
    .select('article_id, title, slug, featured_image, created_at, views, author:users(name), category:categories(name)')
    .eq('status', 'published' as never)
    .neq('slug', currentSlug)
    .limit(limit * 2) // fetch extra, filter below

  let related = (rawRelated ?? []) as unknown as RelatedRow[]

  // Prioritise same-category results
  const sameCategory = related.filter(a => a.category?.name === categoryName)
  const others       = related.filter(a => a.category?.name !== categoryName)
  related = [...sameCategory, ...others].slice(0, limit)

  if (related.length === 0) return null

  return (
    <section aria-label="Related articles" className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <span className="text-orange-500">✨</span> You Might Also Like
        <span className="ml-auto text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          Recommended
        </span>
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {related.map(a => (
          <Link
            key={a.article_id}
            href={`/article/${a.slug}`}
            className="group bg-white dark:bg-gray-800/40 border border-transparent dark:border-gray-850 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video overflow-hidden bg-gray-105 dark:bg-gray-850 flex items-center justify-center">
              {a.featured_image ? (
                <Image
                  src={a.featured_image}
                  alt={a.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-orange-500/10 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-400 dark:text-gray-600 select-none tracking-wider">026NEWS</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                {a.category?.name}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {a.title}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1.5">
                <span>✍️ {a.author?.name}</span>
                <span>·</span>
                <span>{formatDate(a.created_at)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
