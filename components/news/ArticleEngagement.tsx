'use client'

import { useArticleStats } from '@/lib/hooks/useArticleStats'
import { ArticleFloatBar } from './ArticleFloatBar'
import { Eye, Heart, MessageCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Props {
  articleId: number
  slug: string
  articleTitle?: string
  initialViews: number
  initialLikes: number
  initialComments: number
  initialSaves: number
}

/**
 * Client wrapper providing real-time views/likes/comments to both
 * the article header stats and the engagement float bar.
 */
export function ArticleEngagement({ articleId, slug, articleTitle, initialViews, initialLikes, initialComments, initialSaves }: Props) {
  const stats = useArticleStats(articleId, {
    views: initialViews,
    likes: initialLikes,
    comments: initialComments,
  })

  return (
    <>
      {/* Header stats */}
      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <Eye size={15} /> {formatNumber(stats.views)} views
        </span>
        <span className="flex items-center gap-1.5">
          <Heart size={15} /> {formatNumber(stats.likes)}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle size={15} /> {formatNumber(stats.comments)}
        </span>
      </div>

      {/* Engagement float bar */}
      <ArticleFloatBar
        variant="inline"
        articleId={articleId}
        slug={slug}
        articleTitle={articleTitle}
        initialLikes={stats.likes}
        initialSaves={initialSaves}
        commentCount={stats.comments}
      />
    </>
  )
}
