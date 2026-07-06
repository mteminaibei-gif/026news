import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatNumber } from '@/lib/utils'
import type { MockArticle } from '@/lib/mock-data'

interface ArticleCardProps {
  article: MockArticle
  variant?: 'default' | 'horizontal' | 'featured'
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden">
          <Image
            src={article.featured_image ?? 'https://picsum.photos/80/64'}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase text-orange-500 tracking-wider">
            {article.category?.name}
          </span>
          <h5 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mt-0.5">
            <Link href={`/article/${article.slug}`} className="hover:text-blue-600">{article.title}</Link>
          </h5>
          <p className="text-xs text-gray-400 mt-1">
            👁 {formatNumber(article.views)} · {formatDate(article.created_at)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <Link href={`/article/${article.slug}`}>
        <div className="relative aspect-video">
          <Image
            src={article.featured_image ?? 'https://picsum.photos/400/225'}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-4">
        <span className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
          {article.category?.name}
        </span>
        <h3 className="font-bold text-gray-900 leading-snug mt-1 mb-1.5 line-clamp-2">
          <Link href={`/article/${article.slug}`} className="hover:text-blue-600">{article.title}</Link>
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {article.content.substring(0, 110)}...
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>✍️ {article.author?.name}</span>
          <span>👁 {formatNumber(article.views)}</span>
          <span>📅 {formatDate(article.created_at)}</span>
        </div>
      </div>
    </article>
  )
}
