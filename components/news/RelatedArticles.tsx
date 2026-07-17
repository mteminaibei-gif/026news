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
    <section aria-label="Related articles" className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
      <h2 className="text-lg font-extrabold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span style={{ color: 'var(--accent)' }}>✨</span> You Might Also Like
        <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-muted)' }}>
          Recommended
        </span>
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {related.map(a => (
          <Link
            key={a.article_id}
            href={`/article/${a.slug}`}
            className="group rounded-xl overflow-hidden transition-shadow"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="relative aspect-video overflow-hidden bg-gray-105 dark:bg-gray-850 flex items-center justify-center">
              {a.featured_image ? (
                <Image
                  src={a.featured_image}
                  alt={a.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-orange-500/10 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-400 dark:text-gray-600 select-none tracking-wider">026connet!</span>
                </div>
              )}
              <div className="absolute top-2 left-2 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: 'var(--accent)' }}>
                {a.category?.name}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                {a.title}
              </h3>
              <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
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
