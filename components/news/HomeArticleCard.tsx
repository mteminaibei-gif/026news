import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { ArticleWithAuthor } from '@/lib/supabase/types'
import { formatNumber, formatDate } from '@/lib/utils'

export function HomeArticleCard({ article }: { article: ArticleWithAuthor }) {
  const excerpt =
    article.excerpt?.trim() ||
    article.content.replace(/\n+/g, ' ').slice(0, 160).trim()

  const readTime = article.reading_time_minutes ?? 0
  const comments = article.analytics?.comments_count ?? 0
  const likes = article.likes ?? article.like_count ?? 0
  const shares = article.share_count ?? 0

  const image =
    article.featured_image ||
    `https://picsum.photos/seed/${article.article_id}/440/300`

  return (
    <article className="article-card">
      <div className="article-card-body">
        {article.category?.name && (
          <span className="article-card-cat">{article.category.name}</span>
        )}

        <h3 className="article-card-title">
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>

        <p className="article-card-excerpt">{excerpt}</p>

        <div className="article-card-footer">
          <div className="article-card-author">
            {article.author?.profile_image ? (
              <Image
                src={article.author.profile_image}
                alt={article.author.name}
                width={28}
                height={28}
                className="article-card-avatar"
                unoptimized
              />
            ) : (
              <span className="article-card-avatar article-card-avatar-fallback">
                {article.author?.name?.charAt(0) ?? 'S'}
              </span>
            )}
            <span className="article-card-author-name">
              {article.author?.name ?? 'Staff Writer'}
            </span>
            <span className="article-card-dot">·</span>
            <span>{formatDate(article.created_at)}</span>
            <span className="article-card-dot">·</span>
            <span>{readTime} min read</span>
          </div>

          <div className="article-card-stats">
            <span><Heart size={14} /> {formatNumber(likes)}</span>
            <span><MessageCircle size={14} /> {formatNumber(comments)}</span>
            <span><Share2 size={14} /> {formatNumber(shares)}</span>
          </div>
        </div>
      </div>

      <div className="article-card-image">
        <Image
          src={image}
          alt={article.title}
          fill
          className="object-cover"
          unoptimized
          sizes="220px"
        />
      </div>
    </article>
  )
}
