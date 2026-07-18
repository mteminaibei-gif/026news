'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CommentForm } from './CommentForm'
import { useUser } from '@/lib/hooks/useAuth'
import { formatDate } from '@/lib/utils'

interface CommentWithUser {
  comment_id: number
  comment_text: string
  created_at: string
  user: { name: string; profile_image: string | null } | null
}

interface Props {
  articleId: number
  initialComments: CommentWithUser[]
}

export function CommentsSection({ articleId, initialComments }: Props) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments)
  const { data: user, isLoading } = useUser()
  const pathname = usePathname()

  const handleCommentPosted = (newComment: CommentWithUser) => {
    setComments(prev => [newComment, ...prev])
  }

  return (
    <div
      className="rounded-2xl p-6 transition-colors"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>💬 {comments.length} Comments</h3>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {comments.map(comment => (
            <div key={comment.comment_id} className="flex gap-3 pb-4 last:border-0 last:pb-0 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {comment.user?.profile_image ? (
                <Image
                  src={comment.user.profile_image}
                  alt={comment.user.name}
                  width={38}
                  height={38}
                  className="rounded-full object-cover shrink-0 w-[38px] h-[38px]"
                  unoptimized
                />
              ) : (
                <div className="w-[38px] h-[38px] rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {comment.user?.name?.charAt(0) ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{comment.user?.name ?? 'Anonymous'}</span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form — registration required */}
      {isLoading || user ? (
        <CommentForm articleId={articleId} onCommentPosted={handleCommentPosted} />
      ) : (
        <div
          className="mt-4 rounded-2xl p-6 text-center transition-colors"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Sign in to join the conversation and share your thoughts.
          </p>
          <Link
            href={`/login?redirect=${pathname ?? '/article'}`}
            className="inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl text-sm transition-all"
            style={{ background: 'var(--primary)', color: 'var(--bg-elevated)', textDecoration: 'none' }}
          >
            Sign In to Comment
          </Link>
        </div>
      )}
    </div>
  )
}
