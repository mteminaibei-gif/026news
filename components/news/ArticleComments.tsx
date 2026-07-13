'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, MessageCircle } from 'lucide-react'
import { CommentForm } from './CommentForm'
import { useUser } from '@/lib/hooks/useAuth'
import { timeAgo } from '@/lib/utils'

interface CommentWithUser {
  comment_id: number
  comment_text: string
  created_at: string
  user: { name: string; profile_image: string | null } | null
}

function avatarColor(name?: string | null): string {
  const s = name ?? 'A'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return `oklch(55% 0.14 ${h})`
}

function initials(name?: string | null): string {
  const parts = (name ?? '?').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function ArticleComments({ articleId, initialComments }: { articleId: number; initialComments: CommentWithUser[] }) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments)
  const { data: user, isLoading } = useUser()
  const pathname = usePathname()

  const handlePosted = (c: CommentWithUser) => setComments(prev => [c, ...prev])

  return (
    <div>
      <div className="comments-header">
        <h2 className="comments-title">Discussion</h2>
        <span className="comments-count">{comments.length} comments</span>
      </div>

      {isLoading || user ? (
        <div className="comment-input-wrap">
          <div className="comment-input-avatar">{initials((user?.user_metadata?.name as string | undefined) ?? user?.email).slice(0, 2)}</div>
          <div className="comment-input-body">
            <CommentForm articleId={articleId} onCommentPosted={handlePosted} />
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 text-center mb-8"
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

      <div className="comment-thread">
        {comments.map(c => (
          <div className="comment" key={c.comment_id}>
            <div className="comment-avatar" style={{ background: avatarColor(c.user?.name) }}>{initials(c.user?.name)}</div>
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-name">{c.user?.name ?? 'Anonymous'}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
              <p className="comment-text">{c.comment_text}</p>
              <div className="comment-actions">
                <button className="comment-action" type="button">
                  <Heart size={13} /> 0
                </button>
                <button className="comment-action" type="button">
                  <MessageCircle size={13} /> Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
