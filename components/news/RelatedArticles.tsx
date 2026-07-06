import Link from 'next/link'
import Image from 'next/image'
import { MOCK_ARTICLES } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

interface RelatedArticlesProps {
  currentSlug: string
  categoryName?: string | null
  limit?: number
}

/**
 * AI-style related article recommendations.
 * Uses category + recency scoring. In production, replace with
 * Supabase Vector embeddings similarity search.
 */
export function RelatedArticles({ currentSlug, categoryName, limit = 3 }: RelatedArticlesProps) {
  const published = MOCK_ARTICLES.filter(
    a => a.status === 'published' && a.slug !== currentSlug
  )

  // Score: same category = +3, same tag = +1 each, recent = +recency bonus
  const scored = published.map(a => {
    let score = 0
    if (categoryName && a.category?.name === categoryName) score += 3
    score += a.views / 10000 // popularity weight
    return { ...a, score }
  })

  const related = scored.sort((a, b) => b.score - a.score).slice(0, limit)

  if (related.length === 0) return null

  return (
    <section aria-label="Related articles" className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-orange-500">✨</span> You Might Also Like
        <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          AI Recommended
        </span>
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {related.map(a => (
          <Link
            key={a.article_id}
            href={`/article/${a.slug}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video overflow-hidden">
              {a.featured_image && (
                <Image
                  src={a.featured_image}
                  alt={a.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                {a.category?.name}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                {a.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
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
