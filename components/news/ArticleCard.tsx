import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatNumber } from '@/lib/utils'

// Accepts both MockArticle and ArticleWithAuthor shapes
interface ArticleCardProps {
  article: {
    article_id: number
    title: string
    slug: string
    content: string
    featured_image?: string | null
    views: number
    created_at: string
    author?: { name: string; profile_image?: string | null } | null
    category?: { name: string } | null
  }
  variant?: 'default' | 'horizontal' | 'featured'
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 py-3 border-b border-gray-150 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all rounded-lg px-1">
        <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-105 dark:bg-gray-850 flex items-center justify-center border dark:border-gray-800/40">
          {article.featured_image ? (
            <Image src={article.featured_image} alt={article.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-orange-500/10 flex items-center justify-center">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 select-none tracking-wider">026</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase text-orange-500 tracking-wider">
            {article.category?.name}
          </span>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
            <Link href={`/article/${article.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{article.title}</Link>
          </h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            👁 {formatNumber(article.views)} · {formatDate(article.created_at)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-white dark:bg-gray-800/40 border border-transparent dark:border-gray-800/60 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <Link href={`/article/${article.slug}`}>
        <div className="relative aspect-video bg-gray-105 dark:bg-gray-850 overflow-hidden flex items-center justify-center border-b dark:border-gray-800/40">
          {article.featured_image ? (
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-orange-500/10 flex items-center justify-center">
              <span className="text-2xl font-black text-gray-300 dark:text-gray-700 select-none tracking-widest">026NEWS</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <span className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
          {article.category?.name}
        </span>
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug mt-1 mb-1.5 line-clamp-2">
          <Link href={`/article/${article.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{article.title}</Link>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {article.content.substring(0, 110)}...
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
          <span>✍️ {article.author?.name}</span>
          <span>👁 {formatNumber(article.views)}</span>
          <span>📅 {formatDate(article.created_at)}</span>
        </div>
      </div>
    </article>
  )
}
